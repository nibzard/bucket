"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
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
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎥";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.startsWith("text/")) return "📝";
  return "📎";
}

export function HomePage({ initialFiles, totalCount, currentPage }: HomePageProps) {
  const { data: session } = useSession();
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
  
  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.history.pushState({}, '', url.toString());
    window.location.reload();
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
    
    // Optimistic update - remove file immediately
    const originalFiles = files;
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setSelectedFiles(prev => prev.filter(id => id !== fileId));
    
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        // Revert on failure
        setFiles(originalFiles);
        setToastMessage("Failed to delete file");
        setShowToast(true);
      } else {
        setToastMessage("File deleted successfully");
        setShowToast(true);
      }
    } catch (error) {
      // Revert on error
      setFiles(originalFiles);
      setToastMessage("Error deleting file");
      setShowToast(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}?`)) return;
    
    // Optimistic update - remove files immediately
    const originalFiles = files;
    const originalSelected = selectedFiles;
    setFiles(prev => prev.filter(file => !selectedFiles.includes(file.id)));
    setSelectedFiles([]);
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
        setFiles(originalFiles);
        setSelectedFiles(originalSelected);
        setToastMessage("Failed to delete files");
        setShowToast(true);
      } else {
        setToastMessage(`${originalSelected.length} file${originalSelected.length > 1 ? 's' : ''} deleted successfully`);
        setShowToast(true);
      }
    } catch (error) {
      // Revert on error
      setFiles(originalFiles);
      setSelectedFiles(originalSelected);
      setToastMessage("Error deleting files");
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${totalCount} files? This action cannot be undone.`)) return;
    
    // Optimistic update - clear all files immediately
    const originalFiles = files;
    const originalSelected = selectedFiles;
    setFiles([]);
    setSelectedFiles([]);
    setIsDeleting(true);
    
    try {
      const response = await fetch("/api/files/delete-all", {
        method: "POST",
      });
      
      if (!response.ok) {
        // Revert on failure
        setFiles(originalFiles);
        setSelectedFiles(originalSelected);
        setToastMessage("Failed to delete all files");
        setShowToast(true);
      } else {
        setToastMessage(`All ${totalCount} files deleted successfully`);
        setShowToast(true);
      }
    } catch (error) {
      // Revert on error
      setFiles(originalFiles);
      setSelectedFiles(originalSelected);
      setToastMessage("Error deleting all files");
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCustomUpload = async (acceptedFiles: File[]) => {
    if (!session) return;
    
    setIsUploading(true);
    setUploadMessage("");
    
    try {
      const res = await uploadFiles("fileUploader", {
        files: acceptedFiles,
      });
      
      if (res) {
        const newFiles = res.map((file) => ({
          name: file.name,
          slug: file.serverData.slug,
          url: file.url,
        }));
        setUploadedFiles((prev) => [...prev, ...newFiles]);
        
        // Auto-copy link for single file uploads
        if (res.length === 1) {
          navigator.clipboard.writeText(`${window.location.origin}/i/${res[0].serverData.slug}`);
          setToastMessage("Link copied to clipboard!");
          setShowToast(true);
        } else {
          setUploadMessage(`Uploaded ${res.length} files successfully!`);
        }
        
        // Add new files to the current list with animation
        const newFileObjects = res.map((file) => ({
          id: file.serverData.slug, // temporary ID using slug
          filename: file.name,
          originalName: file.name,
          fileKey: file.key || "",
          fileUrl: file.url,
          fileSize: file.size || 0,
          mimeType: file.type || "",
          slug: file.serverData.slug,
          uploadedAt: new Date(),
        }));
        
        setFiles((prev) => [...newFileObjects, ...prev]);
        
        // Clear upload state after short delay
        setTimeout(() => {
          setUploadedFiles([]);
          setUploadMessage("");
        }, 3000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const content = (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Files</h1>
          <p className="text-gray-600">
            {totalCount} files total
          </p>
        </div>

        {session && (
          <div className="mb-8">
            {uploadMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded text-green-700">
                {uploadMessage}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-800">
                  Recently Uploaded
                </h3>
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-3 rounded border"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{file.name}</div>
                        <div className="text-sm text-gray-500">
                          Share: {window.location.origin}/i/{file.slug}
                        </div>
                      </div>
                      <UploadPageCopyButton 
                        slug={file.slug}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg">Drop files anywhere to upload</p>
            </div>
          </div>
        )}

        {files.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No files uploaded yet.</p>
            {!session && (
              <Link
                href="/login"
                className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Login to Upload Files
              </Link>
            )}
          </div>
        ) : (
          <>
            {session && files.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === files.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">
                      Select all on page ({selectedFiles.length}/{files.length})
                    </span>
                  </label>
                  {selectedFiles.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : `Delete ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                    </button>
                  )}
                  <button
                    onClick={handleDeleteAll}
                    disabled={isDeleting}
                    className="px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-800 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : `Delete All ${totalCount} Files`}
                  </button>
                </div>
              </div>
            )}
            
            <div className="grid gap-4">
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
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
      
      <Toast 
        message={toastMessage}
        show={showToast}
        onHide={() => setShowToast(false)}
      />
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