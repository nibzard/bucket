import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Simple File Upload & Sharing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload files and share them with short, easy-to-remember URLs
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link
              href="/files"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse Files
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Upload Files
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}