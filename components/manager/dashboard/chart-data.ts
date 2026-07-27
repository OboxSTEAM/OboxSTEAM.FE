import type {
  StatusCount,
  TrendSeries,
  TrendValueKind,
} from "@/lib/api";
import { parseApiDateTime } from "@/lib/api/datetime";
import type { ClassStatus } from "@/lib/api/entities/class";
import { CLASS_STATUS_LABELS } from "@/lib/classes/constants";

import { formatCount, formatMoney } from "./dashboard-utils";

export type ChartPoint = {
  date: Date;
  value: number;
  label: string | null;
};

const CLASS_STATUS_ORDER: ClassStatus[] = [
  "Draft",
  "Open",
  "InProgress",
  "Completed",
  "Cancelled",
];

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ nộp",
  TurnedIn: "Đã nộp",
  Graded: "Đã chấm",
  ReturnedForRevision: "Trả lại sửa",
};

const SUBMISSION_STATUS_ORDER = [
  "Pending",
  "TurnedIn",
  "Graded",
  "ReturnedForRevision",
] as const;

export const PAYMENT_GATEWAY_VI: Record<string, string> = {
  VnPay: "VNPay",
  Stripe: "Stripe",
  BankTransfer: "Chuyển khoản",
};

export const CHART_SERIES_COLORS = [
  "var(--chart-series-1)",
  "var(--chart-series-2)",
  "var(--chart-series-3)",
  "var(--chart-series-4)",
  "var(--chart-series-5)",
] as const;

/** Default STEAM science red — prefer domain-specific series vars in panels. */
export const CHART_ACCENT = "var(--chart-series-1)";

export const STEAM_FILL = {
  science: "var(--chart-series-1)",
  technology: "var(--chart-series-2)",
  engineering: "var(--chart-series-3)",
  arts: "var(--chart-series-4)",
  mathematics: "var(--chart-series-5)",
} as const;

/** Map TrendSeriesDto points to bklit time-series rows. */
export function trendSeriesToChartData(series: TrendSeries): ChartPoint[] {
  const rows: ChartPoint[] = [];
  for (const point of series.points) {
    const date = parseApiDateTime(point.bucketStart);
    if (!date) continue;
    rows.push({
      date,
      value: point.value,
      label: point.label,
    });
  }
  return rows;
}

export function formatterFor(
  valueKind: TrendValueKind,
): (value: number) => string {
  switch (valueKind) {
    case "Currency":
      return formatMoney;
    case "Percent":
      return (value) => `${value.toFixed(1)}%`;
    case "Count":
    default:
      return formatCount;
  }
}

const compactNumberFormatter = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const compactCurrencyFormatter = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 1,
});

/** Short axis ticks — keeps left margin tight vs full tooltip formatters. */
export function axisFormatterFor(
  valueKind: TrendValueKind,
): (value: number) => string {
  switch (valueKind) {
    case "Currency":
      return (value) => compactCurrencyFormatter.format(value);
    case "Percent":
      return (value) => `${value.toFixed(0)}%`;
    case "Count":
    default:
      return (value) => compactNumberFormatter.format(value);
  }
}

/** Trust API `rateUnit` — rates are already 0–100 when unit is percent. */
export function toPercentValue(
  value: number,
  rateUnit: string | null | undefined,
): number {
  if (rateUnit === "percent" || rateUnit === "Percent") {
    return value;
  }
  if (rateUnit === "ratio" || rateUnit === "Ratio") {
    return value * 100;
  }
  // Fallback: values already on 0–100 stay as-is when > 1.
  return value <= 1 ? value * 100 : value;
}

/** Period-over-period change for KPI chips. */
export function deltaPercent(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function gatewayLabel(gateway: string): string {
  return PAYMENT_GATEWAY_VI[gateway] ?? gateway;
}

export function classStatusLabel(status: string): string {
  return CLASS_STATUS_LABELS[status as ClassStatus] ?? status;
}

export function submissionStatusLabel(status: string): string {
  return SUBMISSION_STATUS_LABELS[status] ?? status;
}

export type StatusChartRow = {
  name: string;
  status: string;
  value: number;
};

/** Stable order + Vietnamese labels; zero-fills known statuses when omitted. */
export function statusCountsToChartData(
  items: StatusCount[],
  kind: "class" | "submission" = "class",
): StatusChartRow[] {
  const order =
    kind === "submission" ? [...SUBMISSION_STATUS_ORDER] : CLASS_STATUS_ORDER;
  const labelFn =
    kind === "submission" ? submissionStatusLabel : classStatusLabel;
  const byStatus = new Map(
    items
      .filter((item) => item.status != null)
      .map((item) => [item.status as string, item.count]),
  );

  return order.map((status) => ({
    name: labelFn(status),
    status,
    value: byStatus.get(status) ?? 0,
  }));
}

/** Sum Open + InProgress — mirrors GetOverviewAsync activeClassCount. */
export function deriveActiveClassCount(items: StatusCount[]): number {
  return items.reduce((sum, item) => {
    if (item.status === "Open" || item.status === "InProgress") {
      return sum + item.count;
    }
    return sum;
  }, 0);
}
