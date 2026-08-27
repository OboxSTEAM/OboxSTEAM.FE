"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PieCenter } from "@/components/charts/pie-center";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import {
  Legend,
  LegendItem,
  LegendLabel,
  LegendMarker,
  LegendValue,
} from "@/components/charts/legend";
import type { RevenueOverview } from "@/lib/api";
import { cn } from "@/lib/utils";

import { gatewayFill, gatewayLabel } from "../chart-data";
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
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const data = revenue.revenueByGateway
    .filter((item) => item.amount > 0)
    .map((item) => ({
      label: gatewayLabel(item.gateway),
      value: item.amount,
      color: gatewayFill(item.gateway),
    }));

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const legendItems = data.map((item) => ({
    label: item.label,
    value: item.value,
    maxValue: total > 0 ? total : undefined,
    color: item.color,
  }));

  return (
    <DashboardPanel className="h-full">
      <DashboardSectionTitle
        title="Tỷ trọng kênh thanh toán"
        description="Doanh thu theo cổng thanh toán trong kỳ"
      />

      <div className="mt-3 min-h-[220px]">
        {data.length === 0 && !isLoading ? (
          <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            Chưa có giao dịch trong kỳ
          </div>
        ) : (
          <div
            key={revealSignature}
            className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5"
          >
            <div className="aspect-square w-[180px] shrink-0 sm:w-[200px]">
              <PieChart
                data={data}
                innerRadius={58}
                padAngle={0.04}
                cornerRadius={4}
                hoveredIndex={hoveredIndex}
                onHoverChange={setHoveredIndex}
                className="h-full w-full"
              >
                {data.map((_, index) => (
                  <PieSlice
                    key={data[index]?.label ?? index}
                    index={index}
                    animate={!reducedMotion}
                    hoverEffect={reducedMotion ? "none" : "translate"}
                    hoverOffset={6}
                    showGlow={!reducedMotion}
                  />
                ))}
                <PieCenter
                  defaultLabel="Tổng"
                  formatOptions={{
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                    notation: "compact",
                  }}
                />
              </PieChart>
            </div>

            <Legend
              items={legendItems}
              hoveredIndex={hoveredIndex}
              onHoverChange={setHoveredIndex}
              className="w-full min-w-0 flex-1"
            >
              <LegendItem className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <LegendMarker className="size-2.5" />
                  <LegendLabel className="truncate text-xs font-medium" />
                </span>
                <LegendValue
                  className="shrink-0 text-xs tabular-nums"
                  showPercentage
                  percentageClassName="text-[10px] text-muted-foreground"
                  formatValue={formatMoney}
                  formatPercentage={(p) => `${p.toFixed(0)}%`}
                />
              </LegendItem>
            </Legend>
          </div>
        )}
      </div>

      <Link
        href="/manager/programs"
        className={cn(
          "mt-3 inline-flex items-center gap-1 text-xs font-semibold text-steam-technology hover:underline",
        )}
      >
        Chương trình và thanh toán
        <ArrowUpRight className="size-3.5" />
      </Link>
    </DashboardPanel>
  );
}
