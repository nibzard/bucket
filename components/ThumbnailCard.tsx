"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

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

interface ThumbnailCardProps {
  file: FileRecord;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎥";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.startsWith("text/")) return "📝";
  return "📁";
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function ThumbnailCard({ file }: ThumbnailCardProps) {
  const [showToast, setShowToast] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isImage = file.mimeType.startsWith("image/");
  
  const handleCopyLink = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/i/${file.slug}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }, [file.slug]);

  return (
    <div className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 aspect-square touch-target">
      {/* Main content area */}
      <Link 
        href={`/i/${file.slug}`}
        className="block w-full h-full"
        prefetch={false}
        aria-label={`View ${file.originalName}`}
      >
        <div className="w-full h-full flex items-center justify-center bg-gray-50 relative">
          {isImage && !imageError ? (
            <>
              {/* Image skeleton loader */}
              {!imageLoaded && (
                <div className="absolute inset-0 skeleton" />
              )}
              <img
                src={`${file.fileUrl}?w=300&h=300&fit=crop`}
                alt={file.originalName}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            /* File icon view */
            <div className="flex flex-col items-center justify-center text-center p-2 h-full">
              <div className="text-2xl sm:text-3xl md:text-4xl mb-2">
                {getFileIcon(file.mimeType)}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-700 truncate w-full px-1 mb-1">
                {file.originalName}
              </div>
              <div className="text-xs text-gray-500">
                {formatFileSize(file.fileSize)}
              </div>
            </div>
          )}
        </div>
        
        {/* Image overlay with file info */}
        {isImage && !imageError && imageLoaded && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="text-white text-xs sm:text-sm font-medium truncate">
              {file.originalName}
            </div>
            <div className="text-white/80 text-xs">
              {formatFileSize(file.fileSize)}
            </div>
          </div>
        )}
      </Link>

      {/* Copy link button - Mobile and desktop */}
      <button
        onClick={handleCopyLink}
        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70 touch-target"
        aria-label={`Copy link for ${file.originalName}`}
      >
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Mobile tap to copy indicator */}
      <div className="sm:hidden absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Tap to copy
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="absolute top-2 left-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded text-center animate-fade-in z-10">
          <div className="flex items-center justify-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Link copied!</span>
          </div>
        </div>
      )}
    </div>
  );
}