"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { ChartTooltip } from "@/components/charts/tooltip";
import { Grid } from "@/components/charts/grid";
import { YAxis } from "@/components/charts/y-axis";
import type { RevenueOverview } from "@/lib/api";

import { gatewayLabel, STEAM_FILL } from "../chart-data";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import { formatMoney, prefersReducedMotion } from "../dashboard-utils";

type RevenueMixPanelProps = {
  revenue: RevenueOverview;
  isLoading?: boolean;
  revealSignature: string;
};

export function RevenueMixPanel({
  revenue,
  isLoading,
  revealSignature,
}: RevenueMixPanelProps) {
  const reducedMotion = prefersReducedMotion();
  const total = revenue.revenueByGateway.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const data = revenue.revenueByGateway.map((item) => ({
    name: gatewayLabel(item.gateway),
    value: total > 0 ? (item.amount / total) * 100 : 0,
    amount: item.amount,
  }));
  const formatAxis = (value: number) => `${value.toFixed(0)}%`;

  return (
    <DashboardPanel>
      <DashboardSectionTitle
        title="Tỷ trọng kênh thanh toán"
        description="Phần trăm doanh thu theo cổng, không lặp số tiền KPI"
      />

      <div className="mt-3 h-[220px]">
        {data.length === 0 && !isLoading ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            Chưa có giao dịch trong kỳ
          </div>
        ) : (
          <BarChart
            data={data}
            xDataKey="name"
            status={isLoading ? "loading" : "ready"}
            revealSignature={`${revealSignature}-gateway`}
            animationDuration={reducedMotion ? 0 : 1100}
            aspectRatio="auto"
            className="h-full"
            barGap={0.45}
            margin={{ top: 8, right: 12, bottom: 28, left: 40 }}
          >
            <Grid horizontal hideHorizontalEdgeLines numTicksRows={3} />
            <Bar dataKey="value" fill={STEAM_FILL.technology} lineCap="round" />
            <YAxis formatValue={formatAxis} numTicks={3} />
            <BarXAxis />
            <ChartTooltip
              content={({ point }) => (
                <div className="rounded-lg bg-popover px-3 py-2 text-popover-foreground shadow-md">
                  <p className="text-[11px] text-muted-foreground">
                    {String(point.name ?? "—")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">
                    {Number(point.value ?? 0).toFixed(1)}%
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {formatMoney(Number(point.amount ?? 0))}
                    </span>
                  </p>
                </div>
              )}
            />
          </BarChart>
        )}
      </div>

      <Link
        href="/manager/programs"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-steam-technology hover:underline"
      >
        Chương trình và thanh toán
        <ArrowUpRight className="size-3.5" />
      </Link>
    </DashboardPanel>
  );
}
