import type {
  StatusCount,
  TrendSeries,
  TrendValueKind,
} from "@/lib/api";
import { parseApiDateTime } from "@/lib/api/datetime";
import type { ClassStatus } from "@/lib/api/entities/class";
import type { ProgramEnrollmentStatus } from "@/lib/api/entities/program-enrollment";
import { CLASS_STATUS_LABELS } from "@/lib/classes/constants";
import { PROGRAM_ENROLLMENT_STATUS_LABELS } from "@/lib/programs/enrollments";

import { formatCount, formatMoney } from "./dashboard-utils";

export type ChartPoint = {
  date: Date;
  value: number;
  label: string | null;
};

const CLASS_STATUS_ORDER: ClassStatus[] = [
  "Draft",
  "ReadyForMentor",
  "Open",
  "InProgress",
  "Completed",
  "Cancelled",
];

const ENROLLMENT_STATUS_ORDER: ProgramEnrollmentStatus[] = [
  "PendingPayment",
  "Active",
  "Deferred",
  "Completed",
  "Failed",
  "Dropped",
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

/** Stable STEAM series colors per payment gateway for donut + legend. */
export const GATEWAY_FILL: Record<string, string> = {
  VnPay: STEAM_FILL.engineering,
  Stripe: STEAM_FILL.mathematics,
  BankTransfer: STEAM_FILL.technology,
};

export function gatewayFill(gateway: string): string {
  return GATEWAY_FILL[gateway] ?? STEAM_FILL.science;
}

/** Semantic fills for enrollment status composition (donut / legend). */
export const ENROLLMENT_STATUS_FILL: Record<string, string> = {
  PendingPayment: STEAM_FILL.arts,
  Active: STEAM_FILL.technology,
  Deferred: STEAM_FILL.engineering,
  Completed: STEAM_FILL.mathematics,
  Failed: STEAM_FILL.science,
  Dropped: "var(--chart-label)",
};

/** Semantic fills for class status composition (donut / legend). */
export const CLASS_STATUS_FILL: Record<string, string> = {
  Draft: "var(--chart-label)",
  ReadyForMentor: STEAM_FILL.arts,
  Open: STEAM_FILL.engineering,
  InProgress: STEAM_FILL.technology,
  Completed: STEAM_FILL.mathematics,
  Cancelled: STEAM_FILL.science,
};

export function statusFill(
  status: string,
  kind: "class" | "enrollment" | "submission" = "class",
): string {
  if (kind === "enrollment") {
    return ENROLLMENT_STATUS_FILL[status] ?? STEAM_FILL.science;
  }
  if (kind === "class") {
    return CLASS_STATUS_FILL[status] ?? STEAM_FILL.mathematics;
  }
  return STEAM_FILL.science;
}

/** Compact share line for the revenue KPI — replaces a dedicated mix chart. */
export function paymentMixFootnote(
  items: Array<{ gateway: string; amount: number }>,
): string | undefined {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  if (total <= 0) return undefined;
  const parts = items
    .filter((item) => item.amount > 0)
    .map(
      (item) =>
        `${gatewayLabel(item.gateway)} ${((item.amount / total) * 100).toFixed(0)}%`,
    );
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/** Compact enrollment-status line — replaces a dedicated status chart. */
export function enrollmentMixFootnote(items: StatusCount[]): string | undefined {
  const parts = statusCountsToChartData(items, "enrollment")
    .filter((row) => row.value > 0)
    .map((row) => `${row.name} ${formatCount(row.value)}`);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function classStatusLabel(status: string): string {
  return CLASS_STATUS_LABELS[status as ClassStatus] ?? status;
}

export function submissionStatusLabel(status: string): string {
  return SUBMISSION_STATUS_LABELS[status] ?? status;
}

export function enrollmentStatusLabel(status: string): string {
  return (
    PROGRAM_ENROLLMENT_STATUS_LABELS[status as ProgramEnrollmentStatus] ??
    status
  );
}

export type StatusChartRow = {
  name: string;
  status: string;
  value: number;
};

/** Stable order + Vietnamese labels; zero-fills known statuses when omitted. */
export function statusCountsToChartData(
  items: StatusCount[],
  kind: "class" | "submission" | "enrollment" = "class",
): StatusChartRow[] {
  const order =
    kind === "submission"
      ? [...SUBMISSION_STATUS_ORDER]
      : kind === "enrollment"
        ? [...ENROLLMENT_STATUS_ORDER]
        : CLASS_STATUS_ORDER;
  const labelFn =
    kind === "submission"
      ? submissionStatusLabel
      : kind === "enrollment"
        ? enrollmentStatusLabel
        : classStatusLabel;
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
