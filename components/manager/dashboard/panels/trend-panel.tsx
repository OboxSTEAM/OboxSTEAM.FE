"use client";

import * as React from "react";

import { Area } from "@/components/charts/area";
import { AreaChart } from "@/components/charts/area-chart";
import { chartCssVars } from "@/components/charts/chart-context";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import type {
  AssessmentOverview,
  DashboardRange,
  EnrollmentOverview,
  OperationsOverview,
  RevenueOverview,
  TrendSeries,
} from "@/lib/api";
import { cn } from "@/lib/utils";

import {
  axisFormatterFor,
  formatterFor,
  STEAM_FILL,
  trendSeriesToChartData,
} from "../chart-data";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import { prefersReducedMotion } from "../dashboard-utils";

type TrendKey = "enrollment" | "revenue" | "submissions" | "attendance";

const TREND_OPTIONS: {
  key: TrendKey;
  label: string;
  fill: string;
}[] = [
  { key: "enrollment", label: "Đăng ký", fill: STEAM_FILL.engineering },
  { key: "revenue", label: "Doanh thu", fill: STEAM_FILL.technology },
  { key: "submissions", label: "Bài nộp", fill: STEAM_FILL.science },
  { key: "attendance", label: "Điểm danh", fill: STEAM_FILL.mathematics },
];

type TrendPanelProps = {
  range: DashboardRange;
  isLoading: boolean;
  enrollment: EnrollmentOverview;
  revenue: RevenueOverview;
  assessment: AssessmentOverview;
  operations: OperationsOverview;
};

function seriesFor(
  key: TrendKey,
  props: Omit<TrendPanelProps, "range" | "isLoading">,
): TrendSeries {
  switch (key) {
    case "revenue":
      return props.revenue.revenueTrend;
    case "submissions":
      return props.assessment.submissionsTrend;
    case "attendance":
      return props.operations.attendanceTrend;
    case "enrollment":
    default:
      return props.enrollment.enrollmentTrend;
  }
}

export function TrendPanel({
  range,
  isLoading,
  enrollment,
  revenue,
  assessment,
  operations,
}: TrendPanelProps) {
  const [active, setActive] = React.useState<TrendKey>("enrollment");
  const reducedMotion = prefersReducedMotion();
  const series = seriesFor(active, {
    enrollment,
    revenue,
    assessment,
    operations,
  });
  const data = trendSeriesToChartData(series);
  const formatValue = formatterFor(series.valueKind);
  const formatAxis = axisFormatterFor(series.valueKind);
  const seriesColor =
    TREND_OPTIONS.find((o) => o.key === active)?.fill ?? STEAM_FILL.engineering;

  return (
    <DashboardPanel className="h-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <DashboardSectionTitle title="Xu hướng tăng trưởng" />
        <div
          role="group"
          aria-label="Chọn chuỗi xu hướng"
          className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1 sm:grid-cols-4"
        >
          {TREND_OPTIONS.map((option) => {
            const selected = option.key === active;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setActive(option.key)}
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
      </div>

      <div className="mt-3 h-[260px]">
        {data.length === 0 && !isLoading ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-background text-sm text-muted-foreground">
            Chưa có dữ liệu xu hướng trong khoảng này
          </div>
        ) : (
          <AreaChart
            data={data}
            xDataKey="date"
            status={isLoading ? "loading" : "ready"}
            revealSignature={`${range}-${active}`}
            animationDuration={reducedMotion ? 0 : 1100}
            aspectRatio="auto"
            className="h-full"
            style={{ aspectRatio: "auto", height: "100%" }}
            margin={{ top: 12, right: 16, bottom: 28, left: 52 }}
            loadingLabel="Đang tải…"
          >
            <Grid horizontal hideHorizontalEdgeLines numTicksRows={4} />
            <Area
              dataKey="value"
              fill={seriesColor}
              stroke={seriesColor}
              strokeWidth={2}
            />
            <YAxis formatValue={formatAxis} numTicks={4} />
            <XAxis numTicks={4} />
            <ChartTooltip
              content={({ point }) => (
                <div className="rounded-lg bg-popover px-3 py-2 text-popover-foreground shadow-md">
                  <p className="text-[11px] text-muted-foreground">
                    {typeof point.label === "string"
                      ? point.label
                      : point.date instanceof Date
                        ? point.date.toLocaleDateString("vi-VN")
                        : "—"}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">
                    {formatValue(Number(point.value ?? 0))}
                  </p>
                </div>
              )}
              indicatorColor={chartCssVars.linePrimary}
            />
          </AreaChart>
        )}
      </div>
    </DashboardPanel>
  );
}
