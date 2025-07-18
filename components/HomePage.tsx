"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadDropzone } from "@/lib/uploadthing";
import { uploadFiles } from "@/lib/uploadthing-utils";
import { UploadPageCopyButton } from "@/components/UploadPageCopyButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { Pagination } from "@/components/Pagination";
import { Toast } from "@/components/Toast";
import { FullPageDropzone } from "@/components/FullPageDropzone";
import { SwipeableFileCard } from "@/components/SwipeableFileCard";

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

interface HomePageProps {
  initialFiles: FileRecord[];
  totalCount: number;
  currentPage: number;
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

export function HomePage({ initialFiles, totalCount, currentPage }: HomePageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<FileRecord[]>(initialFiles);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    slug: string;
    url: string;
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [actualTotalCount, setActualTotalCount] = useState(totalCount);
  
  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    console.log(`[HomePage] Page change requested: ${currentPage} -> ${page}`);
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    router.push(url.toString());
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(file => file.id));
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    
    console.log(`[HomePage] Deleting file: ${fileId}`);
    
    // Optimistic update - remove file immediately
    const originalFiles = files;
    const fileToDelete = files.find(f => f.id === fileId);
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setSelectedFiles(prev => prev.filter(id => id !== fileId));
    setActualTotalCount(prev => prev - 1);
    
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        // Revert on failure
        console.error(`[HomePage] Delete failed for file ${fileId}:`, response.status);
        setFiles(originalFiles);
        setActualTotalCount(prev => prev + 1);
        setToastMessage("Failed to delete file");
        setShowToast(true);
      } else {
        console.log(`[HomePage] File deleted successfully: ${fileId}`);
        setToastMessage("File deleted successfully");
        setShowToast(true);
        // No hard refresh - state is already updated optimistically
      }
    } catch (error) {
      // Revert on error
      console.error(`[HomePage] Delete error for file ${fileId}:`, error);
      setFiles(originalFiles);
      setActualTotalCount(prev => prev + 1);
      setToastMessage("Error deleting file");
      setShowToast(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}?`)) return;
    
    console.log(`[HomePage] Bulk deleting ${selectedFiles.length} files:`, selectedFiles);
    
    // Optimistic update - remove files immediately
    const originalFiles = files;
    const originalSelected = selectedFiles;
    const filesToDelete = files.filter(file => selectedFiles.includes(file.id));
    setFiles(prev => prev.filter(file => !selectedFiles.includes(file.id)));
    setSelectedFiles([]);
    setActualTotalCount(prev => prev - originalSelected.length);
    setIsDeleting(true);
    
    try {
      const response = await fetch("/api/files/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileIds: originalSelected }),
      });
      
      if (!response.ok) {
        // Revert on failure
        console.error(`[HomePage] Bulk delete failed:`, response.status);
        setFiles(originalFiles);
        setSelectedFiles(originalSelected);
        setActualTotalCount(prev => prev + originalSelected.length);
        setToastMessage("Failed to delete files");
        setShowToast(true);
      } else {
        console.log(`[HomePage] Bulk delete successful: ${originalSelected.length} files`);
        setToastMessage(`${originalSelected.length} file${originalSelected.length > 1 ? 's' : ''} deleted successfully`);
        setShowToast(true);
        // No hard refresh - state is already updated optimistically
      }
    } catch (error) {
      // Revert on error
      console.error(`[HomePage] Bulk delete error:`, error);
      setFiles(originalFiles);
      setSelectedFiles(originalSelected);
      setActualTotalCount(prev => prev + originalSelected.length);
      setToastMessage("Error deleting files");
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${actualTotalCount} files? This action cannot be undone.`)) return;
    
    console.log(`[HomePage] Deleting all ${actualTotalCount} files`);
    
    // Optimistic update - clear all files immediately
    const originalFiles = files;
    const originalSelected = selectedFiles;
    const originalCount = actualTotalCount;
    setFiles([]);
    setSelectedFiles([]);
    setActualTotalCount(0);
    setIsDeleting(true);
    
    try {
      const response = await fetch("/api/files/delete-all", {
        method: "POST",
      });
      
      if (!response.ok) {
        // Revert on failure
        console.error(`[HomePage] Delete all failed:`, response.status);
        setFiles(originalFiles);
        setSelectedFiles(originalSelected);
        setActualTotalCount(originalCount);
        setToastMessage("Failed to delete all files");
        setShowToast(true);
      } else {
        console.log(`[HomePage] Delete all successful: ${originalCount} files`);
        setToastMessage(`All ${originalCount} files deleted successfully`);
        setShowToast(true);
        // No hard refresh - state is already updated optimistically
      }
    } catch (error) {
      // Revert on error
      console.error(`[HomePage] Delete all error:`, error);
      setFiles(originalFiles);
      setSelectedFiles(originalSelected);
      setActualTotalCount(originalCount);
      setToastMessage("Error deleting all files");
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCustomUpload = async (acceptedFiles: File[]) => {
    if (!session) return;
    
    console.log(`[HomePage] Uploading ${acceptedFiles.length} files`);
    setIsUploading(true);
    setUploadMessage("");
    
    try {
      const res = await uploadFiles("fileUploader", {
        files: acceptedFiles,
      });
      
      if (res) {
        console.log(`[HomePage] Upload successful: ${res.length} files`);
        const newFiles = res.map((file) => ({
          name: file.name,
          slug: file.serverData.slug,
          url: file.ufsUrl,
        }));
        setUploadedFiles((prev) => [...prev, ...newFiles]);
        
        // Auto-copy link for single file uploads
        if (res.length === 1) {
          navigator.clipboard.writeText(`${window.location.origin}/i/${res[0].serverData.slug}`)
            .then(() => {
              setToastMessage("Link copied to clipboard!");
              setShowToast(true);
            })
            .catch(() => {
              setToastMessage("Upload complete!");
              setShowToast(true);
            });
        } else {
          setUploadMessage(`Uploaded ${res.length} files successfully!`);
        }
        
        // Add new files to the current list with animation
        const newFileObjects = res.map((file) => ({
          id: file.serverData.slug, // temporary ID using slug
          filename: file.name,
          originalName: file.name,
          fileKey: file.key || "",
          fileUrl: file.ufsUrl,
          fileSize: file.size || 0,
          mimeType: file.type || "",
          slug: file.serverData.slug,
          uploadedAt: new Date(),
        }));
        
        setFiles((prev) => [...newFileObjects, ...prev]);
        setActualTotalCount(prev => prev + res.length);
        
        // Clear upload state after short delay
        setTimeout(() => {
          setUploadedFiles([]);
          setUploadMessage("");
        }, 3000);
      }
    } catch (error) {
      console.error("[HomePage] Upload error:", error);
      setUploadMessage("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const content = (
    <main className="min-h-screen">
      <div className="mobile-safe-padding">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">Files</h1>
            <p className="text-sm md:text-base text-gray-600">
              {actualTotalCount} {actualTotalCount === 1 ? 'file' : 'files'} total
            </p>
          </div>

          {/* Upload Section */}
          {session && (
            <div className="mb-6 md:mb-8">
              {uploadMessage && (
                <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg text-green-700 text-sm md:text-base">
                  {uploadMessage}
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-green-800">
                    Recently Uploaded
                  </h3>
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-lg border space-y-2 sm:space-y-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{file.name}</div>
                          <div className="text-xs md:text-sm text-gray-500 truncate">
                            Share: {window.location.origin}/i/{file.slug}
                          </div>
                        </div>
                        <UploadPageCopyButton 
                          slug={file.slug}
                          className="touch-target px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors self-end sm:self-auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="hidden md:block text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-base md:text-lg">Drop files anywhere to upload</p>
              </div>
            </div>
          )}

          {/* Files Section */}
          {files.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 2a1 1 0 000 2h6a1 1 0 100-2H9zM4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6h-2V9a1 1 0 10-2 0v2H8V9a1 1 0 10-2 0v2H4V5z" />
                </svg>
              </div>
              <p className="text-gray-500 text-base md:text-lg mb-4">No files uploaded yet.</p>
              {!session && (
                <Link
                  href="/login"
                  className="touch-target inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Login to Upload Files
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop bulk controls */}
              {session && files.length > 0 && (
                <div className="hidden md:flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.length === files.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-600">
                        Select all on page ({selectedFiles.length}/{files.length})
                      </span>
                    </label>
                    {selectedFiles.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="touch-target px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {isDeleting ? "Deleting..." : `Delete ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                      </button>
                    )}
                    <button
                      onClick={handleDeleteAll}
                      disabled={isDeleting}
                      className="touch-target px-3 py-2 bg-red-700 text-white rounded-lg text-sm hover:bg-red-800 disabled:opacity-50 transition-colors"
                    >
                      {isDeleting ? "Deleting..." : `Delete All ${actualTotalCount} Files`}
                    </button>
                  </div>
                </div>
              )}
              
              {/* File grid */}
              <div className="space-y-2 md:space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="animate-fade-in">
                    <SwipeableFileCard
                      file={file}
                      isSelected={selectedFiles.includes(file.id)}
                      onSelect={() => handleFileSelect(file.id)}
                      onDelete={() => handleDeleteFile(file.id)}
                      isDeleting={isDeleting}
                      showCheckbox={!!session}
                      formatFileSize={formatFileSize}
                      getFileIcon={getFileIcon}
                    />
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
      
      {/* Toast */}
      <Toast 
        message={toastMessage}
        show={showToast}
        onHide={() => setShowToast(false)}
      />
      
      {/* Mobile Floating Action Button */}
      {selectedFiles.length > 0 && (
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="w-14 h-14 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 touch-target"
            aria-label={`Delete ${selectedFiles.length} selected file${selectedFiles.length > 1 ? 's' : ''}`}
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
          
          {/* Badge showing count */}
          <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold min-w-[1.5rem] min-h-[1.5rem]">
            {selectedFiles.length}
          </div>
        </div>
      )}
    </main>
  );

  return session ? (
    <FullPageDropzone 
      onDrop={handleCustomUpload}
      isUploading={isUploading}
    >
      {content}
    </FullPageDropzone>
  ) : content;
}