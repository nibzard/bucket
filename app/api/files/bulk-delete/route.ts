import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db, files } from "@/lib/db";
import { inArray } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileIds } = await request.json();
    
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: "No file IDs provided" }, { status: 400 });
    }

    // Get file info from database
    const fileRecords = await db
      .select()
      .from(files)
      .where(inArray(files.id, fileIds));

    if (fileRecords.length === 0) {
      return NextResponse.json({ error: "No files found" }, { status: 404 });
    }

    // Delete from UploadThing
    const fileKeys = fileRecords.map(file => file.fileKey);
    await utapi.deleteFiles(fileKeys);

    // Delete from database
    await db.delete(files).where(inArray(files.id, fileIds));

    return NextResponse.json({ 
      success: true, 
      deletedCount: fileRecords.length 
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Failed to delete files" }, { status: 500 });
  }
}