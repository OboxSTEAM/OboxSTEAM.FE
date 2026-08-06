"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Images,
  Loader2,
  Play,
} from "lucide-react";

import {
  MediaLightbox,
  type MediaLightboxItem,
} from "@/components/media/media-lightbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getClassGallery,
  type ClassGalleryMedia,
  type MediaVideoStatus,
} from "@/lib/api";
import { MEDIA_VIDEO_STATUS_LABELS } from "@/lib/classes/constants";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { isImageFile, isVideoFile } from "@/lib/media/file-kind";
import { cn } from "@/lib/utils";

const GALLERY_PAGE_SIZE = 12;

type FileTypeFilter = "all" | "image" | "video";
type VideoStatusFilter = "all" | MediaVideoStatus;

type GalleryPage = {
  items: ClassGalleryMedia[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

type CurriculumClassGalleryProps = {
  classId: string;
};

function GalleryThumbSkeleton() {
  return (
    <div className="aspect-square animate-pulse rounded-lg bg-learn-surface-2/80" />
  );
}

function GalleryThumb({
  media,
  onOpen,
}: {
  media: ClassGalleryMedia;
  onOpen: (media: ClassGalleryMedia) => void;
}) {
  const video = isVideoFile(media.fileType, media.fileUrl);
  const image = isImageFile(media.fileType, media.fileUrl);
  const href = media.fileUrl;
  const canOpen = Boolean(href);

  return (
    <button
      type="button"
      disabled={!canOpen}
      onClick={() => {
        if (canOpen) onOpen(media);
      }}
      aria-label={video ? "Xem video lớn hơn" : "Xem ảnh lớn hơn"}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg text-left",
        "border border-learn-border bg-learn-surface-2",
        "transition-[transform,box-shadow] duration-200",
        canOpen &&
          "cursor-zoom-in hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn-accent/40",
        !canOpen && "cursor-default opacity-70",
      )}
    >
      {href && image ? (
        <Image
          src={href}
          alt=""
          fill
          sizes="120px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          unoptimized
        />
      ) : href && video ? (
        <>
          <video
            src={href}
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            className="size-full object-cover"
          />
          <span
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center",
              "bg-black/25",
            )}
            aria-hidden
          >
            <span className="rounded-full bg-black/45 p-1.5 text-white">
              <Play className="size-3.5 fill-current" />
            </span>
          </span>
        </>
      ) : (
        <div className="flex size-full items-center justify-center text-learn-muted">
          <Images className="size-5 opacity-50" aria-hidden />
        </div>
      )}

      {!media.isReady ? (
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
          {media.statusLabel ?? MEDIA_VIDEO_STATUS_LABELS[media.videoStatus]}
        </span>
      ) : null}
    </button>
  );
}

export function CurriculumClassGallery({ classId }: CurriculumClassGalleryProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<VideoStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    setOpen(false);
    setFileTypeFilter("all");
    setStatusFilter("all");
    setPage(1);
    setPreviewIndex(null);
  }, [classId]);

  const { data, isLoading, markLoading, retry, hasError } = useClientFetch({
    fetcher: async (): Promise<GalleryPage> => {
      const result = await getClassGallery(classId, {
        fileType: fileTypeFilter === "all" ? undefined : fileTypeFilter,
        videoStatus: statusFilter === "all" ? undefined : statusFilter,
        page,
        pageSize: GALLERY_PAGE_SIZE,
        sortBy: "uploadedAt",
        isDescending: true,
      });
      const pageData = result?.data;
      return {
        items: pageData?.items ?? [],
        currentPage: pageData?.currentPage ?? page,
        totalPages: Math.max(pageData?.totalPages ?? 1, 1),
        totalCount: pageData?.totalCount ?? 0,
      };
    },
    deps: [classId, fileTypeFilter, statusFilter, page],
    onError: (error) => showAppErrorFromUnknown(error, "media.list"),
  });

  const items = data?.items ?? [];
  const currentPage = data?.currentPage ?? page;
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  const previewableItems = items.filter((item) => Boolean(item.fileUrl));
  const lightboxItems: MediaLightboxItem[] = previewableItems.map((item) => ({
    id: item.id,
    url: item.fileUrl!,
    kind: isVideoFile(item.fileType, item.fileUrl) ? "video" : "image",
  }));

  function applyFilter(update: () => void) {
    markLoading();
    setPage(1);
    setPreviewIndex(null);
    update();
  }

  function openPreview(media: ClassGalleryMedia) {
    const index = previewableItems.findIndex((item) => item.id === media.id);
    if (index < 0) return;
    setPreviewIndex(index);
  }

  const selectTriggerClass = "h-9 w-full min-w-0";
  const selectContentClass = "z-[60]";

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở thư viện lớp"
          className={cn(
            "fixed top-1/2 right-0 z-40 -translate-y-1/2",
            "flex flex-col items-center gap-1.5 rounded-l-xl border border-r-0 border-learn-border",
            "bg-learn-surface px-2.5 py-3 shadow-md",
            "text-learn-muted transition-[color,background-color,transform] duration-200",
            "hover:bg-learn-surface-2 hover:text-learn-text-strong",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn-accent/40",
            "motion-safe:hover:-translate-x-0.5",
          )}
        >
          <Images className="size-3.5 shrink-0" aria-hidden />
          <span className="font-heading text-[11px] font-semibold leading-tight tracking-wide">
            Thư viện
          </span>
          {totalCount > 0 ? (
            <span
              className={cn(
                "rounded-full bg-learn-surface-2 px-1.5 py-0.5",
                "font-mono text-[9px] tabular-nums text-learn-muted",
              )}
            >
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          ) : null}
        </button>
      ) : null}

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setPreviewIndex(null);
        }}
      >
        <SheetPopup
          side="right"
          backdropClassName="bg-black/50"
          className={cn(
            /* Portals outside .learn-shell — re-scope tokens + solid fill */
            "learn-shell bg-learn-surface p-0 text-learn-text",
            isMobile
              ? "w-full max-w-none border-0"
              : "w-[min(22rem,92vw)] border-learn-border",
          )}
        >
          <SheetHeader className="relative border-learn-border bg-learn-surface pr-12">
            <SheetTitle className="text-learn-text-strong">
              Thư viện lớp
            </SheetTitle>
            <p className="text-xs text-learn-muted">
              {isLoading && !data
                ? "Đang tải…"
                : totalCount === 0
                  ? "Chưa có media"
                  : `${totalCount} mục`}
            </p>
            <SheetClose className="text-learn-muted hover:text-learn-text-strong" />
          </SheetHeader>

          <div className="shrink-0 space-y-2 border-b border-learn-border bg-learn-surface px-3 py-2.5">
            <Select
              value={fileTypeFilter}
              onValueChange={(value) => {
                if (!value) return;
                applyFilter(() => setFileTypeFilter(value as FileTypeFilter));
              }}
            >
              <SelectTrigger className={selectTriggerClass}>
                <span className="truncate">
                  {fileTypeFilter === "all"
                    ? "Tất cả loại"
                    : fileTypeFilter === "image"
                      ? "Ảnh"
                      : "Video"}
                </span>
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                sideOffset={8}
                className={selectContentClass}
              >
                <SelectItem value="all">
                  Tất cả loại
                </SelectItem>
                <SelectItem value="image">
                  Ảnh
                </SelectItem>
                <SelectItem value="video">
                  Video
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                if (!value) return;
                applyFilter(() =>
                  setStatusFilter(value as VideoStatusFilter),
                );
              }}
            >
              <SelectTrigger className={selectTriggerClass}>
                <span className="truncate">
                  {statusFilter === "all"
                    ? "Tất cả trạng thái"
                    : MEDIA_VIDEO_STATUS_LABELS[statusFilter]}
                </span>
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                sideOffset={8}
                className={selectContentClass}
              >
                <SelectItem value="all">
                  Tất cả trạng thái
                </SelectItem>
                {(
                  Object.keys(MEDIA_VIDEO_STATUS_LABELS) as MediaVideoStatus[]
                ).map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                  >
                    {MEDIA_VIDEO_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden bg-learn-surface p-0">
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <GalleryThumbSkeleton key={index} />
                  ))}
                </div>
              ) : hasError ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-sm text-learn-muted">
                    Không tải được thư viện.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => retry()}
                  >
                    Thử lại
                  </Button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Images
                    className="size-8 text-learn-muted opacity-40"
                    aria-hidden
                  />
                  <p className="text-sm text-learn-muted">
                    Chưa có media phù hợp bộ lọc.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
                  {items.map((media) => (
                    <GalleryThumb
                      key={media.id}
                      media={media}
                      onOpen={openPreview}
                    />
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && !isLoading ? (
              <div
                className={cn(
                  "flex shrink-0 items-center justify-between gap-2",
                  "border-t border-learn-border bg-learn-surface px-3 py-2",
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-learn-muted"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    markLoading();
                    setPage((prev) => Math.max(1, prev - 1));
                  }}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Trước
                </Button>
                <span className="font-mono text-[11px] tabular-nums text-learn-muted">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-learn-muted"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    markLoading();
                    setPage((prev) => prev + 1);
                  }}
                >
                  Sau
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            ) : isLoading && data ? (
              <div className="flex shrink-0 items-center justify-center border-t border-learn-border py-2">
                <Loader2
                  className="size-4 animate-spin text-learn-muted"
                  aria-label="Đang tải"
                />
              </div>
            ) : null}
          </SheetBody>
        </SheetPopup>
      </Sheet>

      <MediaLightbox
        items={lightboxItems}
        index={previewIndex}
        open={previewIndex != null}
        onClose={() => setPreviewIndex(null)}
        onIndexChange={setPreviewIndex}
      />
    </>
  );
}
