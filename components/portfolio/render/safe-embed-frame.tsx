"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";

import type { EmbedSpec } from "@/lib/portfolio/embed-providers";
import { cn } from "@/lib/utils";

type SafeEmbedFrameProps = {
  spec: EmbedSpec;
  title?: string | null;
  isDark?: boolean;
  className?: string;
};

/**
 * Click-to-load iframe. The embed URL always comes from `parseEmbedSource`,
 * never from a stored iframe src.
 */
export function SafeEmbedFrame({
  spec,
  title,
  isDark = false,
  className,
}: SafeEmbedFrameProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const label = title?.trim() || spec.label;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border",
          isDark ? "border-[#FAFAF5]/15 bg-[#111]" : "border-[#E5E5E0] bg-[#F5F5F0]",
        )}
        style={{ aspectRatio: spec.aspect }}
      >
        {isLoaded ? (
          <iframe
            src={spec.embedUrl}
            title={label}
            className="absolute inset-0 size-full"
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
            allow="fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsLoaded(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]"
          >
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                isDark ? "bg-[#FAFAF5]/10 text-[#FAFAF5]" : "bg-white text-[#2D2D2D]",
              )}
            >
              <Play className="size-3.5" />
              Chạy demo · {spec.label}
            </span>
            <span className={cn("text-xs", isDark ? "text-[#FAFAF5]/60" : "text-[#6B6B6B]")}>
              Nội dung chỉ tải khi bạn bấm
            </span>
          </button>
        )}
      </div>
      <a
        href={spec.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#4FC3F7] underline-offset-4 hover:underline"
      >
        Mở trên {spec.label}
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}

export function EmbedLinkCard({
  href,
  isDark = false,
}: {
  href: string;
  isDark?: boolean;
}) {
  let host = href;
  try {
    host = new URL(href).hostname;
  } catch {
    host = href;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
        isDark
          ? "border-[#FAFAF5]/15 text-[#FAFAF5]"
          : "border-[#E5E5E0] text-[#2D2D2D]",
      )}
    >
      <span className="min-w-0 truncate">{host}</span>
      <ExternalLink className="size-4 shrink-0 text-[#4FC3F7]" />
    </a>
  );
}
