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
import { useContainerWidth } from "@/hooks/use-container-narrow";
import type { RevenueOverview } from "@/lib/api";
import { cn } from "@/lib/utils";

import { gatewayFill, gatewayLabel } from "../chart-data";
import {
  DonutAttentionChips,
  DonutDominantLine,
  DonutStackBar,
  type DonutAttentionItem,
  type DonutInsightSlice,
} from "../donut-insights";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import { formatCount, formatMoney, prefersReducedMotion } from "../dashboard-utils";

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
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const width = useContainerWidth(bodyRef);
  const sideBySide = width === 0 || width >= 400;
  const pieSize = width > 0 && width < 360 ? 152 : width > 0 && width < 480 ? 172 : 200;
  const innerRadius = Math.round(pieSize * 0.31);

  const data = revenue.revenueByGateway
    .filter((item) => item.amount > 0)
    .map((item) => ({
      label: gatewayLabel(item.gateway),
      value: item.amount,
      color: gatewayFill(item.gateway),
    }));

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const slices: DonutInsightSlice[] = data.map((item) => ({
    key: item.label,
    label: item.label,
    value: item.value,
    color: item.color,
    share: total > 0 ? (item.value / total) * 100 : 0,
  }));
  const legendItems = data.map((item) => ({
    label: item.label,
    value: item.value,
    maxValue: total > 0 ? total : undefined,
    color: item.color,
  }));

  const dominant = [...slices].sort((a, b) => b.value - a.value)[0];
  const mixAttention: DonutAttentionItem[] = [];
  if (dominant && dominant.share >= 50) {
    mixAttention.push({
      key: "dominant",
      label: `${dominant.label} dẫn đầu`,
      tone: "info" as const,
    });
  }
  if (revenue.invoiceCount > 0) {
    mixAttention.push({
      key: "invoices",
      label: `${formatCount(revenue.invoiceCount)} giao dịch`,
      tone: "neutral" as const,
    });
  }
  if (revenue.averageOrderValue > 0) {
    mixAttention.push({
      key: "aov",
      label: `TB ${formatMoney(revenue.averageOrderValue)}/đơn`,
      tone: "neutral" as const,
    });
  }

  return (
    <DashboardPanel className="flex h-full min-w-0 flex-col">
      <DashboardSectionTitle
        title="Tỷ trọng kênh thanh toán"
        description="Doanh thu theo cổng thanh toán trong kỳ"
      />

      <div ref={bodyRef} className="mt-3 min-h-0 min-w-0 flex-1">
        {data.length === 0 && !isLoading ? (
          <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground sm:h-[220px]">
            Chưa có giao dịch trong kỳ
          </div>
        ) : (
          <div
            key={revealSignature}
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
                  data={data}
                  size={pieSize}
                  innerRadius={innerRadius}
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
                      hoverOffset={width > 0 && width < 400 ? 4 : 6}
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

              <DonutStackBar slices={slices} />
              <DonutDominantLine slices={slices} />
              <DonutAttentionChips items={mixAttention.slice(0, 2)} />
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
