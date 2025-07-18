import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db, files } from "@/lib/db";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { serverLogger, generateRequestId } from "@/lib/logger";

const utapi = new UTApi();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  serverLogger.info('File delete request started', {
    requestId,
    method: 'DELETE',
    url: request.url,
    fileId: params.id,
    userAgent: request.headers.get('user-agent')
  });

  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      serverLogger.warn('Unauthorized delete attempt', {
        requestId,
        fileId: params.id,
        userAgent: request.headers.get('user-agent')
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = params.id;
    
    serverLogger.info('Authenticated delete request', {
      requestId,
      fileId,
      userId: session.user?.email || undefined
    });

    // Get file info from database
    const dbStartTime = Date.now();
    const fileRecord = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);
    
    const dbQueryTime = Date.now() - dbStartTime;
    serverLogger.info('Database lookup completed', {
      requestId,
      fileId,
      foundFiles: fileRecord.length,
      queryTime: `${dbQueryTime}ms`
    });

    if (fileRecord.length === 0) {
      // Log additional debugging info for 404s
      serverLogger.warn('File not found - checking for slug confusion', {
        requestId,
        fileId,
        queryTime: `${dbQueryTime}ms`,
        searchedBy: 'id'
      });
      
      // Check if this might be a slug instead of an id
      const slugRecord = await db
        .select()
        .from(files)
        .where(eq(files.slug, fileId))
        .limit(1);
      
      if (slugRecord.length > 0) {
        serverLogger.error('ID/Slug confusion detected', new Error('ID/Slug mismatch detected'), {
          requestId,
          providedId: fileId,
          foundBySlug: true,
          actualId: slugRecord[0].id,
          actualSlug: slugRecord[0].slug,
          filename: slugRecord[0].filename
        });
        
        return NextResponse.json({ 
          error: "File not found", 
          debug: "ID/Slug mismatch detected" 
        }, { status: 404 });
      }
      
      serverLogger.warn('File not found by id or slug', {
        requestId,
        fileId,
        totalTime: `${Date.now() - startTime}ms`
      });
      
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = fileRecord[0];
    
    serverLogger.info('File found, proceeding with deletion', {
      requestId,
      fileId,
      filename: file.filename,
      fileKey: file.fileKey,
      slug: file.slug,
      fileSize: file.fileSize
    });

    // Delete from UploadThing
    const utStartTime = Date.now();
    await utapi.deleteFiles(file.fileKey);
    const utDeleteTime = Date.now() - utStartTime;
    
    serverLogger.info('UploadThing deletion completed', {
      requestId,
      fileId,
      fileKey: file.fileKey,
      deleteTime: `${utDeleteTime}ms`
    });

    // Delete from database
    const dbDeleteStartTime = Date.now();
    await db.delete(files).where(eq(files.id, fileId));
    const dbDeleteTime = Date.now() - dbDeleteStartTime;
    
    const totalTime = Date.now() - startTime;
    serverLogger.info('File deletion completed successfully', {
      requestId,
      fileId,
      filename: file.filename,
      totalTime: `${totalTime}ms`,
      utDeleteTime: `${utDeleteTime}ms`,
      dbDeleteTime: `${dbDeleteTime}ms`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    serverLogger.error('File deletion failed', error as Error, {
      requestId,
      fileId: params.id,
      totalTime: `${totalTime}ms`,
      errorType: (error as Error).constructor.name
    });
    
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}