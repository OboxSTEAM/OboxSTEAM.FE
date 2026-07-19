"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type AccordionGalleryItem = {
  src: string;
  alt?: string;
  caption?: string | null;
};

type AccordionGalleryProps = {
  items: AccordionGalleryItem[];
  className?: string;
  /** When true, use a quieter hover (no auto-expand motion). */
  reduceMotion?: boolean;
  onImageActivate?: (index: number) => void;
};

/**
 * Hover-expand image strips — one active panel grows, others compress.
 * Captions sit on the active strip.
 */
export default function AccordionGallery({
  items,
  className,
  reduceMotion = false,
  onImageActivate,
}: AccordionGalleryProps) {
  const [active, setActive] = useState(0);
  const safeItems = items.filter((item) => Boolean(item.src));

  if (safeItems.length === 0) return null;

  return (
    <div
      className={cn(
        "flex h-[220px] w-full gap-1 overflow-hidden sm:h-[280px] sm:gap-1.5 md:h-[320px]",
        className,
      )}
      onMouseLeave={() => {
        if (!reduceMotion) setActive(0);
      }}
    >
      {safeItems.map((item, index) => {
        const isActive = active === index;
        const caption = item.caption?.trim() || item.alt?.trim() || "";

        return (
          <button
            key={`${item.src}-${index}`}
            type="button"
            aria-label={caption || `Ảnh ${index + 1}`}
            aria-pressed={isActive}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => {
              setActive(index);
              onImageActivate?.(index);
            }}
            className={cn(
              "relative min-w-0 overflow-hidden rounded-xl outline-none sm:rounded-2xl",
              "focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/60",
              "transition-[flex-grow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isActive ? "flex-[3.2]" : "flex-[0.7] sm:flex-[0.85]",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={caption || ""}
              className={cn(
                "absolute inset-0 size-full object-cover",
                !reduceMotion &&
                  "transition-transform duration-700 ease-out",
                isActive && !reduceMotion && "scale-105",
              )}
            />
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent",
                "transition-opacity duration-300",
                isActive ? "opacity-100" : "opacity-40",
              )}
            />
            {caption ? (
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 p-3 text-left text-sm font-medium text-white",
                  "transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              >
                <span className="line-clamp-2 drop-shadow-sm">{caption}</span>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
