"use client";

import { useState } from "react";

import {
  MediaLightbox,
  type MediaLightboxItem,
} from "@/components/media/media-lightbox";
import { VideoThumb } from "@/components/media/video-thumb";
import type { VideoSlotId } from "@/lib/portfolio/theme-presets";
import { cn } from "@/lib/utils";

export type GalleryVideo = {
  id?: string;
  src: string;
  alt?: string;
  caption?: string | null;
  durationLabel?: string | null;
};

type PortfolioVideoGalleryProps = {
  slot: VideoSlotId;
  videos: GalleryVideo[];
  className?: string;
  isDark?: boolean;
  /**
   * Editor: when set, shows an edit affordance that calls this instead of
   * only opening the lightbox (pencil / secondary path). Primary click still
   * opens the lightbox.
   */
  onVideoEdit?: (index: number) => void;
};

function toLightboxItems(videos: GalleryVideo[]): MediaLightboxItem[] {
  return videos.map((video, index) => ({
    id: video.id ?? `${video.src}-${index}`,
    url: video.src,
    kind: "video" as const,
    alt: video.alt,
    caption: video.caption,
  }));
}

function VideoCaption({
  caption,
  isDark,
}: {
  caption?: string | null;
  isDark?: boolean;
}) {
  const text = caption?.trim();
  if (!text) return null;
  return (
    <figcaption
      className={cn(
        "mt-1.5 line-clamp-2 text-xs leading-snug",
        isDark ? "text-[#FAFAF5]/65" : "text-[#6B6B6B]",
      )}
    >
      {text}
    </figcaption>
  );
}

/**
 * Multi-style video showcase for Gallery sections.
 * Styles: VideoGrid · Filmstrip · FeaturedReel (Playlist later).
 */
export function PortfolioVideoGallery({
  slot,
  videos,
  className,
  isDark = false,
  onVideoEdit,
}: PortfolioVideoGalleryProps) {
  const items = videos.filter((video) => Boolean(video.src));
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const lightboxItems = toLightboxItems(items);

  if (items.length === 0) {
    return (
      <p
        className={cn(
          "text-sm",
          isDark ? "text-[#FAFAF5]/55" : "text-[#6B6B6B]",
          className,
        )}
      >
        Chưa có video trong thư viện này.
      </p>
    );
  }

  const openPreview = (index: number) => setPreviewIndex(index);

  const lightbox = (
    <MediaLightbox
      items={lightboxItems}
      index={previewIndex}
      open={previewIndex != null}
      onClose={() => setPreviewIndex(null)}
      onIndexChange={setPreviewIndex}
    />
  );

  if (slot === "FeaturedReel") {
    const featured = items[0]!;
    const strip = items.slice(1);

    return (
      <div className={cn("space-y-3", className)}>
        <figure>
          <VideoThumb
            src={featured.src}
            durationLabel={featured.durationLabel}
            aspectClassName="aspect-video"
            className="w-full rounded-2xl"
            onClick={() => openPreview(0)}
            aria-label={
              featured.caption?.trim() || featured.alt || "Xem video nổi bật"
            }
          />
          <VideoCaption caption={featured.caption ?? featured.alt} isDark={isDark} />
          {onVideoEdit ? (
            <button
              type="button"
              className={cn(
                "mt-1 text-[11px] font-medium underline-offset-2 hover:underline",
                isDark ? "text-[#4FC3F7]" : "text-[#0f7cad]",
              )}
              onClick={() => onVideoEdit(0)}
            >
              Sửa chú thích
            </button>
          ) : null}
        </figure>

        {strip.length > 0 ? (
          <div className="flex gap-2.5 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x [&::-webkit-scrollbar]:hidden">
            {strip.map((video, offset) => {
              const index = offset + 1;
              return (
                <figure
                  key={video.id ?? `${video.src}-${index}`}
                  className="w-[min(11rem,72%)] shrink-0 snap-start"
                >
                  <VideoThumb
                    src={video.src}
                    durationLabel={video.durationLabel}
                    className="w-full"
                    onClick={() => openPreview(index)}
                  />
                  <VideoCaption
                    caption={video.caption ?? video.alt}
                    isDark={isDark}
                  />
                  {onVideoEdit ? (
                    <button
                      type="button"
                      className={cn(
                        "mt-1 text-[11px] font-medium underline-offset-2 hover:underline",
                        isDark ? "text-[#4FC3F7]" : "text-[#0f7cad]",
                      )}
                      onClick={() => onVideoEdit(index)}
                    >
                      Sửa
                    </button>
                  ) : null}
                </figure>
              );
            })}
          </div>
        ) : null}
        {lightbox}
      </div>
    );
  }

  if (slot === "Filmstrip") {
    return (
      <div className={cn(className)}>
        <div className="flex gap-2.5 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x @min-[640px]/pf:gap-3 [&::-webkit-scrollbar]:hidden">
          {items.map((video, index) => (
            <figure
              key={video.id ?? `${video.src}-${index}`}
              className="w-[min(18rem,82%)] shrink-0 snap-center @min-[640px]/pf:w-80"
            >
              <VideoThumb
                src={video.src}
                durationLabel={video.durationLabel}
                className="w-full rounded-2xl"
                onClick={() => openPreview(index)}
              />
              <VideoCaption
                caption={video.caption ?? video.alt}
                isDark={isDark}
              />
              {onVideoEdit ? (
                <button
                  type="button"
                  className={cn(
                    "mt-1 text-[11px] font-medium underline-offset-2 hover:underline",
                    isDark ? "text-[#4FC3F7]" : "text-[#0f7cad]",
                  )}
                  onClick={() => onVideoEdit(index)}
                >
                  Sửa chú thích
                </button>
              ) : null}
            </figure>
          ))}
        </div>
        {lightbox}
      </div>
    );
  }

  // VideoGrid (default)
  return (
    <div className={cn(className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((video, index) => (
          <figure key={video.id ?? `${video.src}-${index}`} className="min-w-0">
            <VideoThumb
              src={video.src}
              durationLabel={video.durationLabel}
              className="w-full rounded-2xl"
              onClick={() => openPreview(index)}
            />
            <VideoCaption
              caption={video.caption ?? video.alt}
              isDark={isDark}
            />
            {onVideoEdit ? (
              <button
                type="button"
                className={cn(
                  "mt-1 text-[11px] font-medium underline-offset-2 hover:underline",
                  isDark ? "text-[#4FC3F7]" : "text-[#0f7cad]",
                )}
                onClick={() => onVideoEdit(index)}
              >
                Sửa chú thích
              </button>
            ) : null}
          </figure>
        ))}
      </div>
      {lightbox}
    </div>
  );
}
