"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaLightboxItem = {
  id: string;
  url: string;
  kind: "image" | "video";
  alt?: string | null;
  caption?: string | null;
};

type MediaLightboxProps = {
  items: MediaLightboxItem[];
  index: number | null;
  open: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  /** When false, hide prev/next even if there are multiple items. */
  enableNav?: boolean;
};

/**
 * Full-screen media preview (curriculum gallery pattern).
 * Dimmed backdrop + large image/video with Esc / arrow navigation.
 */
export function MediaLightbox({
  items,
  index,
  open,
  onClose,
  onIndexChange,
  enableNav = true,
}: MediaLightboxProps) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const media = index != null ? (items[index] ?? null) : null;
  const hasPrev = enableNav && index != null && index > 0;
  const hasNext =
    enableNav && index != null && index < items.length - 1;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasPrev && index != null) {
        onIndexChange?.(index - 1);
      }
      if (event.key === "ArrowRight" && hasNext && index != null) {
        onIndexChange?.(index + 1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, onIndexChange, hasPrev, hasNext, index]);

  if (!mounted) return null;

  const href = media?.url ?? null;
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };

  return createPortal(
    <AnimatePresence>
      {open && media && href ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Xem media"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
            aria-label="Đóng"
            onClick={onClose}
          />

          <motion.div
            className={cn(
              "relative z-[1] flex max-h-[min(90dvh,56rem)] w-full max-w-5xl",
              "flex-col overflow-hidden rounded-2xl bg-black shadow-2xl",
            )}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
            transition={transition}
          >
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="rounded-full bg-black/45 text-white hover:bg-black/65 hover:text-white"
                onClick={onClose}
                aria-label="Đóng"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="relative flex min-h-[min(70dvh,40rem)] items-center justify-center bg-black">
              <AnimatePresence mode="wait">
                <motion.div
                  key={media.id}
                  className="flex size-full items-center justify-center"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }
                  }
                >
                  {media.kind === "image" ? (
                    <Image
                      src={href}
                      alt={media.alt?.trim() || media.caption?.trim() || ""}
                      width={1600}
                      height={1200}
                      className="max-h-[min(80dvh,48rem)] w-auto max-w-full object-contain"
                      unoptimized
                      priority
                    />
                  ) : (
                    <video
                      key={media.id}
                      src={href}
                      controls
                      autoPlay
                      playsInline
                      // Detail view: sound enabled (not muted)
                      className="max-h-[min(80dvh,48rem)] w-full bg-black"
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {hasPrev ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "absolute top-1/2 left-2 z-10 -translate-y-1/2",
                    "rounded-full bg-black/45 text-white hover:bg-black/65 hover:text-white",
                  )}
                  onClick={() => index != null && onIndexChange?.(index - 1)}
                  aria-label="Media trước"
                >
                  <ChevronLeft className="size-5" />
                </Button>
              ) : null}

              {hasNext ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "absolute top-1/2 right-2 z-10 -translate-y-1/2",
                    "rounded-full bg-black/45 text-white hover:bg-black/65 hover:text-white",
                  )}
                  onClick={() => index != null && onIndexChange?.(index + 1)}
                  aria-label="Media sau"
                >
                  <ChevronRight className="size-5" />
                </Button>
              ) : null}
            </div>

            {media.caption?.trim() ? (
              <p className="border-t border-white/10 px-4 py-2.5 text-center text-sm text-white/80">
                {media.caption.trim()}
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
