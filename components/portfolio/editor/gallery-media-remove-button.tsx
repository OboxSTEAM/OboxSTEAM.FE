"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type GalleryMediaRemoveButtonProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

/** Always-visible remove chip for gallery image/video tiles in the editor. */
export function GalleryMediaRemoveButton({
  onClick,
  label = "Gỡ khỏi thư viện",
  className,
}: GalleryMediaRemoveButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "absolute top-1.5 right-1.5 z-10 flex size-6 items-center justify-center rounded-full",
        "bg-[#2D2D2D] text-white shadow-sm ring-2 ring-white/90",
        "hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]",
        className,
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <X className="size-3.5" strokeWidth={2.5} />
    </button>
  );
}
