"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { CopyLinkButton } from "@/components/CopyLinkButton";

interface SwipeableFileCardProps {
  file: {
    id: string;
    slug: string;
    originalName: string;
    fileSize: number;
    uploadedAt: Date;
    mimeType: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  showCheckbox: boolean;
  formatFileSize: (bytes: number) => string;
  getFileIcon: (mimeType: string) => string;
}

export function SwipeableFileCard({ 
  file, 
  isSelected, 
  onSelect, 
  onDelete, 
  isDeleting, 
  showCheckbox,
  formatFileSize,
  getFileIcon 
}: SwipeableFileCardProps) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Only allow left swipe (negative values)
    if (diff < 0) {
      setSwipeDistance(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    if (swipeDistance < -50) {
      // Trigger delete
      onDelete();
    }
    
    setIsSwiping(false);
    setSwipeDistance(0);
  };

  return (
    <div
      ref={cardRef}
      className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group swipe-indicator ${
        isSelected ? 'border-blue-500 bg-blue-50' : ''
      } ${isSwiping ? 'swiping' : ''}`}
      style={{
        transform: `translateX(${swipeDistance}px)`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between p-4 md:flex-row mobile-file-card">
        <div className="flex items-center space-x-3 flex-1 mobile-file-info">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300 z-10 mobile-touch-target"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <Link 
            href={`/i/${file.slug}`}
            className="flex items-center space-x-3 flex-1 hover:text-blue-600 transition-colors"
          >
            <span className="text-xl">
              {getFileIcon(file.mimeType)}
            </span>
            <div className="flex-1">
              <div className="font-medium text-gray-900 group-hover:text-blue-600">
                {file.originalName}
              </div>
              <div className="text-xs text-gray-500 space-x-3 md:space-x-3 flex flex-col md:flex-row md:space-y-0 space-y-1">
                <span>{formatFileSize(file.fileSize)}</span>
                <span>
                  {new Date(file.uploadedAt).toLocaleDateString()} at {new Date(file.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </Link>
        </div>
        <div className="flex space-x-2 z-10 mobile-file-actions">
          <CopyLinkButton 
            slug={file.slug}
            className="px-3 py-2 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 mobile-touch-target md:px-2 md:py-1"
          />
          {showCheckbox && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="px-3 py-2 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50 mobile-touch-target md:px-2 md:py-1"
            >
              {isDeleting ? "..." : "Delete"}
            </button>
          )}
        </div>
      </div>
      
      {/* Swipe hint for mobile */}
      {showCheckbox && (
        <div className="md:hidden text-xs text-gray-400 text-center pb-2">
          ← Swipe left to delete
        </div>
      )}
    </div>
  );
}