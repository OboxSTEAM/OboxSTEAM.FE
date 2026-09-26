"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";

import {
  Dialog,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PortfolioItemType, PortfolioMediaAsset } from "@/lib/api/entities/portfolio";
import { cn } from "@/lib/utils";

const EMPTY_COPY: Partial<Record<PortfolioItemType, string>> = {
  CapstoneProject: "Thêm ảnh sản phẩm hoặc bản demo",
  InternalCertificate: "Thêm ảnh chứng chỉ",
  ExternalCert: "Thêm ảnh chứng chỉ",
  Project: "Thêm ảnh dự án",
  HighlightReel: "Thêm ảnh hoặc video",
};

type PortfolioItemMediaProps = {
  assets: PortfolioMediaAsset[];
  itemType: PortfolioItemType;
  isDark: boolean;
  uploadSlot?: React.ReactNode;
  onCaptionChange?: (assetId: string, caption: string) => void;
  onRemove?: (assetId: string) => void;
};

export function PortfolioItemMedia({
  assets,
  itemType,
  isDark,
  uploadSlot,
  onCaptionChange,
  onRemove,
}: PortfolioItemMediaProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sorted = [...assets]
    .filter((asset) => Boolean(asset.url))
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const cover = sorted[0];
  const extra = Math.max(0, sorted.length - 1);
  const isCertificate =
    itemType === "InternalCertificate" || itemType === "ExternalCert";

  if (!cover) {
    return (
      <div
        className={cn(
          "flex aspect-video flex-col items-center justify-center gap-2 rounded-md border border-dashed px-3 text-center",
          isDark
            ? "border-[#FAFAF5]/25 text-[#FAFAF5]/55"
            : "border-[#D0D0C8] text-[#6B6B6B]",
        )}
      >
        <ImagePlus className="size-5" />
        <p className="text-xs">{EMPTY_COPY[itemType] ?? "Thêm ảnh minh chứng"}</p>
        {uploadSlot}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <button
          type="button"
          className="block w-full overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]"
          onClick={() => setLightboxIndex(0)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- remote portfolio media */}
          <img
            src={cover.url!}
            alt={cover.caption ?? ""}
            className={cn(
              "aspect-video w-full",
              isCertificate ? "bg-[#F5F5F0] object-contain" : "object-cover",
            )}
          />
        </button>
        {extra > 0 ? (
          <button
            type="button"
            onClick={() => setLightboxIndex(1)}
            className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white"
          >
            +{extra}
          </button>
        ) : null}
        {onRemove && cover.id ? (
          <button
            type="button"
            aria-label="Gỡ ảnh"
            onClick={() => onRemove(cover.id)}
            className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/70 text-white"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      {onCaptionChange && cover.id ? (
        <input
          value={cover.caption ?? ""}
          maxLength={255}
          placeholder="Chú thích ảnh"
          aria-label="Chú thích ảnh"
          onChange={(event) => onCaptionChange(cover.id, event.target.value)}
          className={cn(
            "h-8 w-full rounded-md border border-dashed bg-transparent px-2 text-xs outline-none focus:border-[#4FC3F7]",
            isDark
              ? "border-[#FAFAF5]/25 text-[#FAFAF5] placeholder:text-[#FAFAF5]/40"
              : "border-[#D0D0C8] text-[#2D2D2D]",
          )}
        />
      ) : cover.caption ? (
        <p className={cn("text-xs", isDark ? "text-[#FAFAF5]/60" : "text-[#6B6B6B]")}>
          {cover.caption}
        </p>
      ) : null}
      {uploadSlot}
      <Dialog
        open={lightboxIndex != null}
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null);
        }}
      >
        <DialogPopup className="max-w-3xl bg-black p-3">
          <DialogTitle className="sr-only">Ảnh minh chứng</DialogTitle>
          {lightboxIndex != null && sorted[lightboxIndex]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sorted[lightboxIndex].url!}
              alt={sorted[lightboxIndex].caption ?? ""}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : null}
        </DialogPopup>
      </Dialog>
    </div>
  );
}
