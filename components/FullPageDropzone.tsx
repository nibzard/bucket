"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface FullPageDropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
  isUploading: boolean;
  children: React.ReactNode;
}

export function FullPageDropzone({ onDrop, isUploading, children }: FullPageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    onDragEnter,
    onDragLeave,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div {...getRootProps()} className="relative min-h-screen">
      <input {...getInputProps()} />
      
      {children}
      
      {/* Drag Overlay */}
      {isDragActive && (
        <div className="fixed inset-0 z-50 bg-blue-500 bg-opacity-20 backdrop-blur-sm">
          <div className="flex items-center justify-center h-full">
            <div className="bg-white rounded-lg p-8 shadow-xl border-2 border-dashed border-blue-500">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Drop files anywhere to upload
                </h3>
                <p className="text-gray-500">
                  Release to start uploading
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="flex items-center justify-center h-full">
            <div className="bg-white rounded-lg p-8 shadow-xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Uploading files...
                </h3>
                <p className="text-gray-500">
                  Please wait while your files are being uploaded
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}