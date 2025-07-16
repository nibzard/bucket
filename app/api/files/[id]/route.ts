import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db, files } from "@/lib/db";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = params.id;
    
    // Get file info from database
    const fileRecord = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (fileRecord.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = fileRecord[0];

    // Delete from UploadThing
    await utapi.deleteFiles(file.fileKey);

    // Delete from database
    await db.delete(files).where(eq(files.id, fileId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}