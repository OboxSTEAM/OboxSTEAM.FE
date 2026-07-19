import type { ReactNode } from "react";

import type { PortfolioItem } from "@/lib/api/entities/portfolio";
import type { PortfolioLayoutStyleId } from "@/lib/portfolio/constants";
import { cn } from "@/lib/utils";

/** Marker size for timeline rail — gutter widths live in Tailwind classes. */
const TIMELINE_MARKER = "0.875rem"; // 14px

/** Grid / list container classes for portfolio item groups. */
export function itemsLayoutClass(
  layoutStyle: PortfolioLayoutStyleId,
  density: "editor" | "public" = "public",
): string {
  const gap = density === "editor" ? "gap-3" : "gap-4";
  const spaceY = density === "editor" ? "space-y-3" : "space-y-4";

  switch (layoutStyle) {
    case "bento":
      return cn("grid auto-rows-auto sm:grid-cols-2", gap);
    case "timeline":
      return "relative flex flex-col gap-6 sm:gap-8 md:gap-10";
    case "masonry":
      return density === "editor"
        ? "columns-1 gap-3 sm:columns-2 [&>*]:mb-3 [&>*]:break-inside-avoid"
        : "columns-1 gap-4 sm:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid";
    default:
      return spaceY;
  }
}

export function itemSpanClass(
  span: PortfolioItem["span"],
  layoutStyle: PortfolioLayoutStyleId,
): string {
  if (layoutStyle !== "bento") return "";
  switch (span) {
    case "Wide":
      return "sm:col-span-2";
    case "Tall":
      return "sm:row-span-2";
    case "Large":
      return "sm:col-span-2 sm:row-span-2";
    default:
      return "";
  }
}

export function isTimelineLayout(
  layoutStyle: PortfolioLayoutStyleId | null | undefined,
): boolean {
  return layoutStyle === "timeline";
}

type TimelineListProps = {
  primaryColor: string;
  isDark: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Continuous vertical rail — centered in the 2rem gutter shared by TimelineEntry.
 * Soft fade at both ends so the line reads smooth rather than cut off.
 */
export function TimelineList({
  primaryColor,
  isDark,
  className,
  children,
}: TimelineListProps) {
  const railTone = isDark ? `${primaryColor}b3` : `${primaryColor}99`;

  return (
    <div className={cn("relative", className)}>
      <div
        className="pointer-events-none absolute top-2 bottom-2 left-[calc((1.5rem-2px)/2)] z-0 w-0.5 rounded-full sm:left-[calc((2rem-2px)/2)]"
        style={{
          background: `linear-gradient(
            180deg,
            transparent 0%,
            ${railTone} 8%,
            ${railTone} 92%,
            transparent 100%
          )`,
        }}
        aria-hidden
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

type TimelineEntryProps = {
  primaryColor: string;
  isDark: boolean;
  dateLabel?: string | null;
  className?: string;
  /** When false, renders children only (no rail marker). */
  enabled?: boolean;
  children: ReactNode;
};

/** Marker (centered on rail) + date chip + card with breathing room. */
export function TimelineEntry({
  primaryColor,
  isDark,
  dateLabel,
  className,
  enabled = true,
  children,
}: TimelineEntryProps) {
  if (!enabled) return <>{children}</>;

  const ring = isDark ? "#121212" : "#FFFFFF";

  return (
    <div
      className={cn(
        "grid items-start gap-x-3 sm:gap-x-5",
        "grid-cols-[1.5rem_minmax(0,1fr)] sm:grid-cols-[2rem_minmax(0,1fr)]",
        className,
      )}
    >
      {/* Marker column — same width as TimelineList gutter so the rail stays centered */}
      <div className="relative flex justify-center pt-4 sm:pt-5">
        <span
          className="relative z-[1] block shrink-0 rounded-full"
          style={{
            width: TIMELINE_MARKER,
            height: TIMELINE_MARKER,
            backgroundColor: primaryColor,
            boxShadow: `0 0 0 3px ${ring}, 0 0 0 5px ${primaryColor}55`,
          }}
          aria-hidden
        />
      </div>

      <div className="min-w-0 space-y-2.5 pt-0.5 sm:space-y-3 sm:pt-1">
        {dateLabel ? (
          <p
            className={cn(
              "inline-flex max-w-full items-center rounded-full px-2.5 py-1 sm:px-3",
              "font-mono text-[10px] font-semibold tracking-[0.08em] sm:text-[11px]",
              isDark
                ? "bg-[#FAFAF5]/10 text-[#FAFAF5]"
                : "bg-[#F0F0EA] text-[#2D2D2D]",
            )}
          >
            <span
              className="mr-2 size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: primaryColor }}
              aria-hidden
            />
            <span className="min-w-0 truncate">{dateLabel}</span>
          </p>
        ) : (
          <p
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 sm:px-3",
              "font-mono text-[10px] font-semibold tracking-[0.08em] sm:text-[11px]",
              isDark
                ? "bg-[#FAFAF5]/08 text-[#FAFAF5]/55"
                : "bg-[#F0F0EA] text-[#8A8A84]",
            )}
          >
            Chưa có ngày
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
