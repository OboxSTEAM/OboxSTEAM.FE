"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { EnrollmentOverview, RevenueOverview } from "@/lib/api";
import { cn } from "@/lib/utils";

import { STEAM_FILL } from "../chart-data";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import { formatCount, formatMoney } from "../dashboard-utils";

type Mode = "enrollment" | "revenue";

const MODE_OPTIONS: {
  key: Mode;
  label: string;
  fill: string;
}[] = [
  { key: "enrollment", label: "Đăng ký", fill: STEAM_FILL.science },
  { key: "revenue", label: "Doanh thu", fill: STEAM_FILL.technology },
];

type TopProgramsPanelProps = {
  enrollment: EnrollmentOverview;
  revenue: RevenueOverview;
  isLoading?: boolean;
  revealSignature: string;
};

type ProgramRow = {
  programId: string;
  name: string;
  value: number;
  barWidth: number;
};

function buildRows(
  mode: Mode,
  enrollment: EnrollmentOverview,
  revenue: RevenueOverview,
): ProgramRow[] {
  const source =
    mode === "enrollment"
      ? enrollment.topProgramsByEnrollment.items.slice(0, 5)
      : revenue.topProgramsByRevenue.items.slice(0, 5);

  const rows = source.map((item) => ({
    programId: item.programId,
    name: item.programName?.trim() || "Không tên",
    value:
      mode === "enrollment"
        ? (item as (typeof enrollment.topProgramsByEnrollment.items)[number])
            .count
        : (item as (typeof revenue.topProgramsByRevenue.items)[number]).amount,
    barWidth: 0,
  }));

  const max = rows.reduce((peak, row) => Math.max(peak, row.value), 0);

  return rows.map((row) => ({
    ...row,
    barWidth: max > 0 ? (row.value / max) * 100 : 0,
  }));
}

export function TopProgramsPanel({
  enrollment,
  revenue,
  isLoading,
}: TopProgramsPanelProps) {
  const [mode, setMode] = React.useState<Mode>("enrollment");

  const rows = React.useMemo(
    () => buildRows(mode, enrollment, revenue),
    [mode, enrollment, revenue],
  );

  const activeOption =
    MODE_OPTIONS.find((option) => option.key === mode) ?? MODE_OPTIONS[0];
  const formatValue = mode === "enrollment" ? formatCount : formatMoney;

  return (
    <DashboardPanel className="flex h-full min-w-0 flex-col">
      <div className="flex flex-col gap-2 @min-[420px]/dash:flex-row @min-[420px]/dash:items-start @min-[420px]/dash:justify-between">
        <DashboardSectionTitle title="Top chương trình" />

        <div
          role="group"
          aria-label="Chế độ top chương trình"
          className="grid w-full shrink-0 grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1 @min-[420px]/dash:w-auto"
        >
          {MODE_OPTIONS.map((option) => {
            const selected = option.key === mode;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setMode(option.key)}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-center text-[11px] font-semibold transition-colors",
                  selected
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: option.fill }}
                  aria-hidden
                />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 min-h-0 min-w-0 flex-1">
        {isLoading ? (
          <ul className="flex h-full min-h-[200px] flex-col justify-center gap-3.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className="space-y-1.5">
                <div className="h-4 animate-pulse rounded bg-border/70" />
                <div className="h-1.5 animate-pulse rounded-full bg-border/70" />
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground sm:min-h-[220px]">
            Chưa có dữ liệu
          </div>
        ) : (
          <ul className="flex h-full min-h-[200px] flex-col justify-center gap-3.5 sm:min-h-[220px] sm:gap-4">
            {rows.map((row) => (
              <li key={row.programId} className="min-w-0">
                <div className="mb-1.5 flex min-w-0 items-baseline justify-between gap-3">
                  <p
                    className="min-w-0 truncate text-sm font-medium text-foreground"
                    title={row.name}
                  >
                    {row.name}
                  </p>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground sm:text-sm">
                    {formatValue(row.value)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${row.barWidth}%`,
                      backgroundColor: activeOption.fill,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href="/manager/programs"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-steam-science hover:underline"
      >
        Quản lý chương trình
        <ArrowUpRight className="size-3.5" aria-hidden />
      </Link>
    </DashboardPanel>
  );
}
