"use client";

import * as React from "react";
import NumberFlow from "@number-flow/react";
import { TrendingDown, TrendingUp } from "lucide-react";

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
  deltaPercent,
  formatterFor,
  STEAM_FILL,
  toPercentValue,
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

function summaryFor(
  key: TrendKey,
  props: Omit<TrendPanelProps, "range" | "isLoading">,
): { value: number; delta: number | null; suffix?: string } {
  switch (key) {
    case "revenue":
      return {
        value: props.revenue.revenueInRange,
        delta: deltaPercent(
          props.revenue.revenueInRange,
          props.revenue.revenueInPreviousRange,
        ),
      };
    case "submissions":
      return {
        value: props.assessment.submissionsInRange,
        delta: deltaPercent(
          props.assessment.submissionsInRange,
          props.assessment.submissionsInPreviousRange,
        ),
      };
    case "attendance": {
      const current = toPercentValue(
        props.operations.averageAttendanceRate,
        props.operations.rateUnit,
      );
      const previous = toPercentValue(
        props.operations.averageAttendanceRateInPreviousRange,
        props.operations.rateUnit,
      );
      return {
        value: current,
        delta: deltaPercent(current, previous),
        suffix: "%",
      };
    }
    case "enrollment":
    default:
      return {
        value: props.enrollment.newEnrollmentsInRange,
        delta: deltaPercent(
          props.enrollment.newEnrollmentsInRange,
          props.enrollment.newEnrollmentsInPreviousRange,
        ),
      };
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
  const overview = { enrollment, revenue, assessment, operations };
  const series = seriesFor(active, overview);
  const summary = summaryFor(active, overview);
  const data = trendSeriesToChartData(series);
  const formatValue = formatterFor(series.valueKind);
  const formatAxis = axisFormatterFor(series.valueKind);
  const seriesColor =
    TREND_OPTIONS.find((o) => o.key === active)?.fill ?? STEAM_FILL.engineering;

  const numberFormat =
    series.valueKind === "Currency"
      ? ({
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
          notation: "compact",
        } as const)
      : series.valueKind === "Percent"
        ? ({ maximumFractionDigits: 1 } as const)
        : ({ maximumFractionDigits: 0 } as const);

  return (
    <DashboardPanel className="h-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <DashboardSectionTitle title="Xu hướng tăng trưởng" />
          <div className="flex flex-wrap items-baseline gap-2">
            <p
              className="font-heading text-2xl font-black tabular-nums tracking-tight text-foreground sm:text-3xl"
              style={{ color: seriesColor }}
            >
              <NumberFlow
                value={summary.value}
                format={numberFormat}
                locales="vi-VN"
                className="tabular-nums"
              />
              {summary.suffix}
            </p>
            {summary.delta != null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  summary.delta >= 0
                    ? "bg-steam-technology/15 text-steam-technology"
                    : "bg-steam-science/15 text-steam-science",
                )}
              >
                {summary.delta >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {summary.delta >= 0 ? "+" : ""}
                {summary.delta.toFixed(1)}%
              </span>
            ) : null}
          </div>
        </div>

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
