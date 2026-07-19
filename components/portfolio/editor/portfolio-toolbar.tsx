"use client";

import { useState } from "react";
import { Eye, Save } from "lucide-react";

import { PortfolioPreviewDialog } from "@/components/portfolio/editor/portfolio-preview-dialog";
import { PublishPopover } from "@/components/portfolio/editor/publish-popover";
import { Button } from "@/components/ui/button";
import type { Portfolio } from "@/lib/api/entities/portfolio";
import { cn } from "@/lib/utils";

type PortfolioToolbarProps = {
  draft: Portfolio;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onServerUpdate: (portfolio: Portfolio) => void;
};

type StatusChip = {
  key: string;
  label: string;
  tone: "dirty" | "saved" | "unpublished" | "live" | "draft";
};

function resolveStatusChips(draft: Portfolio, isDirty: boolean): StatusChip[] {
  const chips: StatusChip[] = [];

  if (isDirty) {
    chips.push({ key: "dirty", label: "Chưa lưu", tone: "dirty" });
  } else {
    chips.push({ key: "saved", label: "Đã lưu", tone: "saved" });
  }

  if (draft.isPublic) {
    if (draft.hasUnpublishedChanges || isDirty) {
      chips.push({
        key: "unpublished",
        label: "Chưa xuất bản lại",
        tone: "unpublished",
      });
    } else {
      chips.push({ key: "live", label: "Đã xuất bản", tone: "live" });
    }
  } else if (draft.lastPublishedAt) {
    chips.push({
      key: "unpublished",
      label: "Đã ẩn công khai",
      tone: "unpublished",
    });
  } else {
    chips.push({ key: "draft", label: "Bản nháp", tone: "draft" });
  }

  return chips;
}

const TONE_CHIP: Record<StatusChip["tone"], string> = {
  dirty: "bg-[#FDD835]/20 text-[#8a6d00]",
  saved: "bg-[#7CB342]/15 text-[#4c7027]",
  unpublished: "bg-[#E94B3C]/12 text-[#b53428]",
  live: "bg-[#4FC3F7]/15 text-[#0f7cad]",
  draft: "bg-[#F5F5F0] text-[#6B6B6B]",
};

const TONE_DOT: Record<StatusChip["tone"], string> = {
  dirty: "bg-[#c9a400]",
  saved: "bg-[#7CB342]",
  unpublished: "bg-[#E94B3C]",
  live: "bg-[#4FC3F7]",
  draft: "bg-[#9a9a9a]",
};

export function PortfolioToolbar({
  draft,
  isDirty,
  isSaving,
  onSave,
  onServerUpdate,
}: PortfolioToolbarProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const statusChips = resolveStatusChips(draft, isDirty);

  return (
    <div
      className={cn(
        // Sit just under the fixed SiteHeader (h-[4.5rem] / sm:h-20), above canvas.
        "sticky top-[4.5rem] z-40 border-b border-[#E5E5E0] bg-white sm:top-20",
        "shadow-[0_1px_0_rgba(45,45,45,0.04)]",
      )}
    >
      <div className="mx-auto flex h-14 max-w-[110rem] items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <h1 className="min-w-0 truncate font-heading text-base font-bold text-[#2D2D2D] sm:text-lg">
            Portfolio của tôi
          </h1>
          <div className="flex shrink-0 items-center gap-1.5">
            {statusChips.map((chip, index) => (
              <span
                key={chip.key}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
                  TONE_CHIP[chip.tone],
                  // Keep save status always visible; publish chip from sm up.
                  index > 0 && "hidden sm:inline-flex",
                )}
              >
                <span
                  className={cn("size-1.5 rounded-full", TONE_DOT[chip.tone])}
                  aria-hidden
                />
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="size-4" />
            <span className="hidden sm:inline">Xem trước</span>
          </Button>
          <Button
            type="button"
            disabled={!isDirty || isSaving}
            onClick={onSave}
            className="h-10 rounded-xl bg-[#7CB342] px-4 text-white hover:bg-[#7CB342]/90"
          >
            <Save className="size-4" />
            {isSaving ? "Đang lưu…" : "Lưu"}
          </Button>
          <PublishPopover portfolio={draft} onUpdated={onServerUpdate} />
        </div>
      </div>

      <PortfolioPreviewDialog
        draft={draft}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
