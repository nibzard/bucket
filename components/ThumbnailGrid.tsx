"use client";

import { ThumbnailCard } from "@/components/ThumbnailCard";

interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  slug: string;
  uploadedAt: Date;
}

interface ThumbnailGridProps {
  files: FileRecord[];
}

export function ThumbnailGrid({ files }: ThumbnailGridProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-base md:text-lg">No files to display</p>
      </div>
    );
  }

  return (
    <div className="mobile-safe-padding">
      {/* Mobile-first responsive grid */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-1 xs:gap-2 sm:gap-3 md:gap-4">
        {files.map((file, index) => (
          <div
            key={file.id}
            className="animate-fade-in"
            style={{
              animationDelay: `${Math.min(index * 50, 500)}ms`,
            }}
          >
            <ThumbnailCard file={file} />
          </div>
        ))}
      </div>
      
      {/* Load more indicator space for future infinite scroll */}
      <div className="mt-8 text-center">
        <div className="text-sm text-gray-500">
          Showing {files.length} files
        </div>
      </div>
    </div>
  );
}