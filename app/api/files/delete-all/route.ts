import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db, files } from "@/lib/db";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all files from database
    const allFiles = await db.select().from(files);

    if (allFiles.length === 0) {
      return NextResponse.json({ 
        success: true, 
        deletedCount: 0,
        message: "No files to delete"
      });
    }

    // Delete from UploadThing
    const fileKeys = allFiles.map(file => file.fileKey);
    await utapi.deleteFiles(fileKeys);

    // Delete all files from database
    await db.delete(files);

    return NextResponse.json({ 
      success: true, 
      deletedCount: allFiles.length 
    });
  } catch (error) {
    console.error("Delete all files error:", error);
    return NextResponse.json({ error: "Failed to delete all files" }, { status: 500 });
  }
}