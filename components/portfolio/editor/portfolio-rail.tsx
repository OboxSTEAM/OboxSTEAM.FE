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
          "flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-[10px] font-semibold leading-tight transition-colors outline-none",
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
        "fixed inset-x-0 top-[8rem] bottom-[3.75rem] overflow-y-auto sm:top-[8.5rem]",
        "lg:static lg:inset-auto lg:w-[22.5rem] lg:shrink-0 lg:overflow-visible lg:border-r lg:border-[#E5E5E0]",
      )}
    >
      <div className="lg:sticky lg:top-[8.5rem] lg:max-h-[calc(100vh-9.5rem)] lg:overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E5E0] bg-[#FAFAF5]/95 px-5 py-3 backdrop-blur-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f7cad]">
              Portfolio
            </p>
            <h2 className="text-sm font-semibold tracking-tight text-[#2D2D2D]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Đóng bảng"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#2D2D2D] transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50 outline-none"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </aside>
  );
}
