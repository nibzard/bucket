"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

interface UploadAreaProps {
  onDrop: (acceptedFiles: File[]) => void;
  isUploading?: boolean;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  disabled?: boolean;
  className?: string;
}

export function UploadArea({
  onDrop,
  isUploading = false,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
    'audio/*': ['.mp3', '.wav', '.flac', '.aac'],
    'application/pdf': ['.pdf'],
    'text/*': ['.txt', '.md', '.json', '.xml', '.csv'],
    'application/*': ['.zip', '.rar', '.7z', '.tar', '.gz'],
  },
  disabled = false,
  className = "",
}: UploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragEnter = useCallback(() => {
    if (!disabled && !isUploading) {
      setDragActive(true);
    }
  }, [disabled, isUploading]);

  const onDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragActive(false);
    
    if (acceptedFiles.length > 0) {
      onDrop(acceptedFiles);
    }
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        return `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`;
      });
      console.warn('Rejected files:', errors);
    }
  }, [onDrop]);

  const handleFileSelect = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    onDragEnter,
    onDragLeave,
    maxFiles,
    maxSize,
    accept,
    disabled: disabled || isUploading,
    noClick: true,
    noKeyboard: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAcceptedFileTypes = () => {
    const types = Object.keys(accept);
    if (types.length <= 2) {
      return types.join(' and ');
    }
    return types.slice(0, -1).join(', ') + ', and ' + types.slice(-1);
  };

  return (
    <>
      {/* Hidden file input for mobile */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        className="hidden"
        accept={Object.values(accept).flat().join(',')}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            onDrop(files);
          }
        }}
      />

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
          dragActive || isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50'
        } ${
          disabled || isUploading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-gray-400 cursor-pointer'
        } ${className}`}
      >
        <input {...getInputProps()} />
        
        <div className="p-6 md:p-8 text-center">
          {isUploading ? (
            /* Uploading state */
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Uploading files...
                </h3>
                <p className="text-sm text-gray-500">
                  Please wait while your files are being processed
                </p>
              </div>
            </div>
          ) : (
            /* Default state */
            <div className="space-y-4">
              <div className="mx-auto">
                <svg 
                  className={`h-12 w-12 md:h-16 md:w-16 mx-auto transition-colors ${
                    dragActive || isDragActive ? 'text-blue-500' : 'text-gray-400'
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  {dragActive || isDragActive ? 'Drop files here' : 'Upload files'}
                </h3>
                <p className="text-sm md:text-base text-gray-500 mb-4">
                  {dragActive || isDragActive
                    ? 'Release to upload your files'
                    : 'Drag and drop files here, or click to select files'
                  }
                </p>
                
                {/* Mobile upload button */}
                <div className="space-y-3">
                  <button
                    onClick={handleFileSelect}
                    disabled={disabled || isUploading}
                    className="touch-target inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Choose files
                  </button>
                  
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>
                      Up to {maxFiles} file{maxFiles > 1 ? 's' : ''}, {formatFileSize(maxSize)} max each
                    </div>
                    <div>
                      Supports: {getAcceptedFileTypes()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Drag overlay */}
        {(dragActive || isDragActive) && !isUploading && (
          <div className="absolute inset-0 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <div className="text-blue-600 font-medium">
              Drop files here to upload
            </div>
          </div>
        )}
      </div>
    </>
  );
}