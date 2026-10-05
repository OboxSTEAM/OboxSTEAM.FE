"use client";

import { useState } from "react";
import { ExternalLink, FileText, ImagePlus, X } from "lucide-react";

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
        {isPdfUrl(cover.url) ? (
          <PdfDocumentTile url={cover.url!} isDark={isDark} />
        ) : (
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
        )}
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
            isPdfUrl(sorted[lightboxIndex].url) ? (
              <PdfDocumentTile url={sorted[lightboxIndex].url!} isDark />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sorted[lightboxIndex].url!}
                alt={sorted[lightboxIndex].caption ?? ""}
                className="max-h-[70vh] w-full object-contain"
              />
            )
          ) : null}
        </DialogPopup>
      </Dialog>
    </div>
  );
}

const STEAM_RAINBOW =
  "linear-gradient(90deg, #E94B3C 0%, #7CB342 25%, #4FC3F7 50%, #FDD835 75%, #7E57C2 100%)";

/** Certificate-style preview for PDF media — browsers can't render a PDF in `<img>`. */
function PdfDocumentTile({ url, isDark }: { url: string; isDark: boolean }) {
  const fileName = getPdfFileName(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Mở chứng chỉ PDF${fileName ? ` ${fileName}` : ""} trong tab mới`}
      className={cn(
        "group/pdf relative flex aspect-video w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-md px-4 outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]",
        isDark
          ? "bg-white/[0.06] ring-1 ring-[#FAFAF5]/10"
          : "bg-[#F5F5F0] ring-1 ring-[#E5E5E0]",
      )}
    >
      <span
        aria-hidden
        className="relative flex aspect-[1.414/1] w-[46%] max-w-[11rem] flex-col overflow-hidden rounded-[3px] bg-white shadow-[0_6px_18px_rgba(45,45,45,0.14)] ring-1 ring-black/5 transition-transform duration-200 ease-out group-hover/pdf:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover/pdf:translate-y-0"
      >
        <span className="h-[5%] w-full shrink-0" style={{ background: STEAM_RAINBOW }} />
        <span className="flex flex-1 flex-col items-center justify-center gap-[6%] px-[12%]">
          <span className="h-[5%] w-1/3 rounded-full bg-[#E5E5E0]" />
          <span className="h-[9%] w-3/4 rounded-full bg-[#2D2D2D]/80" />
          <span className="h-[5%] w-1/2 rounded-full bg-[#E5E5E0]" />
        </span>
        <span className="flex items-end justify-between px-[8%] pb-[7%]">
          <span className="h-[3px] w-1/4 rounded-full bg-[#E5E5E0]" />
          <span
            className="size-[18%] min-h-3 min-w-3 rounded-full opacity-80"
            style={{ background: STEAM_RAINBOW }}
          />
        </span>
      </span>

      <span className="absolute right-2 top-2 rounded-full bg-[#E94B3C] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-white">
        PDF
      </span>

      <span
        className={cn(
          "flex min-w-0 max-w-full items-center gap-1.5 text-xs font-semibold",
          isDark ? "text-[#FAFAF5]/85" : "text-[#2D2D2D]",
        )}
      >
        <FileText className="size-3.5 shrink-0 text-[#E94B3C]" aria-hidden />
        <span className="truncate font-mono text-[11px]">
          {fileName ?? "Chứng chỉ"}
        </span>
        <ExternalLink
          className={cn(
            "size-3 shrink-0 transition-opacity",
            isDark ? "text-[#FAFAF5]/50" : "text-[#6B6B6B]",
            "opacity-60 group-hover/pdf:opacity-100",
          )}
          aria-hidden
        />
      </span>
    </a>
  );
}

function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url, "https://placeholder.local").pathname
      .toLowerCase()
      .endsWith(".pdf");
  } catch {
    return false;
  }
}

function getPdfFileName(url: string): string | null {
  try {
    const segment = new URL(url, "https://placeholder.local").pathname
      .split("/")
      .pop();
    if (!segment) return null;
    return decodeURIComponent(segment).replace(/\.pdf$/i, "") || null;
  } catch {
    return null;
  }
}
