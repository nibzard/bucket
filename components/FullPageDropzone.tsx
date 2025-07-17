"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";

interface FullPageDropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
  isUploading: boolean;
  children: React.ReactNode;
}

export function FullPageDropzone({ onDrop, isUploading, children }: FullPageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragEnter = useCallback(() => {
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: any) => {
    // Only hide overlay if leaving the window/document
    if (!e.relatedTarget) {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragActive(false);
    onDrop(acceptedFiles);
  }, [onDrop]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    onDragEnter,
    onDragLeave,
    noClick: true,
    noKeyboard: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
      'audio/*': ['.mp3', '.wav', '.flac', '.aac'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md', '.json', '.xml', '.csv'],
      'application/*': ['.zip', '.rar', '.7z', '.tar', '.gz'],
    },
  });

  return (
    <div {...getRootProps()} className="relative min-h-screen">
      <input {...getInputProps()} />
      
      {/* Hidden file input for mobile */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,video/*,audio/*,application/pdf,text/*,application/*"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            onDrop(files);
          }
        }}
      />
      
      {children}
      
      {/* Mobile Upload FAB */}
      <div className="md:hidden fixed bottom-6 left-6 z-40">
        <button
          onClick={handleFileSelect}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 touch-target"
          aria-label="Upload files"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      {/* Drag Overlay */}
      {isDragActive && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-center h-full p-4">
            <div className="bg-white rounded-lg p-6 md:p-8 shadow-xl border-2 border-dashed border-blue-500 max-w-md w-full animate-bounce-gentle">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 md:h-16 md:w-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  Drop files to upload
                </h3>
                <p className="text-sm md:text-base text-gray-500">
                  Release to start uploading
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-center h-full p-4">
            <div className="bg-white rounded-lg p-6 md:p-8 shadow-xl max-w-md w-full">
              <div className="text-center">
                {/* Upload Animation */}
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  Uploading files...
                </h3>
                <p className="text-sm md:text-base text-gray-500 mb-4">
                  Please wait while your files are being uploaded
                </p>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                
                <p className="text-xs text-gray-400">
                  Do not close this window
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}