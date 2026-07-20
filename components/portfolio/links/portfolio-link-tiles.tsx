"use client";

import { ArrowUpRight } from "lucide-react";

import { PortfolioLinkIcon } from "@/components/portfolio/links/portfolio-link-icon";
import type { PortfolioLink } from "@/lib/api/entities/portfolio";
import {
  getPortfolioLinkHostHint,
  resolvePortfolioLinkPlatform,
} from "@/lib/portfolio/links";
import { cn } from "@/lib/utils";

type PortfolioLinkTilesProps = {
  links: PortfolioLink[];
  isDark?: boolean;
  /** Interactive anchors (public / preview). Editor preview can disable. */
  interactive?: boolean;
  className?: string;
};

export function PortfolioLinkTiles({
  links,
  isDark = false,
  interactive = true,
  className,
}: PortfolioLinkTilesProps) {
  const visible = links.filter((link) => Boolean(link.url?.trim()));
  if (visible.length === 0) return null;

  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-2.5 @min-[640px]/pf:grid-cols-2",
        className,
      )}
    >
      {visible.map((link, index) => {
        const platform = resolvePortfolioLinkPlatform(link.url, link.label);
        const title = link.label?.trim() || platform.label;
        const hint = getPortfolioLinkHostHint(link.url);
        const accent = platform.accent;

        const content = (
          <>
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                isDark ? "bg-white/10" : "bg-[#FAFAF5]",
              )}
              style={{ color: accent }}
            >
              <PortfolioLinkIcon
                url={link.url}
                label={link.label}
                size={20}
              />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span
                className={cn(
                  "block truncate text-sm font-semibold tracking-tight",
                  isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
                )}
              >
                {title}
              </span>
              {hint ? (
                <span
                  className={cn(
                    "mt-0.5 block truncate text-xs",
                    isDark ? "text-[#FAFAF5]/55" : "text-[#6B6B6B]",
                  )}
                >
                  {hint}
                </span>
              ) : null}
            </span>
            <ArrowUpRight
              className={cn(
                "size-4 shrink-0 opacity-40 transition-opacity duration-150",
                "group-hover:opacity-100",
                isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
              )}
              aria-hidden
            />
          </>
        );

        const shellClass = cn(
          "group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 transition-[border-color,background-color,transform] duration-150",
          "outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
          isDark
            ? "border-white/12 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
            : "border-[#E5E5E0] bg-white hover:border-[#C9C9C2] hover:bg-[#FAFAF5]",
          interactive && "hover:-translate-y-px active:translate-y-0",
        );

        return (
          <li key={`${link.url}-${index}`} className="min-w-0 list-none">
            {interactive ? (
              <a
                href={link.url!}
                target="_blank"
                rel="noreferrer"
                className={shellClass}
              >
                {content}
              </a>
            ) : (
              <div className={shellClass}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
