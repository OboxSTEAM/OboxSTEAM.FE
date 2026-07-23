import type { DashboardRange, TrendPoint } from "@/lib/api";

export const DASHBOARD_RANGE_OPTIONS: {
  value: DashboardRange;
  label: string;
  short: string;
}[] = [
  { value: "Last7Days", label: "7 ngày", short: "7D" },
  { value: "Last30Days", label: "30 ngày", short: "30D" },
  { value: "Last90Days", label: "90 ngày", short: "90D" },
  { value: "Last12Months", label: "12 tháng", short: "12M" },
];

const numberFormatter = new Intl.NumberFormat("vi-VN");
const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatCount(value: number): string {
  return numberFormatter.format(value);
}

export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

/** Backend may return ratio (0–1) or percent (0–100). */
export function toPercent(value: number): number {
  return value <= 1 ? value * 100 : value;
}

export function formatRate(value: number): string {
  return `${toPercent(value).toFixed(1)}%`;
}

export function trendChangePercent(points: TrendPoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0]?.value ?? 0;
  const last = points[points.length - 1]?.value ?? 0;
  if (first === 0) return last === 0 ? 0 : 100;
  return ((last - first) / Math.abs(first)) * 100;
}

export function greetingByHour(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function buildTrendGeometry(points: TrendPoint[]) {
  const width = 600;
  const height = 200;
  const padY = 20;

  if (points.length === 0) {
    return {
      line: "",
      area: "",
      circles: [] as { x: number; y: number; value: number; label: string | null }[],
    };
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = points.map((point, index) => {
    const x =
      points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - padY - ((point.value - min) / span) * (height - padY * 2);
    return { x, y, value: point.value, label: point.label };
  });

  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return { line, area, circles: coords, min, max };
}

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  status: string;
  tone: "danger" | "warn" | "info" | "ok";
  priority: number;
};
