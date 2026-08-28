"use client";

import NumberFlow from "@number-flow/react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";

import type { ChartStatFlowFormat } from "@/components/charts/chart-stat-flow";
import { cn } from "@/lib/utils";

type KpiStatCardProps = {
  label: string;
  hint: string;
  value: number;
  href: string;
  icon: LucideIcon;
  accentClassName: string;
  tintClassName?: string;
  footnote?: string;
  alert?: boolean;
  delta?: number | null;
  format?: ChartStatFlowFormat;
  prefix?: string;
  suffix?: string;
};

export function KpiStatCard({
  label,
  hint,
  value,
  href,
  icon: Icon,
  accentClassName,
  tintClassName,
  footnote,
  alert,
  delta,
  format,
  prefix,
  suffix,
}: KpiStatCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group @container min-w-0 rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:border-foreground/20 hover:bg-background sm:p-4",
        tintClassName,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <Icon className={cn("size-4 shrink-0 opacity-90", accentClassName)} />
      </div>

      <p
        className={cn(
          "mt-2.5 font-heading text-2xl font-black tabular-nums tracking-tight sm:text-3xl",
          accentClassName,
        )}
      >
        {prefix}
        <NumberFlow
          value={value}
          format={format}
          locales="vi-VN"
          className="tabular-nums"
        />
        {suffix}
      </p>

      {delta != null ? (
        <p
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            delta >= 0
              ? "bg-steam-technology/15 text-steam-technology"
              : "bg-steam-science/15 text-steam-science",
          )}
        >
          {delta >= 0 ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}%
          <span className="hidden @min-[380px]:inline"> so với kỳ trước</span>
        </p>
      ) : null}

      {footnote ? (
        <p
          className={cn(
            "mt-1.5 text-[11px] leading-snug",
            alert ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          {footnote}
        </p>
      ) : null}
    </Link>
  );
}
