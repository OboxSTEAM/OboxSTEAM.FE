"use client";

import { useEffect, useRef, type DragEvent } from "react";
import { Check, Play } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type VideoThumbProps = {
  src: string;
  selected?: boolean;
  disabled?: boolean;
  /** Optional duration label, e.g. `1:24`. */
  durationLabel?: string | null;
  /** Status chip when not ready (transcoding). */
  statusLabel?: string | null;
  className?: string;
  /** Override default aspect-video. */
  aspectClassName?: string;
  /** Extra overlay (e.g. class name). */
  footer?: string | null;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  "aria-label"?: string;
};

/** Shared video tile — muted autoplay preview; sound only in detail lightbox. */
export function VideoThumb({
  src,
  selected = false,
  disabled = false,
  durationLabel,
  statusLabel,
  className,
  aspectClassName = "aspect-video",
  footer,
  onClick,
  draggable,
  onDragStart,
  "aria-label": ariaLabel = "Xem video lớn hơn",
}: VideoThumbProps) {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldAutoplay = !reduceMotion && !disabled;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    if (!shouldAutoplay) {
      video.pause();
      return;
    }

    const play = () => {
      void video.play().catch(() => {
        /* Autoplay can be blocked; keep muted poster frame. */
      });
    };

    play();
    video.addEventListener("loadeddata", play);
    return () => {
      video.removeEventListener("loadeddata", play);
      video.pause();
    };
  }, [src, shouldAutoplay]);

  return (
    <button
      type="button"
      disabled={disabled}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      aria-pressed={selected || undefined}
      aria-label={ariaLabel}
      className={cn(
        "group relative overflow-hidden rounded-xl text-left transition",
        aspectClassName,
        disabled
          ? "cursor-not-allowed bg-muted opacity-70"
          : "cursor-pointer bg-card hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/55",
        selected && "ring-2 ring-[#4FC3F7] ring-offset-1",
        className,
      )}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        autoPlay={shouldAutoplay}
        loop={shouldAutoplay}
        playsInline
        preload={shouldAutoplay ? "auto" : "metadata"}
        className="size-full object-cover"
        draggable={false}
      />
      <span
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity",
          shouldAutoplay
            ? "bg-black/10 opacity-0 group-hover:bg-black/25 group-hover:opacity-100"
            : "bg-black/30",
        )}
        aria-hidden
      >
        <span className="rounded-full bg-black/50 p-2 text-white shadow-sm transition group-hover:scale-105">
          <Play className="size-4 fill-current" />
        </span>
      </span>

      {selected ? (
        <span className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-[#4FC3F7] text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}

      {durationLabel ? (
        <span className="absolute right-1.5 bottom-1.5 rounded-md bg-black/65 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white">
          {durationLabel}
        </span>
      ) : null}

      {statusLabel ? (
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
          {statusLabel}
        </span>
      ) : footer ? (
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[9px] text-white">
          {footer}
        </span>
      ) : null}
    </button>
  );
}
