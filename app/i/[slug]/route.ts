import { NextRequest, NextResponse } from "next/server";
import { db, files } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    // Get file info from database
    const result = await db
      .select()
      .from(files)
      .where(eq(files.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return new NextResponse("File not found", { status: 404 });
    }

    const file = result[0];

    // Redirect to the actual file URL
    return NextResponse.redirect(file.fileUrl, { status: 302 });
  } catch (error) {
    console.error("Redirect error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}