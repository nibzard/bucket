"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { UploadDropzone } from "@/lib/uploadthing";
import { UploadPageCopyButton } from "@/components/UploadPageCopyButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { Pagination } from "@/components/Pagination";

interface File {
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
  initialFiles: File[];
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
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    slug: string;
    url: string;
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.location.href = url.toString();
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
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
        setSelectedFiles(prev => prev.filter(id => id !== fileId));
      } else {
        alert("Failed to delete file");
      }
    } catch (error) {
      alert("Error deleting file");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}?`)) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch("/api/files/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileIds: selectedFiles }),
      });
      
      if (response.ok) {
        setFiles(prev => prev.filter(file => !selectedFiles.includes(file.id)));
        setSelectedFiles([]);
      } else {
        alert("Failed to delete files");
      }
    } catch (error) {
      alert("Error deleting files");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${totalCount} files? This action cannot be undone.`)) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch("/api/files/delete-all", {
        method: "POST",
      });
      
      if (response.ok) {
        // Refresh the page to show empty state
        window.location.reload();
      } else {
        alert("Failed to delete all files");
      }
    } catch (error) {
      alert("Error deleting all files");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-blue-800">
                Upload New Files
              </h2>
              
              {uploadMessage && (
                <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded text-green-700">
                  {uploadMessage}
                </div>
              )}
              
              {isUploading && (
                <div className="mb-4 flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-blue-600">Uploading...</span>
                </div>
              )}
              
              <UploadDropzone
                endpoint="fileUploader"
                onUploadBegin={() => {
                  setIsUploading(true);
                  setUploadMessage("");
                }}
                onClientUploadComplete={(res) => {
                  setIsUploading(false);
                  if (res) {
                    const newFiles = res.map((file) => ({
                      name: file.name,
                      slug: file.serverData.slug,
                      url: file.url,
                    }));
                    setUploadedFiles((prev) => [...prev, ...newFiles]);
                    setUploadMessage(`Uploaded ${res.length} file${res.length > 1 ? 's' : ''} successfully!`);
                    // Refresh page to show new files after a short delay
                    setTimeout(() => window.location.reload(), 1500);
                  }
                }}
                onUploadError={(error: Error) => {
                  setIsUploading(false);
                  setUploadMessage(`Upload error: ${error.message}`);
                }}
                config={{
                  mode: "auto",
                }}
                appearance={{
                  container: "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors",
                  uploadIcon: "hidden",
                  label: "text-gray-600 text-sm",
                  allowedContent: "hidden",
                  button: "hidden"
                }}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
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
                <div
                  key={file.id}
                  className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                    selectedFiles.includes(file.id) ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {session && (
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => handleFileSelect(file.id)}
                          className="rounded border-gray-300"
                        />
                      )}
                      <span className="text-xl">
                        {getFileIcon(file.mimeType)}
                      </span>
                      <div>
                        <Link 
                          href={`/f/${file.slug}`}
                          className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                        >
                          {file.originalName}
                        </Link>
                        <div className="text-xs text-gray-500 space-x-3">
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>
                            {new Date(file.uploadedAt).toLocaleDateString()} at {new Date(file.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <CopyLinkButton 
                        slug={file.slug}
                        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                      />
                      {session && (
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={isDeleting}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50"
                        >
                          {isDeleting ? "..." : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
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
    </main>
  );
}