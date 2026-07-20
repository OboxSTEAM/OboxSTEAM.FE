"use client";

import type { ReactNode } from "react";
import { Crosshair, Maximize2, Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

type MindMapFloatingControlsProps = {
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFocusCurrent: () => void;
  className?: string;
};

const LEGEND_ITEMS = [
  { label: "Đang học", dot: "bg-[#E94B3C]" },
  { label: "Hoàn thành", dot: "bg-[#7CB342]" },
  { label: "Khóa", dot: "bg-[#C8C8C0]" },
] as const;

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
        "pointer-events-auto absolute bottom-4 left-4 z-20 flex flex-col gap-2",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-2xl border border-[#E5E5E0] bg-white/95 p-1.5",
          "shadow-[0_8px_24px_-18px_rgba(45,43,39,0.45)] backdrop-blur-sm",
        )}
      >
        <ControlIconButton onClick={onZoomOut} label="Thu nhỏ">
          <Minus className="size-4" strokeWidth={2.35} aria-hidden />
        </ControlIconButton>
        <ControlIconButton onClick={onZoomIn} label="Phóng to">
          <Plus className="size-4" strokeWidth={2.35} aria-hidden />
        </ControlIconButton>
        <ControlIconButton onClick={onFit} label="Vừa khung nhìn">
          <Maximize2 className="size-4" strokeWidth={2.35} aria-hidden />
        </ControlIconButton>
        <button
          type="button"
          onClick={onFocusCurrent}
          className={cn(
            "ml-0.5 flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3",
            "text-xs font-bold tracking-tight text-[#2D2D2D]",
            "transition-colors hover:bg-[#F5F5F0]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]",
          )}
        >
          <Crosshair className="size-3.5" strokeWidth={2.35} aria-hidden />
          Hiện tại
        </button>
      </div>

      <ul
        className={cn(
          "flex items-center gap-3 rounded-xl border border-[#E5E5E0] bg-white/90 px-3 py-2",
          "shadow-[0_6px_16px_-14px_rgba(45,43,39,0.35)] backdrop-blur-sm",
        )}
        aria-label="Chú thích trạng thái"
      >
        {LEGEND_ITEMS.map(({ label, dot }) => (
          <li
            key={label}
            className="flex items-center gap-1.5 text-[11px] font-semibold tracking-tight text-[#6B6B6B]"
          >
            <span className={cn("size-2 shrink-0 rounded-full", dot)} aria-hidden />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ControlIconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl text-[#2D2D2D]",
        "transition-colors hover:bg-[#F5F5F0]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]",
      )}
    >
      {children}
    </button>
  );
}
