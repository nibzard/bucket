"use client";

import { useState, useRef, useCallback } from "react";
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
  const [swipeState, setSwipeState] = useState({
    isActive: false,
    startX: 0,
    currentX: 0,
    startTime: 0,
  });
  const [showToast, setShowToast] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 60;
  const TAP_THRESHOLD = 10;
  const TAP_TIME_THRESHOLD = 300;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/i/${file.slug}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, [file.slug]);

  const resetSwipe = useCallback(() => {
    setSwipeState(prev => ({ ...prev, isActive: false, currentX: 0 }));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeState({
      isActive: true,
      startX: touch.clientX,
      currentX: touch.clientX,
      startTime: Date.now(),
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.isActive) return;
    
    const touch = e.touches[0];
    setSwipeState(prev => ({ ...prev, currentX: touch.clientX }));
  }, [swipeState.isActive]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isActive) return;

    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaTime = Date.now() - swipeState.startTime;
    const distance = Math.abs(deltaX);

    // Handle tap (quick touch with minimal movement)
    if (distance < TAP_THRESHOLD && deltaTime < TAP_TIME_THRESHOLD) {
      handleCopyLink();
      resetSwipe();
      return;
    }

    // Handle swipe gestures
    if (distance > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // Right swipe - select/deselect
        onSelect();
      } else {
        // Left swipe - delete
        onDelete();
      }
    }

    resetSwipe();
  }, [swipeState, handleCopyLink, resetSwipe, onSelect, onDelete]);

  const swipeDistance = swipeState.isActive ? swipeState.currentX - swipeState.startX : 0;
  const clampedDistance = Math.max(-120, Math.min(120, swipeDistance));
  const isSwipeActive = swipeState.isActive && Math.abs(swipeDistance) > TAP_THRESHOLD;

  return (
    <div
      ref={cardRef}
      data-testid="file-card"
      className={`swipe-container bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group ${
        isSelected ? 'border-accent bg-accent/5' : 'border-border hover:border-border-hover'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left swipe action - DELETE */}
      {isSwipeActive && swipeDistance < -TAP_THRESHOLD && (
        <div className="swipe-action swipe-action-delete w-20" style={{ opacity: Math.min(1, Math.abs(swipeDistance) / SWIPE_THRESHOLD) }}>
          <div className="text-white font-semibold text-sm">
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="flex flex-col items-center space-y-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-xs">Delete</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Right swipe action - SELECT */}
      {isSwipeActive && swipeDistance > TAP_THRESHOLD && (
        <div className="swipe-action swipe-action-select w-20" style={{ opacity: Math.min(1, swipeDistance / SWIPE_THRESHOLD) }}>
          <div className="text-white font-semibold text-sm">
            <div className="flex flex-col items-center space-y-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSelected ? "M6 18L18 6M6 6l12 12" : "M5 13l4 4L19 7"} />
              </svg>
              <span className="text-xs">{isSelected ? 'Deselect' : 'Select'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div 
        className={`swipe-content relative bg-card rounded-lg z-10 ${isSwipeActive ? 'swiping' : ''}`}
        style={{ transform: `translateX(${clampedDistance}px)` }}
      >
        {/* Mobile layout */}
        <div className="p-3 md:p-4">
          <div className="flex items-center space-x-3">
            {/* Selection checkbox - hidden on mobile by default */}
            {showCheckbox && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="hidden sm:block w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${file.originalName}`}
              />
            )}

            {/* File icon */}
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center w-10 h-10 text-sm font-bold text-muted-foreground bg-surface rounded-lg">
                {getFileIcon(file.mimeType)}
              </span>
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-card-foreground truncate group-hover:text-accent transition-colors">
                {file.originalName}
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{formatFileSize(file.fileSize)}</span>
                <span>•</span>
                <span>
                  {new Date(file.uploadedAt).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric',
                    year: new Date(file.uploadedAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                  })}
                </span>
              </div>
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center space-x-2">
              <CopyLinkButton 
                slug={file.slug}
                className="touch-target px-3 py-2 bg-surface text-card-foreground rounded-lg hover:bg-surface-hover text-sm transition-colors relative z-10"
              />
              {showCheckbox && (
                <button
                  data-testid="delete-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  disabled={isDeleting}
                  className="touch-target px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 text-sm transition-colors relative z-10"
                  aria-label={`Delete ${file.originalName}`}
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
              )}
            </div>

            {/* Mobile link indicator */}
            <div className="sm:hidden flex-shrink-0">
              <Link 
                href={`/i/${file.slug}`}
                className="touch-target p-2 text-muted-foreground hover:text-card-foreground transition-colors"
                prefetch={false}
                aria-label={`View ${file.originalName}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop hover overlay */}
        <Link 
          href={`/i/${file.slug}`}
          className="hidden md:block absolute inset-0 z-0"
          prefetch={false}
          aria-label={`View ${file.originalName}`}
        />
      </div>
      
      {/* Toast notification */}
      {showToast && (
        <div className="absolute top-2 left-2 right-2 bg-success text-success-foreground text-xs px-3 py-2 rounded-lg text-center animate-fade-in z-30">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Link copied to clipboard!</span>
          </div>
        </div>
      )}
    </div>
  );
}