"use client";

import { useMemo, useState } from "react";
import { Check, Images, Loader2, Upload } from "lucide-react";

import {
  MediaLightbox,
  type MediaLightboxItem,
} from "@/components/media/media-lightbox";
import { VideoThumb } from "@/components/media/video-thumb";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getMyGallery,
  listPortfolioMedia,
  type ClassGalleryMedia,
  type PortfolioMediaUpload,
  type PortfolioSection,
} from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { isImageFile, isVideoFile } from "@/lib/media/file-kind";
import {
  setClassMediaDragData,
  setPortfolioMediaDragData,
} from "@/lib/portfolio/gallery-dnd";
import { cn } from "@/lib/utils";

type GalleryTab = "program" | "upload";
type FileTypeFilter = "all" | "image" | "video";

const PAGE_SIZE = 24;

type GalleryPanelProps = {
  gallerySections: PortfolioSection[];
  onImportToSection: (
    sectionId: string,
    mediaAssetIds: string[],
  ) => Promise<void>;
  onAttachPortfolioMedia: (
    sectionId: string,
    assets: PortfolioMediaUpload[],
  ) => Promise<void>;
  onCreateGallerySection: () => Promise<void>;
  isImporting?: boolean;
};

function ProgramThumb({
  media,
  selected,
  onToggle,
  onPreview,
}: {
  media: ClassGalleryMedia;
  selected: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const video = isVideoFile(media.fileType, media.fileUrl);
  const image = isImageFile(media.fileType, media.fileUrl);
  const canDrag = media.isReady && Boolean(media.fileUrl);
  const footer =
    media.className || media.programName
      ? (media.className ?? media.programName)
      : null;

  if (video && media.fileUrl) {
    return (
      <div className="relative">
        <VideoThumb
          src={media.fileUrl}
          selected={selected}
          disabled={!canDrag}
          footer={footer}
          aspectClassName="aspect-square"
          className="w-full"
          draggable={canDrag}
          onDragStart={(event) => {
            if (!canDrag) {
              event.preventDefault();
              return;
            }
            setClassMediaDragData(event.dataTransfer, {
              mediaAssetIds: [media.id],
            });
          }}
          onClick={onPreview}
        />
        <button
          type="button"
          aria-label={selected ? "Bỏ chọn" : "Chọn"}
          aria-pressed={selected}
          disabled={!canDrag}
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          className={cn(
            "absolute top-1.5 left-1.5 z-[1] flex size-5 items-center justify-center rounded-full border transition",
            selected
              ? "border-[#4FC3F7] bg-[#4FC3F7] text-white"
              : "border-white/70 bg-black/40 text-transparent hover:bg-black/55",
          )}
        >
          <Check className="size-3" strokeWidth={3} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      draggable={canDrag}
      onDragStart={(event) => {
        if (!canDrag) {
          event.preventDefault();
          return;
        }
        setClassMediaDragData(event.dataTransfer, {
          mediaAssetIds: [media.id],
        });
      }}
      onClick={onToggle}
      aria-pressed={selected}
      disabled={!canDrag}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border text-left transition",
        canDrag
          ? "cursor-grab border-border bg-card active:cursor-grabbing"
          : "cursor-not-allowed border-border/60 bg-muted opacity-70",
        selected && "ring-2 ring-[#4FC3F7] ring-offset-1",
      )}
    >
      {media.fileUrl && image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.fileUrl}
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <Images className="size-5 opacity-50" />
        </div>
      )}

      {selected ? (
        <span className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-[#4FC3F7] text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}

      {footer ? (
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[9px] text-white">
          {footer}
        </span>
      ) : null}
    </button>
  );
}

function UploadThumb({
  asset,
  selected,
  onToggle,
  onPreview,
}: {
  asset: PortfolioMediaUpload;
  selected: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const canDrag = Boolean(asset.url);
  const isVideo = asset.type === "Video";

  if (isVideo && asset.url) {
    return (
      <div className="relative">
        <VideoThumb
          src={asset.url}
          selected={selected}
          aspectClassName="aspect-square"
          className="w-full"
          draggable={canDrag}
          onDragStart={(event) => {
            if (!canDrag) {
              event.preventDefault();
              return;
            }
            setPortfolioMediaDragData(event.dataTransfer, {
              assets: [{ id: asset.id, url: asset.url, type: asset.type }],
            });
          }}
          onClick={onPreview}
        />
        <button
          type="button"
          aria-label={selected ? "Bỏ chọn" : "Chọn"}
          aria-pressed={selected}
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          className={cn(
            "absolute top-1.5 left-1.5 z-[1] flex size-5 items-center justify-center rounded-full border transition",
            selected
              ? "border-[#4FC3F7] bg-[#4FC3F7] text-white"
              : "border-white/70 bg-black/40 text-transparent hover:bg-black/55",
          )}
        >
          <Check className="size-3" strokeWidth={3} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      draggable={canDrag}
      onDragStart={(event) => {
        if (!canDrag) {
          event.preventDefault();
          return;
        }
        setPortfolioMediaDragData(event.dataTransfer, {
          assets: [{ id: asset.id, url: asset.url, type: asset.type }],
        });
      }}
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "relative aspect-square overflow-hidden rounded-xl border border-border bg-card transition",
        canDrag && "cursor-grab active:cursor-grabbing",
        selected && "ring-2 ring-[#4FC3F7] ring-offset-1",
      )}
    >
      {asset.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.url}
          alt={asset.fileName ?? ""}
          className="size-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <Upload className="size-5 opacity-50" />
        </div>
      )}
      {selected ? (
        <span className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-[#4FC3F7] text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

export function GalleryPanel({
  gallerySections,
  onImportToSection,
  onAttachPortfolioMedia,
  onCreateGallerySection,
  isImporting = false,
}: GalleryPanelProps) {
  const [tab, setTab] = useState<GalleryTab>("program");
  const [fileType, setFileType] = useState<FileTypeFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<string[]>([]);
  const [targetSectionId, setTargetSectionId] = useState<string>(
    gallerySections[0]?.id ?? "",
  );
  const [isAttaching, setIsAttaching] = useState(false);
  const [previewItems, setPreviewItems] = useState<MediaLightboxItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const effectiveTarget =
    targetSectionId || gallerySections[0]?.id || "";

  const {
    data: programPage,
    isLoading: isProgramLoading,
    markLoading,
  } = useClientFetch({
    fetcher: async () => {
      const result = await getMyGallery({
        fileType: fileType === "all" ? undefined : fileType,
        page,
        pageSize: PAGE_SIZE,
        sortBy: "uploadedAt",
        isDescending: true,
      });
      return result?.data ?? null;
    },
    deps: [fileType, page],
    onError: (error) => showAppErrorFromUnknown(error, "media.list"),
  });

  const {
    data: uploadLibrary,
    isLoading: isUploadLoading,
  } = useClientFetch({
    fetcher: async () => {
      const result = await listPortfolioMedia();
      return result.data ?? [];
    },
    deps: [tab],
    enabled: tab === "upload",
    onError: (error) => showAppErrorFromUnknown(error, "portfolio.media"),
  });

  const programItems = programPage?.items ?? [];
  const totalPages = Math.max(programPage?.totalPages ?? 1, 1);
  const uploadItems = uploadLibrary ?? [];

  const selectedUploadAssets = useMemo(
    () => uploadItems.filter((asset) => selectedUploadIds.includes(asset.id)),
    [uploadItems, selectedUploadIds],
  );

  const toggleProgram = (id: string) => {
    setSelectedProgramIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleUpload = (id: string) => {
    setSelectedUploadIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const handleAttachSelected = async () => {
    if (!effectiveTarget) {
      await onCreateGallerySection();
      return;
    }
    setIsAttaching(true);
    try {
      if (tab === "program" && selectedProgramIds.length > 0) {
        await onImportToSection(effectiveTarget, selectedProgramIds);
        setSelectedProgramIds([]);
      } else if (tab === "upload" && selectedUploadAssets.length > 0) {
        await onAttachPortfolioMedia(effectiveTarget, selectedUploadAssets);
        setSelectedUploadIds([]);
      }
    } finally {
      setIsAttaching(false);
    }
  };

  const selectedCount =
    tab === "program" ? selectedProgramIds.length : selectedUploadIds.length;
  const busy = isImporting || isAttaching;

  const selectTriggerClass = "h-9 w-full min-w-0";
  const selectContentClass = "z-[60]";

  const openProgramPreview = (media: ClassGalleryMedia) => {
    if (!media.fileUrl) return;
    const items: MediaLightboxItem[] = programItems
      .filter((item) => Boolean(item.fileUrl))
      .map((item) => ({
        id: item.id,
        url: item.fileUrl!,
        kind: isVideoFile(item.fileType, item.fileUrl) ? "video" : "image",
        caption: item.className ?? item.programName,
      }));
    const index = items.findIndex((item) => item.id === media.id);
    if (index < 0) return;
    setPreviewItems(items);
    setPreviewIndex(index);
  };

  const openUploadPreview = (asset: PortfolioMediaUpload) => {
    if (!asset.url) return;
    const items: MediaLightboxItem[] = uploadItems
      .filter((item) => Boolean(item.url))
      .map((item) => ({
        id: item.id,
        url: item.url!,
        kind: item.type === "Video" ? "video" : "image",
        alt: item.fileName,
      }));
    const index = items.findIndex((item) => item.id === asset.id);
    if (index < 0) return;
    setPreviewItems(items);
    setPreviewIndex(index);
  };

  const gridClass = "grid grid-cols-3 gap-2";

  return (
    <div className="space-y-4">
      <div className="flex rounded-xl border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setTab("program")}
          className={cn(
            "flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition",
            tab === "program"
              ? "bg-background text-[#0f7cad] shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Chương trình
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={cn(
            "flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition",
            tab === "upload"
              ? "bg-background text-[#0f7cad] shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Đã tải lên
        </button>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {tab === "program"
          ? "Kéo ảnh/video sẵn sàng vào section Thư viện ảnh trên canvas, hoặc chọn rồi gắn bên dưới."
          : "Media đã nhập/tải lên portfolio. Kéo vào section Gallery hoặc gắn bằng nút bên dưới."}
      </p>

      {tab === "program" ? (
        <Select
          value={fileType}
          onValueChange={(value) => {
            if (!value) return;
            markLoading();
            setPage(1);
            setFileType(value as FileTypeFilter);
          }}
        >
          <SelectTrigger className={selectTriggerClass}>
            <span className="truncate">
              {fileType === "all"
                ? "Tất cả loại"
                : fileType === "image"
                  ? "Ảnh"
                  : "Video"}
            </span>
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="image">Ảnh</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      ) : null}

      {gallerySections.length > 0 ? (
        <Select
          value={effectiveTarget}
          onValueChange={(value) => {
            if (value) setTargetSectionId(value);
          }}
        >
          <SelectTrigger className={selectTriggerClass}>
            <span className="truncate">
              {gallerySections.find((section) => section.id === effectiveTarget)
                ?.title?.trim() || "Thư viện ảnh"}
            </span>
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            {gallerySections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.title?.trim() || "Thư viện ảnh"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full rounded-xl"
          onClick={() => void onCreateGallerySection()}
        >
          Thêm section Thư viện ảnh
        </Button>
      )}

      {tab === "program" ? (
        isProgramLoading && !programPage ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : programItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
            Chưa có media từ lớp đã ghi danh.
          </div>
        ) : (
          <>
            <div className={gridClass}>
              {programItems.map((media) => (
                <ProgramThumb
                  key={media.id}
                  media={media}
                  selected={selectedProgramIds.includes(media.id)}
                  onToggle={() => {
                    if (!media.isReady) return;
                    toggleProgram(media.id);
                  }}
                  onPreview={() => openProgramPreview(media)}
                />
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    markLoading();
                    setPage((current) => Math.max(1, current - 1));
                  }}
                >
                  Trước
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {page}/{totalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    markLoading();
                    setPage((current) => current + 1);
                  }}
                >
                  Sau
                </Button>
              </div>
            ) : null}
          </>
        )
      ) : isUploadLoading && !uploadLibrary ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : uploadItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
          Chưa có media trong thư viện tải lên.
        </div>
      ) : (
        <div className={gridClass}>
          {uploadItems.map((asset) => (
            <UploadThumb
              key={asset.id}
              asset={asset}
              selected={selectedUploadIds.includes(asset.id)}
              onToggle={() => toggleUpload(asset.id)}
              onPreview={() => openUploadPreview(asset)}
            />
          ))}
        </div>
      )}

      <Button
        type="button"
        className="h-10 w-full rounded-xl"
        disabled={busy || selectedCount === 0}
        onClick={() => void handleAttachSelected()}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {selectedCount > 0
          ? `Gắn ${selectedCount} mục vào Gallery`
          : "Chọn media để gắn"}
      </Button>

      <MediaLightbox
        items={previewItems}
        index={previewIndex}
        open={previewIndex != null}
        onClose={() => setPreviewIndex(null)}
        onIndexChange={setPreviewIndex}
      />
    </div>
  );
}
