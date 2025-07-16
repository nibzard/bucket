"use client";

interface UploadPageCopyButtonProps {
  slug: string;
  className?: string;
}

export function UploadPageCopyButton({ slug, className }: UploadPageCopyButtonProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/i/${slug}`);
  };

  return (
    <button onClick={handleCopy} className={className}>
      Copy Link
    </button>
  );
}