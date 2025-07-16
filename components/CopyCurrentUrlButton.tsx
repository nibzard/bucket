"use client";

interface CopyCurrentUrlButtonProps {
  className?: string;
}

export function CopyCurrentUrlButton({ className }: CopyCurrentUrlButtonProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  return (
    <button onClick={handleCopy} className={className}>
      Copy Link
    </button>
  );
}