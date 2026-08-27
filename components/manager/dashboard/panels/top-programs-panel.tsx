"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";

import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { ChartTooltip } from "@/components/charts/tooltip";
import { Grid } from "@/components/charts/grid";
import { useContainerWidth } from "@/hooks/use-container-narrow";
import type { EnrollmentOverview, RevenueOverview } from "@/lib/api";
import { cn } from "@/lib/utils";

import { STEAM_FILL } from "../chart-data";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import {
  formatCount,
  formatMoney,
  prefersReducedMotion,
  truncateChartLabel,
} from "../dashboard-utils";

type Mode = "enrollment" | "revenue";

type TopProgramsPanelProps = {
  enrollment: EnrollmentOverview;
  revenue: RevenueOverview;
  isLoading?: boolean;
  revealSignature: string;
};

function chartLayout(width: number) {
  if (width > 0 && width < 360) {
    return { left: 72, maxLabel: 10, height: 200, right: 10 };
  }
  if (width > 0 && width < 480) {
    return { left: 92, maxLabel: 14, height: 220, right: 12 };
  }
  if (width > 0 && width < 640) {
    return { left: 112, maxLabel: 18, height: 240, right: 14 };
  }
  return { left: 132, maxLabel: 28, height: 240, right: 16 };
}

export function TopProgramsPanel({
  enrollment,
  revenue,
  isLoading,
  revealSignature,
}: TopProgramsPanelProps) {
  const [mode, setMode] = React.useState<Mode>("enrollment");
  const reducedMotion = prefersReducedMotion();
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const width = useContainerWidth(bodyRef);
  const layout = chartLayout(width);

  const enrollmentRows = enrollment.topProgramsByEnrollment.items
    .slice(0, 5)
    .map((program) => ({
      name: program.programName ?? "Không tên",
      value: program.count,
    }));
  const revenueRows = revenue.topProgramsByRevenue.items
    .slice(0, 5)
    .map((program) => ({
      name: program.programName ?? "Không tên",
      value: program.amount,
    }));

  const source = mode === "enrollment" ? enrollmentRows : revenueRows;
  const data = source.map((row) => ({
    ...row,
    name: truncateChartLabel(row.name, layout.maxLabel),
    fullName: row.name,
  }));
  const formatValue = mode === "enrollment" ? formatCount : formatMoney;
  const fill =
    mode === "enrollment" ? STEAM_FILL.science : STEAM_FILL.technology;

  return (
    <DashboardPanel className="flex h-full min-w-0 flex-col">
      <div className="mb-2 flex min-w-0 items-center gap-2">
        <BookOpen className="size-4 shrink-0 text-steam-science" />
        <DashboardSectionTitle title="Top chương trình" />
      </div>

      <div
        role="group"
        aria-label="Chế độ top chương trình"
        className="mb-3 grid w-full max-w-xs grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1 sm:max-w-none"
      >
        {(
          [
            { key: "enrollment", label: "Đăng ký" },
            { key: "revenue", label: "Doanh thu" },
          ] as const
        ).map((option) => {
          const selected = option.key === mode;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => setMode(option.key)}
              className={cn(
                "rounded-lg px-2 py-1 text-center text-[11px] font-semibold transition-colors",
                selected
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div ref={bodyRef} className="min-w-0 flex-1">
        {data.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
        ) : (
          <div style={{ height: layout.height }}>
            <BarChart
              data={data}
              xDataKey="name"
              orientation="horizontal"
              status={isLoading ? "loading" : "ready"}
              revealSignature={`${revealSignature}-${mode}-${layout.left}`}
              animationDuration={reducedMotion ? 0 : 1100}
              aspectRatio="auto"
              className="h-full min-w-0"
              barGap={0.4}
              margin={{
                top: 8,
                right: layout.right,
                bottom: 8,
                left: layout.left,
              }}
            >
              <Grid horizontal={false} vertical />
              <Bar dataKey="value" fill={fill} lineCap="round" />
              <BarYAxis />
              <ChartTooltip
                content={({ point }) => (
                  <div className="rounded-lg bg-popover px-3 py-2 text-popover-foreground shadow-md">
                    <p className="text-[11px] text-muted-foreground">
                      {String(point.fullName ?? point.name ?? "—")}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">
                      {formatValue(Number(point.value ?? 0))}
                    </p>
                  </div>
                )}
              />
            </BarChart>
          </div>
        )}
      </div>

      <Link
        href="/manager/programs"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-steam-science hover:underline"
      >
        Quản lý chương trình
        <ArrowUpRight className="size-3.5" />
      </Link>
    </DashboardPanel>
  );
}
