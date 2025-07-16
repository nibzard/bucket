"use client";

interface CopyLinkButtonProps {
  slug: string;
  className?: string;
}

export function CopyLinkButton({ slug, className }: CopyLinkButtonProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/i/${slug}`);
  };

  return (
    <button onClick={handleCopy} className={className}>
      Copy Link
    </button>
  );
}