"use client";

import { Crosshair, Maximize2, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MIND_MAP_STATUS_LABELS } from "@/lib/curriculum/mind-map";
import { cn } from "@/lib/utils";

type MindMapFloatingControlsProps = {
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFocusCurrent: () => void;
  className?: string;
};

export function MindMapFloatingControls({
  onFit,
  onZoomIn,
  onZoomOut,
  onFocusCurrent,
  className,
}: MindMapFloatingControlsProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-4 left-4 z-20 flex max-w-[min(100%,20rem)] flex-col gap-2",
        className,
      )}
    >
      <div className="flex items-center gap-1 rounded-2xl border border-[#E5E5E0] bg-white/95 p-1 shadow-[0_8px_24px_-14px_rgba(45,45,45,0.35)] backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onZoomOut}
          aria-label="Thu nhỏ"
          className="min-h-10 min-w-10"
        >
          <Minus className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onZoomIn}
          aria-label="Phóng to"
          className="min-h-10 min-w-10"
        >
          <Plus className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onFit}
          aria-label="Vừa khung nhìn"
          className="min-h-10 min-w-10"
        >
          <Maximize2 className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onFocusCurrent}
          className="min-h-10 gap-1.5 px-2.5"
        >
          <Crosshair className="size-4" aria-hidden />
          <span className="text-xs">Hiện tại</span>
        </Button>
      </div>

      <ul
        className="flex flex-wrap gap-1 rounded-2xl border border-[#E5E5E0] bg-white/95 p-2 shadow-[0_8px_24px_-14px_rgba(45,45,45,0.28)] backdrop-blur-md"
        aria-label="Chú thích trạng thái"
      >
        {(
          [
            "current",
            "in_progress",
            "completed",
            "available",
            "submitted",
            "locked",
          ] as const
        ).map((status) => (
          <li
            key={status}
            className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F0] px-2 py-1 text-[10px] text-[#6B6B6B]"
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                status === "current" && "bg-[#E94B3C]",
                status === "in_progress" && "bg-[#4FC3F7]",
                status === "completed" && "bg-[#7CB342]",
                status === "available" && "bg-[#D6D6CE]",
                status === "submitted" && "bg-[#7E57C2]",
                status === "locked" && "bg-[#B0B0B0]",
              )}
              aria-hidden
            />
            {MIND_MAP_STATUS_LABELS[status]}
          </li>
        ))}
      </ul>
    </div>
  );
}
