"use client";

import type { ReactNode } from "react";
import { Link2, Palette, LayoutList, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type PortfolioPanelId = "design" | "items" | "links";

const RAIL_ITEMS: Array<{
  id: PortfolioPanelId;
  label: string;
  icon: typeof Palette;
}> = [
  { id: "design", label: "Thiết kế", icon: Palette },
  { id: "items", label: "Mục", icon: LayoutList },
  { id: "links", label: "Liên kết", icon: Link2 },
];

type PortfolioRailProps = {
  active: PortfolioPanelId | null;
  onSelect: (panel: PortfolioPanelId | null) => void;
};

export function PortfolioRail({ active, onSelect }: PortfolioRailProps) {
  const buttons = RAIL_ITEMS.map((item) => {
    const isActive = active === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelect(isActive ? null : item.id)}
        aria-pressed={isActive}
        className={cn(
          "relative flex w-full flex-col items-center gap-1 rounded-2xl px-1.5 py-2.5 text-[10px] font-semibold leading-tight transition-all duration-200 outline-none",
          "focus-visible:ring-2 focus-visible:ring-[#4FC3F7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAF5]",
          "active:scale-[0.97]",
          isActive
            ? "bg-white text-[#0f7cad] shadow-[0_6px_16px_rgba(45,45,45,0.08)] ring-1 ring-[#4FC3F7]/35"
            : "text-[#6B6B6B] hover:bg-white/70 hover:text-[#2D2D2D]",
        )}
      >
        {isActive ? (
          <span
            aria-hidden
            className="absolute top-1/2 left-0 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#4FC3F7]"
          />
        ) : null}
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl transition-colors",
            isActive ? "bg-[#4FC3F7]/15 text-[#0f7cad]" : "bg-transparent",
          )}
        >
          <item.icon className="size-4" strokeWidth={1.75} />
        </span>
        <span className="max-w-[4.25rem] text-center">{item.label}</span>
      </button>
    );
  });

  return (
    <>
      {/* Desktop: vertical rail */}
      <nav
        aria-label="Công cụ portfolio"
        className="hidden w-[4.75rem] shrink-0 border-r border-[#E5E5E0] bg-[#FAFAF5] lg:block"
      >
        <div className="sticky top-[8.5rem] flex flex-col gap-2 px-1.5 py-4">
          {buttons}
        </div>
      </nav>

      {/* Mobile: bottom bar */}
      <nav
        aria-label="Công cụ portfolio"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[#E5E5E0] bg-[#FAFAF5]/95 px-2 py-1.5 backdrop-blur-md lg:hidden"
      >
        {buttons}
      </nav>
    </>
  );
}

type PortfolioPanelHostProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function PortfolioPanelHost({
  title,
  onClose,
  children,
}: PortfolioPanelHostProps) {
  return (
    <aside
      className={cn(
        "z-30 bg-[#FAFAF5]",
        // Mobile: overlay above the bottom bar
        "fixed inset-x-0 top-[8rem] bottom-[3.75rem] overflow-y-auto sm:top-[8.5rem]",
        // Desktop: docked column next to the rail
        "lg:static lg:inset-auto lg:w-[22rem] lg:shrink-0 lg:overflow-visible lg:border-r lg:border-[#E5E5E0]",
      )}
    >
      <div className="lg:sticky lg:top-[8.5rem] lg:max-h-[calc(100vh-9.5rem)] lg:overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E5E0] bg-[#FAFAF5]/95 px-5 py-3.5 backdrop-blur-sm">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6B6B6B]">
              Portfolio
            </p>
            <h2 className="font-heading text-sm font-bold text-[#2D2D2D]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Đóng bảng"
            onClick={onClose}
            className="rounded-xl p-2 text-[#6B6B6B] transition-colors hover:bg-white hover:text-[#2D2D2D] focus-visible:ring-2 focus-visible:ring-[#4FC3F7] outline-none"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </aside>
  );
}
