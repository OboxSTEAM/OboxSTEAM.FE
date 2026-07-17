"use client";

import { useState } from "react";
import { Eye, Save } from "lucide-react";

import { PublishPopover } from "@/components/portfolio/editor/publish-popover";
import {
  PortfolioMicrosite,
  toPortfolioMicrositeData,
} from "@/components/portfolio/render/portfolio-microsite";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Portfolio } from "@/lib/api/entities/portfolio";
import { cn } from "@/lib/utils";

type PortfolioToolbarProps = {
  draft: Portfolio;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onServerUpdate: (portfolio: Portfolio) => void;
};

export function PortfolioToolbar({
  draft,
  isDirty,
  isSaving,
  onSave,
  onServerUpdate,
}: PortfolioToolbarProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="sticky top-[4.5rem] z-30 border-b border-[#E5E5E0] bg-white/95 backdrop-blur sm:top-20">
      <div className="mx-auto flex h-14 max-w-[110rem] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="truncate font-heading text-base font-bold text-[#2D2D2D] sm:text-lg">
            Portfolio của tôi
          </h1>
          <span
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              isDirty
                ? "bg-[#FDD835]/20 text-[#8a6d00]"
                : "bg-[#7CB342]/15 text-[#4c7027]",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                isDirty ? "bg-[#c9a400]" : "bg-[#7CB342]",
              )}
              aria-hidden
            />
            {isDirty ? "Chưa lưu" : "Đã lưu"}
          </span>
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

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogPopup className="h-[92dvh] max-w-5xl gap-0 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] px-5 py-3">
            <DialogTitle className="text-base">Xem trước portfolio</DialogTitle>
            <DialogClose className="static" />
          </div>
          <div className="h-full overflow-y-auto">
            <PortfolioMicrosite data={toPortfolioMicrositeData(draft)} />
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
