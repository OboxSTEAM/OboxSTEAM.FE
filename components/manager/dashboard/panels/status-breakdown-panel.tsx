"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { ChartTooltip } from "@/components/charts/tooltip";
import { Grid } from "@/components/charts/grid";
import { YAxis } from "@/components/charts/y-axis";
import type { StatusCount } from "@/lib/api";
import { cn } from "@/lib/utils";

import {
  axisFormatterFor,
  STEAM_FILL,
  statusCountsToChartData,
} from "../chart-data";
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
  fill?: string;
};

type StatusBreakdownPanelProps = {
  datasets: StatusDataset[];
  isLoading?: boolean;
  revealSignature: string;
};

export function StatusBreakdownPanel({
  datasets,
  isLoading,
  revealSignature,
}: StatusBreakdownPanelProps) {
  const [activeKey, setActiveKey] = React.useState(datasets[0]?.key ?? "");
  const reducedMotion = prefersReducedMotion();

  const active =
    datasets.find((dataset) => dataset.key === activeKey) ?? datasets[0];

  if (!active) return null;

  const data = statusCountsToChartData(active.items, active.kind);
  const formatAxis = axisFormatterFor("Count");
  const fill = active.fill ?? STEAM_FILL.mathematics;

  return (
    <DashboardPanel className="h-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <DashboardSectionTitle
          title={active.title}
          description={active.description}
        />
        {datasets.length > 1 ? (
          <div
            role="group"
            aria-label="Chọn phân bổ trạng thái"
            className="grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1"
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

      <div className="mt-3 h-[220px]">
        <BarChart
          data={data}
          xDataKey="name"
          status={isLoading ? "loading" : "ready"}
          revealSignature={`${revealSignature}-${active.kind}`}
          animationDuration={reducedMotion ? 0 : 1100}
          aspectRatio="auto"
          className="h-full"
          barGap={0.45}
          margin={{ top: 8, right: 12, bottom: 28, left: 40 }}
        >
          <Grid horizontal hideHorizontalEdgeLines numTicksRows={3} />
          <Bar dataKey="value" fill={fill} lineCap="round" />
          <YAxis formatValue={formatAxis} numTicks={3} />
          <BarXAxis />
          <ChartTooltip
            content={({ point }) => (
              <div className="rounded-lg bg-popover px-3 py-2 text-popover-foreground shadow-md">
                <p className="text-[11px] text-muted-foreground">
                  {String(point.name ?? "—")}
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">
                  {formatCount(Number(point.value ?? 0))}
                </p>
              </div>
            )}
          />
        </BarChart>
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
