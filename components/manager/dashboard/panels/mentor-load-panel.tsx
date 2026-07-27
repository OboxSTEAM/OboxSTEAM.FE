"use client";

import Link from "next/link";
import { ArrowUpRight, UserCheck } from "lucide-react";

import {
  Legend,
  LegendItem,
  LegendLabel,
  LegendMarker,
  LegendProgress,
  LegendValue,
} from "@/components/charts/legend";
import type { OperationsOverview } from "@/lib/api";

import { CHART_SERIES_COLORS } from "../chart-data";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import { formatCount } from "../dashboard-utils";

type MentorLoadPanelProps = {
  operations: OperationsOverview;
  isLoading?: boolean;
};

export function MentorLoadPanel({
  operations,
  isLoading,
}: MentorLoadPanelProps) {
  const mentors = operations.mentorUtilization.items;
  const items = mentors.map((mentor, index) => ({
    label: mentor.mentorName ?? "Mentor",
    value: mentor.assigned,
    maxValue: Math.max(mentor.max, 1),
    color: CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length],
    pending: mentor.pending,
  }));

  if (isLoading) {
    return (
      <DashboardPanel>
        <DashboardSectionTitle
          title="Tải mentor"
          description="Đã nhận / giới hạn lớp"
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-border/70" />
          ))}
        </div>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel>
      <div className="mb-3 flex items-center gap-2">
        <UserCheck className="size-4 text-steam-mathematics" />
        <DashboardSectionTitle
          title="Tải mentor"
          description="Đã nhận / giới hạn lớp"
        />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
      ) : (
        <Legend
          items={items}
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          <LegendItem className="space-y-1 px-1 py-1">
            <div className="flex items-center gap-2">
              <LegendMarker />
              <LegendLabel className="min-w-0 flex-1 truncate text-xs font-medium" />
              <LegendValue
                className="text-xs tabular-nums"
                formatValue={(value) => formatCount(value)}
              />
            </div>
            <LegendProgress height="h-1.5" />
          </LegendItem>
        </Legend>
      )}

      {mentors.some((m) => m.pending > 0) ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Có mentor đang có yêu cầu chờ trong tải lớp.
        </p>
      ) : null}

      <Link
        href="/manager/classes"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-steam-mathematics hover:underline"
      >
        Quản lý lớp học
        <ArrowUpRight className="size-3.5" />
      </Link>
    </DashboardPanel>
  );
}
