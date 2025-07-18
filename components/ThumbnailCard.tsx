"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";

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
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isImage = file.mimeType.startsWith("image/");
  
  const MAX_RETRIES = 2;
  const LOAD_TIMEOUT = 10000; // 10 seconds
  
  const handleCopyLink = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/i/${file.slug}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      logger.debug('Link copied to clipboard', { fileId: file.id, slug: file.slug });
    } catch (err) {
      logger.error('Failed to copy link', err as Error, { fileId: file.id, slug: file.slug });
    }
  }, [file.slug, file.id]);
  
  const handleImageLoad = useCallback(() => {
    if (loadStartTime) {
      const loadTime = Date.now() - loadStartTime;
      logger.logImageLoad(file.fileUrl, true, loadTime);
    }
    
    setImageLoaded(true);
    setIsLoading(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [file.fileUrl, loadStartTime]);
  
  const handleImageError = useCallback(() => {
    if (loadStartTime) {
      const loadTime = Date.now() - loadStartTime;
      logger.logImageLoad(file.fileUrl, false, loadTime);
    }
    
    setIsLoading(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Retry logic
    if (retryCount < MAX_RETRIES) {
      logger.debug('Retrying image load', { 
        fileId: file.id, 
        retryCount: retryCount + 1, 
        maxRetries: MAX_RETRIES 
      });
      
      setRetryCount(prev => prev + 1);
      setImageError(false);
      
      // Retry after a short delay
      setTimeout(() => {
        if (imageRef.current) {
          setIsLoading(true);
          setLoadStartTime(Date.now());
          // Force reload by changing src
          imageRef.current.src = `${file.fileUrl}?w=300&h=300&fit=crop&retry=${retryCount + 1}`;
        }
      }, 1000 * (retryCount + 1)); // Progressive delay
    } else {
      logger.warn('Image load failed after retries', { 
        fileId: file.id, 
        retryCount, 
        maxRetries: MAX_RETRIES 
      });
      setImageError(true);
    }
  }, [file.fileUrl, file.id, retryCount, loadStartTime]);
  
  const startImageLoad = useCallback(() => {
    setIsLoading(true);
    setLoadStartTime(Date.now());
    
    logger.debug('Starting image load', { 
      fileId: file.id,
      imageUrl: file.fileUrl,
      retryCount 
    });
    
    // Set timeout for image loading
    timeoutRef.current = setTimeout(() => {
      logger.warn('Image load timeout', { 
        fileId: file.id, 
        timeout: LOAD_TIMEOUT,
        retryCount 
      });
      handleImageError();
    }, LOAD_TIMEOUT);
  }, [file.id, file.fileUrl, retryCount, handleImageError]);
  
  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="group relative bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 aspect-square touch-target">
      {/* Main content area */}
      <Link 
        href={`/i/${file.slug}`}
        className="block w-full h-full"
        prefetch={false}
        aria-label={`View ${file.originalName}`}
      >
        <div className="w-full h-full flex items-center justify-center bg-surface relative">
          {isImage && !imageError ? (
            <>
              {/* Image skeleton loader */}
              {(!imageLoaded || isLoading) && (
                <div className="absolute inset-0 skeleton">
                  <div className="animate-pulse bg-gray-200 w-full h-full flex items-center justify-center">
                    <div className="text-gray-400 text-sm">
                      {isLoading ? 'Loading...' : 'Loading image'}
                    </div>
                  </div>
                </div>
              )}
              <img
                ref={imageRef}
                src={`${file.fileUrl}?w=300&h=300&fit=crop&t=${Date.now()}`}
                alt={file.originalName}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                onLoad={handleImageLoad}
                onError={handleImageError}
                onLoadStart={startImageLoad}
              />
              {/* Retry indicator */}
              {retryCount > 0 && retryCount < MAX_RETRIES && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  Retry {retryCount}/{MAX_RETRIES}
                </div>
              )}
            </>
          ) : (
            /* File icon view */
            <div className="flex flex-col items-center justify-center text-center p-2 h-full">
              <div className="text-2xl sm:text-3xl md:text-4xl mb-2">
                {getFileIcon(file.mimeType)}
              </div>
              <div className="text-xs sm:text-sm font-medium text-card-foreground truncate w-full px-1 mb-1">
                {file.originalName}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(file.fileSize)}
              </div>
              {isImage && imageError && (
                <div className="text-xs text-red-500 mt-1">
                  Image failed to load
                </div>
              )}
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
        <div className="absolute top-2 left-2 right-2 bg-success text-success-foreground text-xs px-2 py-1 rounded text-center animate-fade-in z-10">
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