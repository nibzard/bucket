"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import { UploadPageCopyButton } from "@/components/UploadPageCopyButton";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    slug: string;
    url: string;
  }>>([]);

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Files</h1>
          <p className="text-gray-600">
            Drag and drop files here or click to select files to upload.
          </p>
        </div>

        <div className="mb-8">
          <UploadDropzone
            endpoint="fileUploader"
            onClientUploadComplete={(res) => {
              if (res) {
                const newFiles = res.map((file) => ({
                  name: file.name,
                  slug: file.serverData.slug,
                  url: file.url,
                }));
                setUploadedFiles((prev) => [...prev, ...newFiles]);
              }
            }}
            onUploadError={(error: Error) => {
              alert(`Upload error: ${error.message}`);
            }}
            config={{
              mode: "auto",
            }}
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-green-800">
              Recently Uploaded Files
            </h2>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-3 rounded border"
                >
                  <div>
                    <div className="font-medium text-gray-900">{file.name}</div>
                    <div className="text-sm text-gray-500">
                      Share: {window.location.origin}/f/{file.slug}
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

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => router.push("/files")}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            View All Files
          </button>
          <button
            onClick={() => router.push("/api/auth/signout")}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}