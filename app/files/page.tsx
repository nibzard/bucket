import { db, files } from "@/lib/db";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { CopyLinkButton } from "@/components/CopyLinkButton";

async function getFiles() {
  return await db
    .select()
    .from(files)
    .orderBy(desc(files.uploadedAt))
    .limit(100);
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎥";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.startsWith("text/")) return "📝";
  return "📎";
}

export default async function FilesPage() {
  const allFiles = await getFiles();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Files</h1>
          <p className="text-gray-600">
            Public file listing - {allFiles.length} files total
          </p>
        </div>

        <div className="mb-6">
          <Link
            href="/upload"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Upload New Files
          </Link>
        </div>

        {allFiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No files uploaded yet.</p>
            <Link
              href="/upload"
              className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Upload Your First File
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {allFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getFileIcon(file.mimeType)}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {file.originalName}
                      </h3>
                      <div className="text-sm text-gray-500 space-x-4">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/f/${file.slug}`}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      View
                    </Link>
                    <a
                      href={file.fileUrl}
                      download={file.originalName}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Download
                    </a>
                    <CopyLinkButton 
                      slug={file.slug}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}