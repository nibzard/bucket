import { db, files } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CopyCurrentUrlButton } from "@/components/CopyCurrentUrlButton";

async function getFileBySlug(slug: string) {
  const result = await db
    .select()
    .from(files)
    .where(eq(files.slug, slug))
    .limit(1);
  
  return result[0] || null;
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

export default async function FileViewPage({
  params,
}: {
  params: { slug: string };
}) {
  const file = await getFileBySlug(params.slug);

  if (!file) {
    notFound();
  }

  const isImage = file.mimeType.startsWith("image/");
  const isVideo = file.mimeType.startsWith("video/");
  const isAudio = file.mimeType.startsWith("audio/");
  const isPdf = file.mimeType.includes("pdf");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/files"
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            ← Back to all files
          </Link>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-3xl">{getFileIcon(file.mimeType)}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {file.originalName}
              </h1>
              <div className="text-sm text-gray-500 space-x-4">
                <span>{formatFileSize(file.fileSize)}</span>
                <span>
                  Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex space-x-2">
              <a
                href={file.fileUrl}
                download={file.originalName}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Download
              </a>
              <CopyCurrentUrlButton className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600" />
            </div>
          </div>

          <div className="border-t pt-6">
            {isImage && (
              <div className="text-center">
                <img
                  src={file.fileUrl}
                  alt={file.originalName}
                  className="max-w-full h-auto rounded-lg shadow-md"
                />
              </div>
            )}

            {isVideo && (
              <div className="text-center">
                <video
                  controls
                  className="max-w-full h-auto rounded-lg shadow-md"
                  preload="metadata"
                >
                  <source src={file.fileUrl} type={file.mimeType} />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {isAudio && (
              <div className="text-center">
                <audio controls className="w-full max-w-md">
                  <source src={file.fileUrl} type={file.mimeType} />
                  Your browser does not support the audio tag.
                </audio>
              </div>
            )}

            {isPdf && (
              <div className="text-center">
                <iframe
                  src={file.fileUrl}
                  className="w-full h-96 border rounded-lg"
                  title={file.originalName}
                />
              </div>
            )}

            {!isImage && !isVideo && !isAudio && !isPdf && (
              <div className="text-center text-gray-500 py-8">
                <p>Preview not available for this file type.</p>
                <p>Click Download to view the file.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}