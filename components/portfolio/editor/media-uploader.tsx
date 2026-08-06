"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Play, Trash2, X } from "lucide-react";

import { ImageCropDialog } from "@/components/portfolio/editor/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PortfolioMediaAsset, PortfolioMediaUpload } from "@/lib/api/entities/portfolio";
import {
  deletePortfolioMedia,
  listPortfolioMedia,
  uploadPortfolioMedia,
} from "@/lib/api/portfolios";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { editorChrome } from "@/lib/portfolio/editor-chrome";
import {
  PORTFOLIO_IMAGE_ACCEPT,
  PORTFOLIO_MEDIA_ACCEPT,
  validatePortfolioMediaFile,
} from "@/lib/portfolio/media-upload";
import { cn } from "@/lib/utils";

export type MediaUploadCropOptions = {
  aspect: number;
  cropShape?: "rect" | "round";
  title: string;
  description: string;
  outputWidth: number;
  outputHeight: number;
};

type MediaUploaderProps = {
  /** Currently attached assets (item/section). */
  assets?: PortfolioMediaAsset[] | null;
  onChange?: (next: PortfolioMediaAsset[]) => void;
  /** When set, only upload and return the library asset (avatar/cover). */
  onUploadedUrl?: (url: string, asset: PortfolioMediaUpload) => void;
  /** Open a crop dialog before upload (avatar/cover). */
  crop?: MediaUploadCropOptions;
  className?: string;
  label?: string;
  /**
   * When true (e.g. Neo Lab canvas), force dark chrome so text is not
   * inherited as light-on-light from the parent portfolio surface.
   */
  isDark?: boolean;
  /**
   * Gallery sections already preview images in the style renderer —
   * skip duplicate thumbnails and keep caption + remove controls only.
   */
  hideThumbnails?: boolean;
  /** Hide the attached-asset list entirely (e.g. gallery click-to-edit). */
  hideAttachedList?: boolean;
  /**
   * Card-inline mode: only the upload button (no library / captions).
   * Thumbnails are rendered by the parent.
   */
  compact?: boolean;
  /**
   * Allow MP4/MOV up to 2 GB. Forced off when `crop` is set (avatar/cover).
   * @default true when crop is unset
   */
  allowVideo?: boolean;
};

type CropSource = {
  url: string;
  fileName: string;
};

export function MediaUploader({
  assets = [],
  onChange,
  onUploadedUrl,
  crop,
  className,
  label,
  isDark = false,
  hideThumbnails = false,
  hideAttachedList = false,
  compact = false,
  allowVideo: allowVideoProp,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [library, setLibrary] = useState<PortfolioMediaUpload[] | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const isLibraryOpen = library != null;

  const allowVideo = Boolean(allowVideoProp ?? !crop);
  const accept = allowVideo ? PORTFOLIO_MEDIA_ACCEPT : PORTFOLIO_IMAGE_ACCEPT;
  const resolvedLabel = label ?? (allowVideo ? "media" : "Ảnh");

  const attached = assets ?? [];
  const chrome = editorChrome(isDark);
  const uploadButtonClass = cn(
    compact ? "h-8 rounded-lg px-2.5 text-xs" : "h-9 rounded-xl",
    chrome.outlineBtn,
  );
  const ghostButtonClass = cn("h-9 rounded-xl", chrome.ghostBtn);
  const showLibrary = Boolean(onChange) && !compact;
  const showAttached = Boolean(onChange) && !hideAttachedList && !compact;

  useEffect(() => {
    return () => {
      if (cropSource?.url) URL.revokeObjectURL(cropSource.url);
    };
  }, [cropSource?.url]);

  const uploadFile = async (file: File, kind: "image" | "video") => {
    setIsUploading(true);
    try {
      const result = await uploadPortfolioMedia(file);
      const uploaded = result.data;
      if (onUploadedUrl && uploaded.url) {
        onUploadedUrl(uploaded.url, uploaded);
      }
      if (onChange) {
        onChange([
          ...attached,
          {
            id: uploaded.id,
            url: uploaded.url,
            type: uploaded.type,
            caption: null,
            displayOrder: attached.length,
          },
        ]);
      }
      showAppSuccess({
        title: kind === "video" ? "Đã tải video lên" : "Đã tải ảnh lên",
      });
      setLibrary((current) => (current ? [uploaded, ...current] : current));
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.media");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (!file) return;

    const validated = validatePortfolioMediaFile(file, { allowVideo });
    if (!validated.ok) {
      showAppErrorFromUnknown(new Error(validated.message), "portfolio.media");
      return;
    }

    if (crop) {
      if (validated.kind !== "image") {
        showAppErrorFromUnknown(
          new Error("Chỉ hỗ trợ ảnh JPG/PNG khi cắt ảnh."),
          "portfolio.media",
        );
        return;
      }
      const url = URL.createObjectURL(file);
      setCropSource({ url, fileName: file.name });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    await uploadFile(file, validated.kind);
  };

  const closeCrop = () => {
    setCropSource((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const toggleLibrary = async () => {
    if (isLibraryOpen) {
      setLibrary(null);
      return;
    }
    setIsLoadingLibrary(true);
    try {
      const result = await listPortfolioMedia();
      setLibrary(result.data ?? []);
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.media");
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const detach = (id: string) => {
    onChange?.(attached.filter((asset) => asset.id !== id));
  };

  const updateCaption = (id: string, caption: string) => {
    onChange?.(
      attached.map((asset) =>
        asset.id === id ? { ...asset, caption: caption || null } : asset,
      ),
    );
  };

  const attachFromLibrary = (asset: PortfolioMediaUpload) => {
    if (!onChange) return;
    if (attached.some((item) => item.id === asset.id)) return;
    onChange([
      ...attached,
      {
        id: asset.id,
        url: asset.url,
        type: asset.type,
        caption: null,
        displayOrder: attached.length,
      },
    ]);
  };

  const removeFromLibrary = async (mediaId: string) => {
    try {
      await deletePortfolioMedia(mediaId);
      setLibrary((current) => current?.filter((item) => item.id !== mediaId) ?? null);
      onChange?.(attached.filter((asset) => asset.id !== mediaId));
      showAppSuccess({ title: "Đã xóa media" });
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.media");
    }
  };

  return (
    <div className={cn(compact ? "inline-flex" : "space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className={uploadButtonClass}
          disabled={isUploading || Boolean(cropSource)}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className={cn(compact ? "size-3.5" : "size-4", "animate-spin")} />
          ) : (
            <ImagePlus className={compact ? "size-3.5" : "size-4"} />
          )}
          {isUploading
            ? "Đang tải…"
            : compact
              ? allowVideo
                ? "Tải lên"
                : "Tải ảnh"
              : `Tải ${resolvedLabel}`}
        </Button>
        {showLibrary ? (
          <Button
            type="button"
            variant="ghost"
            className={ghostButtonClass}
            disabled={isLoadingLibrary}
            aria-expanded={isLibraryOpen}
            onClick={() => void toggleLibrary()}
          >
            {isLoadingLibrary
              ? "Đang mở thư viện…"
              : isLibraryOpen
                ? "Đóng thư viện"
                : "Chọn từ thư viện"}
          </Button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      {allowVideo && !compact && !crop ? (
        <p className={cn("text-[11px]", chrome.muted)}>
          Ảnh JPG/PNG ≤ 5 MB · Video MP4/MOV ≤ 2 GB
        </p>
      ) : null}

      {showAttached && attached.length > 0 ? (
        <ul className="space-y-2">
          {attached.map((asset, index) => (
            <li
              key={asset.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-background p-2"
            >
              {hideThumbnails ? (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-border font-mono text-[10px] font-semibold text-muted-foreground">
                  {index + 1}
                </span>
              ) : asset.url ? (
                asset.type === "Video" ? (
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-black">
                    <video
                      src={asset.url}
                      muted
                      defaultMuted
                      autoPlay
                      loop
                      playsInline
                      preload="auto"
                      className="size-full object-cover"
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                      <Play className="size-3 fill-white text-white" />
                    </span>
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.url}
                    alt=""
                    className="size-12 rounded-lg object-cover"
                  />
                )
              ) : (
                <div className="size-12 rounded-lg bg-border" />
              )}
              <Input
                value={asset.caption ?? ""}
                onChange={(event) => updateCaption(asset.id, event.target.value)}
                placeholder="Chú thích"
                className="h-9 flex-1 rounded-lg"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Gỡ media"
                onClick={() => detach(asset.id)}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {library && !compact ? (
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Thư viện media
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {library.map((asset) => (
              <div key={asset.id} className="group relative">
                <button
                  type="button"
                  className="block w-full overflow-hidden rounded-lg"
                  onClick={() => attachFromLibrary(asset)}
                >
                  {asset.url ? (
                    asset.type === "Video" ? (
                      <span className="relative block aspect-square w-full bg-black">
                        <video
                          src={asset.url}
                          muted
                          defaultMuted
                          autoPlay
                          loop
                          playsInline
                          preload="auto"
                          className="size-full object-cover"
                        />
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                          <Play className="size-3.5 fill-white text-white" />
                        </span>
                      </span>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.url}
                        alt={asset.fileName ?? ""}
                        className="aspect-square w-full object-cover"
                      />
                    )
                  ) : null}
                </button>
                <button
                  type="button"
                  aria-label="Xóa khỏi thư viện"
                  className="absolute right-1 top-1 rounded-md bg-black/55 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  onClick={() => void removeFromLibrary(asset.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {cropSource && crop ? (
        <ImageCropDialog
          imageSrc={cropSource.url}
          fileName={cropSource.fileName}
          aspect={crop.aspect}
          cropShape={crop.cropShape}
          title={crop.title}
          description={crop.description}
          outputWidth={crop.outputWidth}
          outputHeight={crop.outputHeight}
          onCancel={closeCrop}
          onConfirm={(file) => {
            closeCrop();
            void uploadFile(file, "image");
          }}
        />
      ) : null}
    </div>
  );
}
