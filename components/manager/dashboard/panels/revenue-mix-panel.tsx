"use client";

import { Wallet } from "lucide-react";

import { Ring } from "@/components/charts/ring";
import { RingCenter } from "@/components/charts/ring-center";
import { RingChart } from "@/components/charts/ring-chart";
import {
  Legend,
  LegendItem,
  LegendLabel,
  LegendMarker,
  LegendValue,
} from "@/components/charts/legend";
import type { RevenueOverview } from "@/lib/api";

import {
  CHART_SERIES_COLORS,
  gatewayLabel,
} from "../chart-data";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import { formatCount, formatMoney, prefersReducedMotion } from "../dashboard-utils";

type RevenueMixPanelProps = {
  revenue: RevenueOverview;
  isLoading?: boolean;
};

export function RevenueMixPanel({ revenue, isLoading }: RevenueMixPanelProps) {
  const reducedMotion = prefersReducedMotion();
  const gateways = revenue.revenueByGateway;
  const total = Math.max(
    revenue.revenueInRange,
    gateways.reduce((sum, g) => sum + g.amount, 0),
    1,
  );

  const ringData = gateways.map((g, index) => ({
    label: gatewayLabel(g.gateway),
    value: g.amount,
    maxValue: total,
    color: CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length],
  }));

  const legendItems = ringData.map((item) => ({
    label: item.label,
    value: item.value,
    maxValue: item.maxValue,
    color: item.color ?? CHART_SERIES_COLORS[0],
  }));

  if (isLoading) {
    return (
      <DashboardPanel>
        <DashboardSectionTitle
          title="Doanh thu kỳ"
          description="Phân bổ theo cổng thanh toán"
        />
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="size-36 animate-pulse rounded-full bg-border/70" />
          <div className="h-20 w-full animate-pulse rounded-xl bg-border/70" />
        </div>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel>
      <div className="mb-2 flex items-center gap-2">
        <Wallet className="size-4 text-steam-technology" />
        <DashboardSectionTitle
          title="Doanh thu kỳ"
          description="Phân bổ theo cổng thanh toán"
        />
      </div>

      <p className="font-heading text-xl font-black tabular-nums text-steam-technology">
        {formatMoney(revenue.revenueInRange)}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Tổng tích lũy {formatMoney(revenue.totalRevenue)} ·{" "}
        {formatCount(revenue.invoiceCount)} hóa đơn
      </p>

      {ringData.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Chưa có dữ liệu cổng thanh toán
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-center">
          <RingChart
            data={ringData}
            strokeWidth={11}
            ringGap={5}
            baseInnerRadius={40}
            className="mx-auto max-w-[180px]"
            enterTransition={
              reducedMotion ? { duration: 0 } : undefined
            }
          >
            {ringData.map((_, index) => (
              <Ring key={index} index={index} />
            ))}
            <RingCenter
              defaultLabel="Trong kỳ"
              formatOptions={{
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
                notation: "compact",
              }}
            />
          </RingChart>

          <Legend items={legendItems} className="gap-0.5">
            <LegendItem className="flex items-center gap-2 px-1 py-0.5">
              <LegendMarker />
              <LegendLabel className="min-w-0 flex-1 truncate text-xs font-medium" />
              <LegendValue
                className="text-xs tabular-nums"
                formatValue={formatMoney}
                showPercentage
              />
            </LegendItem>
          </Legend>
        </div>
      )}

      <dl className="mt-3 space-y-1.5 border-t border-border/70 pt-3 text-[11px]">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Giá trị đơn TB</dt>
          <dd className="font-mono font-medium text-foreground">
            {formatMoney(revenue.averageOrderValue)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Yêu cầu thanh toán đang chờ</dt>
          <dd className="font-mono font-medium text-foreground">
            {formatCount(revenue.pendingPaymentRequestsCount)}
          </dd>
        </div>
      </dl>
    </DashboardPanel>
  );
}
