"use client";

interface CopyCurrentUrlButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function CopyCurrentUrlButton({ className, children }: CopyCurrentUrlButtonProps) {
  const handleCopy = () => {
    // Get current slug from URL
    const currentPath = window.location.pathname;
    const slug = currentPath.split('/').pop();
    if (slug) {
      navigator.clipboard.writeText(`${window.location.origin}/i/${slug}`);
    }
  };

  return (
    <button onClick={handleCopy} className={className}>
      {children || "Copy Link"}
    </button>
  );
}