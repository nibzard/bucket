import { db, files } from "@/lib/db";
import { desc } from "drizzle-orm";
import { ThumbnailGrid } from "@/components/ThumbnailGrid";

async function getAllFiles() {
  const allFiles = await db
    .select()
    .from(files)
    .orderBy(desc(files.uploadedAt));

  return allFiles;
}

export default async function GalleryPage() {
  const allFiles = await getAllFiles();

  return (
    <main className="min-h-screen">
      <div className="mobile-safe-padding">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">Gallery</h1>
            <p className="text-sm md:text-base text-gray-600">
              {allFiles.length} {allFiles.length === 1 ? 'file' : 'files'} total
            </p>
          </div>

          <ThumbnailGrid files={allFiles} />
        </div>
      </div>
    </main>
  );
}