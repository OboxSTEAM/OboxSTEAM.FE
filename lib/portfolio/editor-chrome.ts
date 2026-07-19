import { cn } from "@/lib/utils";

/**
 * Unified editor-chrome tokens for the portfolio customize canvas.
 * Controls (add bars, hover tools, upload buttons, empty states) must NOT
 * inherit portfolio content text color — that causes white-on-white / gray-on-gray.
 */
export type EditorChrome = {
  /** Dashed panel for empty states / add-section bar. */
  panel: string;
  muted: string;
  /** Outline control button (sync, add-section kinds, upload). */
  outlineBtn: string;
  ghostBtn: string;
  /** Full-width dashed “Thêm mục / Thêm liên kết” CTA. */
  dashedCta: string;
  /** Floating hover toolbar behind card/section icons. */
  hoverBar: string;
  iconBtn: string;
  iconBtnDestructive: string;
  iconBtnEmphasized: string;
};

export function editorChrome(isDark: boolean): EditorChrome {
  if (isDark) {
    return {
      panel:
        "rounded-xl border border-dashed border-[#FAFAF5]/28 bg-[#1a1a1a]/90 text-[#FAFAF5]",
      muted: "text-[#FAFAF5]/70",
      outlineBtn:
        "border-[#FAFAF5]/28 bg-[#262626] text-[#FAFAF5] hover:bg-[#333333] hover:text-[#FAFAF5]",
      ghostBtn:
        "text-[#FAFAF5]/75 hover:bg-[#FAFAF5]/10 hover:text-[#FAFAF5]",
      dashedCta:
        "rounded-xl border border-dashed border-[#FAFAF5]/35 bg-[#FAFAF5]/5 text-[#FAFAF5] hover:border-[#4FC3F7] hover:bg-[#4FC3F7]/10",
      hoverBar:
        "border-[#FAFAF5]/20 bg-[#262626] text-[#FAFAF5] shadow-[0_8px_20px_rgba(0,0,0,0.45)]",
      iconBtn: "text-[#FAFAF5] hover:bg-[#FAFAF5]/12",
      iconBtnDestructive: "text-[#FF8A80] hover:bg-[#E94B3C]/20 hover:text-[#FF8A80]",
      iconBtnEmphasized: "bg-[#FAFAF5] text-[#1a1a1a] hover:bg-white",
    };
  }

  return {
    panel:
      "rounded-xl border border-dashed border-[#C9C9C2] bg-white/80 text-[#2D2D2D]",
    muted: "text-[#6B6B6B]",
    outlineBtn:
      "border-[#E5E5E0] bg-white text-[#2D2D2D] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]",
    ghostBtn: "text-[#6B6B6B] hover:bg-[#F0F0EA] hover:text-[#2D2D2D]",
    dashedCta:
      "rounded-xl border border-dashed border-[#C9C9C2] bg-white/50 text-[#2D2D2D] hover:border-[var(--pf-primary)] hover:bg-[color-mix(in_srgb,var(--pf-primary)_8%,white)]",
    hoverBar: "border-[#E5E5E0] bg-white text-[#2D2D2D] shadow-sm",
    iconBtn: "text-[#2D2D2D] hover:bg-[#F0F0EA]",
    iconBtnDestructive: "text-[#E94B3C] hover:bg-[#E94B3C]/10 hover:text-[#E94B3C]",
    iconBtnEmphasized: "bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]",
  };
}

export function editorChromeOutlineBtn(
  isDark: boolean,
  className?: string,
): string {
  return cn("h-8 rounded-lg text-xs", editorChrome(isDark).outlineBtn, className);
}
