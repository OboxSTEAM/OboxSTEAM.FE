"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PieCenter } from "@/components/charts/pie-center";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { useContainerWidth } from "@/hooks/use-container-narrow";
import type { StatusCount } from "@/lib/api";
import { cn } from "@/lib/utils";

import { statusCountsToChartData, statusFill } from "../chart-data";
import {
  classStatusAttention,
  DonutAttentionChips,
  DonutDominantLine,
  DonutStackBar,
  enrollmentStatusAttention,
  type DonutInsightSlice,
} from "../donut-insights";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import { formatCount, prefersReducedMotion } from "../dashboard-utils";

type StatusBreakdownKind = "class" | "enrollment";

export type StatusDataset = {
  key: string;
  label: string;
  title: string;
  description: string;
  items: StatusCount[];
  kind: StatusBreakdownKind;
  href: string;
  linkLabel: string;
};

type StatusBreakdownPanelProps = {
  datasets: StatusDataset[];
  isLoading?: boolean;
  revealSignature: string;
};

type StatusSlice = DonutInsightSlice & { status: string };

export function StatusBreakdownPanel({
  datasets,
  isLoading,
  revealSignature,
}: StatusBreakdownPanelProps) {
  const [activeKey, setActiveKey] = React.useState(datasets[0]?.key ?? "");
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const reducedMotion = prefersReducedMotion();
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const width = useContainerWidth(bodyRef);
  const sideBySide = width === 0 || width >= 400;
  const pieSize =
    width > 0 && width < 360 ? 152 : width > 0 && width < 480 ? 172 : 196;
  const innerRadius = Math.round(pieSize * 0.31);

  const active =
    datasets.find((dataset) => dataset.key === activeKey) ?? datasets[0];

  React.useEffect(() => {
    setHoveredIndex(null);
  }, [activeKey, revealSignature]);

  if (!active) return null;

  const rows = statusCountsToChartData(active.items, active.kind);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const slices: StatusSlice[] = rows
    .filter((row) => row.value > 0)
    .map((row) => ({
      key: row.status,
      status: row.status,
      label: row.name,
      value: row.value,
      color: statusFill(row.status, active.kind),
      share: total > 0 ? (row.value / total) * 100 : 0,
    }));

  const pieData = slices.map((slice) => ({
    label: slice.label,
    value: slice.value,
    color: slice.color,
  }));

  const unitLabel = active.kind === "enrollment" ? "đăng ký" : "lớp";
  const attentionItems =
    active.kind === "enrollment"
      ? enrollmentStatusAttention(slices)
      : classStatusAttention(slices);

  return (
    <DashboardPanel className="flex h-full min-w-0 flex-col">
      <div className="flex flex-col gap-2 @min-[420px]/dash:flex-row @min-[420px]/dash:items-start @min-[420px]/dash:justify-between">
        <DashboardSectionTitle
          title={active.title}
          description={active.description}
        />
        {datasets.length > 1 ? (
          <div
            role="group"
            aria-label="Chọn phân bổ trạng thái"
            className="grid w-full shrink-0 grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1 @min-[420px]/dash:w-auto"
          >
            {datasets.map((dataset) => {
              const selected = dataset.key === active.key;
              return (
                <button
                  key={dataset.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveKey(dataset.key)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-center text-[11px] font-semibold transition-colors",
                    selected
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {dataset.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div ref={bodyRef} className="mt-3 min-w-0 flex-1">
        {slices.length === 0 && !isLoading ? (
          <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            Chưa có dữ liệu phân bổ
          </div>
        ) : (
          <div
            key={`${revealSignature}-${active.key}`}
            className={cn(
              "flex gap-4",
              sideBySide
                ? "flex-row items-start gap-4 sm:gap-5"
                : "flex-col items-center",
            )}
          >
            <div
              className="flex shrink-0 flex-col gap-2.5"
              style={{ width: pieSize }}
            >
              <div
                className="aspect-square w-full"
                style={{ height: pieSize }}
              >
                <PieChart
                  data={pieData}
                  size={pieSize}
                  innerRadius={innerRadius}
                  padAngle={0.035}
                  cornerRadius={4}
                  hoveredIndex={hoveredIndex}
                  onHoverChange={setHoveredIndex}
                  className="h-full w-full"
                >
                  {pieData.map((_, index) => (
                    <PieSlice
                      key={slices[index]?.status ?? index}
                      index={index}
                      animate={!reducedMotion}
                      hoverEffect={reducedMotion ? "none" : "translate"}
                      hoverOffset={width > 0 && width < 400 ? 4 : 6}
                      showGlow={!reducedMotion}
                    />
                  ))}
                  <PieCenter
                    defaultLabel={`Tổng ${unitLabel}`}
                    formatOptions={{ maximumFractionDigits: 0 }}
                  >
                    {() => {
                      const slice =
                        hoveredIndex !== null ? slices[hoveredIndex] : undefined;
                      if (!slice) return null;
                      return (
                        <div className="flex flex-col items-center justify-center text-center">
                          <p className="font-heading text-xl font-black tabular-nums tracking-tight text-foreground">
                            {formatCount(slice.value)}
                          </p>
                          <p className="mt-0.5 max-w-[7.5rem] truncate text-[10px] font-medium text-muted-foreground">
                            {slice.label}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold tabular-nums text-foreground">
                            {slice.share.toFixed(0)}%
                          </p>
                        </div>
                      );
                    }}
                  </PieCenter>
                </PieChart>
              </div>

              <DonutStackBar slices={slices} />
              <DonutDominantLine slices={slices} />
              <DonutAttentionChips items={attentionItems} />
            </div>

            <div className="w-full min-w-0 flex-1 space-y-2">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCount(total)}
                </span>{" "}
                {unitLabel}
              </p>

              <ul className="max-h-[200px] space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
                {slices.map((slice, index) => {
                  const isHovered = hoveredIndex === index;
                  const isFaded =
                    hoveredIndex !== null && hoveredIndex !== index;
                  return (
                    <li key={slice.status}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-opacity duration-150",
                          isHovered && "bg-secondary",
                          isFaded && "opacity-40",
                        )}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onFocus={() => setHoveredIndex(index)}
                        onBlur={() => setHoveredIndex(null)}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: slice.color }}
                            aria-hidden
                          />
                          <span className="truncate text-xs font-medium text-foreground">
                            {slice.label}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {formatCount(slice.value)}
                          <span className="ml-1.5 text-[10px] font-semibold text-foreground">
                            {slice.share.toFixed(0)}%
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>

      <Link
        href={active.href}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-steam-mathematics hover:underline"
      >
        {active.linkLabel}
        <ArrowUpRight className="size-3.5" />
      </Link>
    </DashboardPanel>
  );
}
