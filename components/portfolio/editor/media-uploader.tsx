"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";

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
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/jpg,image/png";
const MAX_BYTES = 5 * 1024 * 1024;

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
  label = "Ảnh",
  isDark = false,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [library, setLibrary] = useState<PortfolioMediaUpload[] | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [cropSource, setCropSource] = useState<CropSource | null>(null);

  const attached = assets ?? [];
  const chrome = editorChrome(isDark);
  const uploadButtonClass = cn("h-9 rounded-xl", chrome.outlineBtn);
  const ghostButtonClass = cn("h-9 rounded-xl", chrome.ghostBtn);

  useEffect(() => {
    return () => {
      if (cropSource?.url) URL.revokeObjectURL(cropSource.url);
    };
  }, [cropSource?.url]);

  const uploadFile = async (file: File) => {
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
            type: "Image",
            caption: null,
            displayOrder: attached.length,
          },
        ]);
      }
      showAppSuccess({ title: "Đã tải ảnh lên" });
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
    if (!ACCEPT.split(",").includes(file.type) && !/\.(jpe?g|png)$/i.test(file.name)) {
      showAppErrorFromUnknown(
        new Error("Chỉ hỗ trợ ảnh JPG/PNG."),
        "portfolio.media",
      );
      return;
    }
    if (file.size > MAX_BYTES) {
      showAppErrorFromUnknown(new Error("Ảnh tối đa 5 MB."), "portfolio.media");
      return;
    }

    if (crop) {
      const url = URL.createObjectURL(file);
      setCropSource({ url, fileName: file.name });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    await uploadFile(file);
  };

  const closeCrop = () => {
    setCropSource((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const loadLibrary = async () => {
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
        type: "Image",
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
      showAppSuccess({ title: "Đã xóa ảnh" });
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.media");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className={uploadButtonClass}
          disabled={isUploading || Boolean(cropSource)}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {isUploading ? "Đang tải…" : `Tải ${label}`}
        </Button>
        {onChange ? (
          <Button
            type="button"
            variant="ghost"
            className={ghostButtonClass}
            disabled={isLoadingLibrary}
            onClick={() => void loadLibrary()}
          >
            {isLoadingLibrary ? "Đang mở thư viện…" : "Chọn từ thư viện"}
          </Button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      {onChange && attached.length > 0 ? (
        <ul className="space-y-2">
          {attached.map((asset) => (
            <li
              key={asset.id}
              className="flex items-center gap-2 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] p-2"
            >
              {asset.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.url}
                  alt=""
                  className="size-12 rounded-lg object-cover"
                />
              ) : (
                <div className="size-12 rounded-lg bg-[#E5E5E0]" />
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
                aria-label="Gỡ ảnh"
                onClick={() => detach(asset.id)}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {library ? (
        <div className="rounded-xl border border-[#E5E5E0] bg-white p-3">
          <p className="mb-2 text-xs font-medium text-[#6B6B6B]">Thư viện ảnh</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {library.map((asset) => (
              <div key={asset.id} className="group relative">
                <button
                  type="button"
                  className="block w-full overflow-hidden rounded-lg"
                  onClick={() => attachFromLibrary(asset)}
                >
                  {asset.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.url}
                      alt={asset.fileName ?? ""}
                      className="aspect-square w-full object-cover"
                    />
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
            void uploadFile(file);
          }}
        />
      ) : null}
    </div>
  );
}
