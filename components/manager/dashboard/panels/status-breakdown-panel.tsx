"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { ChartTooltip } from "@/components/charts/tooltip";
import { Grid } from "@/components/charts/grid";
import { YAxis } from "@/components/charts/y-axis";
import type { StatusCount } from "@/lib/api";

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

type StatusBreakdownPanelProps = {
  title: string;
  description: string;
  items: StatusCount[];
  kind: StatusBreakdownKind;
  href: string;
  linkLabel: string;
  fill?: string;
  isLoading?: boolean;
  revealSignature: string;
};

export function StatusBreakdownPanel({
  title,
  description,
  items,
  kind,
  href,
  linkLabel,
  fill = STEAM_FILL.mathematics,
  isLoading,
  revealSignature,
}: StatusBreakdownPanelProps) {
  const reducedMotion = prefersReducedMotion();
  const data = statusCountsToChartData(items, kind);
  const formatAxis = axisFormatterFor("Count");

  return (
    <DashboardPanel>
      <DashboardSectionTitle title={title} description={description} />

      <div className="mt-3 h-[220px]">
        <BarChart
          data={data}
          xDataKey="name"
          status={isLoading ? "loading" : "ready"}
          revealSignature={`${revealSignature}-${kind}`}
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
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-steam-mathematics hover:underline"
      >
        {linkLabel}
        <ArrowUpRight className="size-3.5" />
      </Link>
    </DashboardPanel>
  );
}
