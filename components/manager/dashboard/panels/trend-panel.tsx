"use client";

import * as React from "react";
import NumberFlow from "@number-flow/react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Area } from "@/components/charts/area";
import { AreaChart } from "@/components/charts/area-chart";
import { trendTooltipDateFmt } from "@/components/charts/chart-formatters";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { useContainerWidth } from "@/hooks/use-container-narrow";
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
  trendGranularityLabel,
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

function chartLayout(width: number, pointCount: number) {
  const xTicks =
    width > 0 && width < 420
      ? 3
      : width > 0 && width < 720
        ? 4
        : pointCount > 20
          ? 4
          : 5;

  if (width > 0 && width < 420) {
    return {
      height: 200,
      left: 36,
      right: 8,
      bottom: 36,
      yTicks: 3,
      xTicks,
      tickerHalfWidth: 28,
    };
  }
  if (width > 0 && width < 640) {
    return {
      height: 230,
      left: 44,
      right: 12,
      bottom: 38,
      yTicks: 4,
      xTicks,
      tickerHalfWidth: 32,
    };
  }
  return {
    height: 260,
    left: 52,
    right: 16,
    bottom: 40,
    yTicks: 4,
    xTicks,
    tickerHalfWidth: 36,
  };
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
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const width = useContainerWidth(bodyRef);
  const overview = { enrollment, revenue, assessment, operations };
  const series = seriesFor(active, overview);
  const summary = summaryFor(active, overview);
  const data = trendSeriesToChartData(series);
  const layout = chartLayout(width, data.length);
  const formatValue = formatterFor(series.valueKind);
  const formatAxis = axisFormatterFor(series.valueKind);
  const activeOption =
    TREND_OPTIONS.find((option) => option.key === active) ?? TREND_OPTIONS[0];
  const seriesColor = activeOption.fill;
  const useIntegerYTicks = series.valueKind === "Count";

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
    <DashboardPanel className="flex h-full min-w-0 flex-col">
      <div className="flex flex-col gap-3 @min-[560px]/dash:flex-row @min-[560px]/dash:items-start @min-[560px]/dash:justify-between">
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
          className="grid w-full grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1 @min-[560px]/dash:w-auto @min-[560px]/dash:min-w-[280px] @min-[560px]/dash:grid-cols-4"
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

      <div ref={bodyRef} className="mt-3 min-w-0">
        <div style={{ height: layout.height }}>
          {data.length === 0 && !isLoading ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-background px-3 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu xu hướng trong khoảng này
            </div>
          ) : (
            <AreaChart
              data={data}
              xDataKey="date"
              status={isLoading ? "loading" : "ready"}
              revealSignature={`${range}-${active}-${layout.left}`}
              animationDuration={reducedMotion ? 0 : 1100}
              aspectRatio="auto"
              className="h-full min-w-0"
              style={{ aspectRatio: "auto", height: "100%" }}
              margin={{
                top: 12,
                right: layout.right,
                bottom: layout.bottom,
                left: layout.left,
              }}
              loadingLabel="Đang tải…"
            >
              <Grid
                horizontal
                hideHorizontalEdgeLines
                numTicksRows={layout.yTicks}
              />
              <Area
                dataKey="value"
                fill={seriesColor}
                stroke={seriesColor}
                strokeWidth={2}
              />
              <YAxis
                formatValue={formatAxis}
                integerTicks={useIntegerYTicks}
                numTicks={layout.yTicks}
              />
              <XAxis
                numTicks={layout.xTicks}
                tickerHalfWidth={layout.tickerHalfWidth}
              />
              <ChartTooltip
                showDatePill={false}
                content={({ point }) => {
                  const date =
                    point.date instanceof Date ? point.date : null;
                  const bucketLabel =
                    typeof point.label === "string" && point.label.trim()
                      ? point.label
                      : null;

                  return (
                    <div className="overflow-hidden">
                      <div className="space-y-1 px-3 py-2.5">
                        {date ? (
                          <p className="text-left font-medium text-chart-tooltip-foreground text-xs capitalize leading-snug">
                            {trendTooltipDateFmt.format(date)}
                          </p>
                        ) : null}
                        {bucketLabel ? (
                          <p className="text-left text-[11px] leading-snug text-chart-tooltip-muted">
                            {bucketLabel}
                          </p>
                        ) : null}
                        <p className="text-left text-[11px] leading-snug text-chart-tooltip-muted">
                          {trendGranularityLabel(series.granularity)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-border/40 px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: seriesColor }}
                            aria-hidden
                          />
                          <span className="truncate text-chart-tooltip-muted text-sm">
                            {activeOption.label}
                          </span>
                        </div>
                        <span className="shrink-0 font-medium text-chart-tooltip-foreground text-sm tabular-nums">
                          {formatValue(Number(point.value ?? 0))}
                        </span>
                      </div>
                    </div>
                  );
                }}
                indicatorColor={seriesColor}
              />
            </AreaChart>
          )}
        </div>
      </div>
    </DashboardPanel>
  );
}
