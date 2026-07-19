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
          "flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold leading-tight transition-colors outline-none sm:gap-1 sm:py-2.5",
          "focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
          isActive
            ? "bg-[#4FC3F7]/15 text-[#0f7cad]"
            : "text-[#2D2D2D] hover:bg-[#F5F5F0]",
        )}
      >
        <item.icon className="size-[1.125rem]" strokeWidth={2.25} />
        <span className="max-w-[4.25rem] text-center tracking-tight">{item.label}</span>
      </button>
    );
  });

  return (
    <>
      <nav
        aria-label="Công cụ portfolio"
        className="hidden w-[4.5rem] shrink-0 border-r border-[#E5E5E0] bg-[#FAFAF5] lg:block"
      >
        <div className="sticky top-[8.5rem] flex flex-col gap-1 px-1.5 py-3">
          {buttons}
        </div>
      </nav>

      <nav
        aria-label="Công cụ portfolio"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around",
          "border-t border-[#E5E5E0] bg-[#FAFAF5]/95 px-1 pt-1 backdrop-blur-md",
          "pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden",
        )}
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
        "fixed inset-x-0 top-[8rem] overflow-y-auto overscroll-contain sm:top-[8.5rem]",
        "bottom-[calc(3.75rem+env(safe-area-inset-bottom))]",
        "lg:static lg:inset-auto lg:bottom-auto lg:w-[22.5rem] lg:shrink-0 lg:overflow-visible lg:border-r lg:border-[#E5E5E0]",
      )}
    >
      <div className="lg:sticky lg:top-[8.5rem] lg:max-h-[calc(100dvh-9.5rem)] lg:overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E5E0] bg-[#FAFAF5]/95 px-4 py-3 backdrop-blur-sm sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f7cad]">
              Portfolio
            </p>
            <h2 className="truncate text-sm font-semibold tracking-tight text-[#2D2D2D]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Đóng bảng"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#2D2D2D] transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50 outline-none"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
      </div>
    </aside>
  );
}
