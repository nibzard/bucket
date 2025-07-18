import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db, files } from "@/lib/db";
import { inArray } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { serverLogger, generateRequestId } from "@/lib/logger";

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  serverLogger.info('Bulk delete request started', {
    requestId,
    method: 'POST',
    url: request.url
  });
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      serverLogger.warn('Unauthorized bulk delete attempt', {
        requestId,
        userAgent: request.headers.get('user-agent')
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileIds } = await request.json();
    
    serverLogger.info('Bulk delete request parsed', {
      requestId,
      fileCount: fileIds?.length || 0,
      userId: session.user?.email || undefined
    });
    
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      serverLogger.warn('Invalid file IDs in bulk delete', {
        requestId,
        fileIds: typeof fileIds,
        length: Array.isArray(fileIds) ? fileIds.length : 0
      });
      return NextResponse.json({ error: "No file IDs provided" }, { status: 400 });
    }

    // Get file info from database
    const dbStartTime = Date.now();
    const fileRecords = await db
      .select()
      .from(files)
      .where(inArray(files.id, fileIds));
    
    const dbQueryTime = Date.now() - dbStartTime;
    serverLogger.info('Database query completed', {
      requestId,
      requestedFiles: fileIds.length,
      foundFiles: fileRecords.length,
      queryTime: `${dbQueryTime}ms`
    });

    if (fileRecords.length === 0) {
      serverLogger.warn('No files found for bulk delete', {
        requestId,
        requestedFileIds: fileIds
      });
      return NextResponse.json({ error: "No files found" }, { status: 404 });
    }

    // Log file details
    const totalSize = fileRecords.reduce((sum, file) => sum + file.fileSize, 0);
    serverLogger.info('Files to delete', {
      requestId,
      files: fileRecords.map(f => ({ id: f.id, name: f.filename, size: f.fileSize })),
      totalSize: `${Math.round(totalSize / 1024 / 1024)}MB`
    });

    // Delete from UploadThing
    const utStartTime = Date.now();
    const fileKeys = fileRecords.map(file => file.fileKey);
    await utapi.deleteFiles(fileKeys);
    const utDeleteTime = Date.now() - utStartTime;
    
    serverLogger.info('UploadThing bulk delete completed', {
      requestId,
      fileCount: fileKeys.length,
      deleteTime: `${utDeleteTime}ms`
    });

    // Delete from database
    const dbDeleteStartTime = Date.now();
    await db.delete(files).where(inArray(files.id, fileIds));
    const dbDeleteTime = Date.now() - dbDeleteStartTime;
    
    serverLogger.info('Database bulk delete completed', {
      requestId,
      fileCount: fileRecords.length,
      deleteTime: `${dbDeleteTime}ms`
    });

    const totalTime = Date.now() - startTime;
    serverLogger.info('Bulk delete completed successfully', {
      requestId,
      deletedCount: fileRecords.length,
      totalTime: `${totalTime}ms`,
      utDeleteTime: `${utDeleteTime}ms`,
      dbDeleteTime: `${dbDeleteTime}ms`,
      totalSize: `${Math.round(totalSize / 1024 / 1024)}MB`
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: fileRecords.length 
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    serverLogger.error('Bulk delete failed', error as Error, {
      requestId,
      totalTime: `${totalTime}ms`,
      errorType: (error as Error).constructor.name
    });
    
    return NextResponse.json({ error: "Failed to delete files" }, { status: 500 });
  }
}