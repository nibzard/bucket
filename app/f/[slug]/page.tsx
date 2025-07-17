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
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType.startsWith("video/")) return "VID";
  if (mimeType.startsWith("audio/")) return "AUD";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.startsWith("text/")) return "TXT";
  return "FILE";
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
    <main className="min-h-screen">
      <div className="mobile-safe-padding">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
          {/* Back navigation */}
          <div className="mb-6 md:mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium touch-target"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to files
            </Link>
          </div>

          {/* File details card */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 md:p-6 border-b">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-12 h-12 text-lg font-bold text-gray-600 bg-gray-100 rounded-lg">
                    {getFileIcon(file.mimeType)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl md:text-2xl font-bold text-gray-900 break-words">
                        {file.originalName}
                      </h1>
                      <div className="mt-1 space-y-1 text-xs md:text-sm text-gray-500">
                        <div>{formatFileSize(file.fileSize)}</div>
                        <div>
                          Uploaded {new Date(file.uploadedAt).toLocaleDateString()} at {new Date(file.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <CopyCurrentUrlButton className="touch-target p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </CopyCurrentUrlButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
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
                <div className="text-center text-gray-500 py-12">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-base md:text-lg mb-2">Preview not available for this file type</p>
                  <p className="text-sm">Download the file to view its contents</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 md:p-6 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <a
                  href={file.fileUrl}
                  download={file.originalName}
                  className="touch-target inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}