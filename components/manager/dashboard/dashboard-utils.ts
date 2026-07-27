import type { DashboardRange } from "@/lib/api";

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

export function formatRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function greetingByHour(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
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

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
