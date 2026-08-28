"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { OperationsOverview } from "@/lib/api";
import { cn } from "@/lib/utils";

import { DashboardPanel, DashboardSectionTitle } from "../dashboard-panel";
import { formatCount } from "../dashboard-utils";

type MentorLoadPanelProps = {
  operations: OperationsOverview;
};

type MentorRow = {
  mentorId: string;
  name: string;
  assigned: number;
  pending: number;
  max: number;
  utilization: number;
};

function loadTone(utilization: number): {
  bar: string;
  label: string;
} {
  if (utilization >= 0.9) {
    return { bar: "bg-steam-science", label: "text-steam-science" };
  }
  if (utilization >= 0.7) {
    return { bar: "bg-steam-arts", label: "text-steam-arts" };
  }
  return { bar: "bg-steam-engineering", label: "text-steam-engineering" };
}

export function MentorLoadPanel({ operations }: MentorLoadPanelProps) {
  const pagination = operations.mentorUtilization;

  const rows: MentorRow[] = React.useMemo(() => {
    return pagination.items
      .map((mentor) => {
        const max = mentor.max > 0 ? mentor.max : Math.max(mentor.assigned, 1);
        return {
          mentorId: mentor.mentorId,
          name: mentor.mentorName?.trim() || "Mentor",
          assigned: mentor.assigned,
          pending: mentor.pending,
          max,
          utilization: Math.min(1, mentor.assigned / max),
        };
      })
      .sort((a, b) => {
        if (b.utilization !== a.utilization) {
          return b.utilization - a.utilization;
        }
        return b.pending - a.pending;
      });
  }, [pagination.items]);

  const totalAssigned = rows.reduce((sum, row) => sum + row.assigned, 0);
  const pendingTotal = rows.reduce((sum, row) => sum + row.pending, 0);
  const nearCapacityCount = rows.filter((row) => row.utilization >= 0.9).length;
  const avgUtilization =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + row.utilization, 0) / rows.length
      : 0;
  const totalKnown = pagination.totalCount > 0 ? pagination.totalCount : rows.length;
  const hasMore = pagination.hasNext || totalKnown > rows.length;

  return (
    <DashboardPanel className="h-full">
      <DashboardSectionTitle
        title="Khối lượng giảng dạy của mentor"
        description="Xếp theo mức tải · ưu tiên mentor gần đầy và có yêu cầu chờ"
      />

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Chưa có dữ liệu tải mentor.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-semibold tabular-nums text-foreground">
              TB {(avgUtilization * 100).toFixed(0)}%
            </span>
            <span className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-semibold tabular-nums text-foreground">
              {formatCount(totalAssigned)} lớp
            </span>
            {nearCapacityCount > 0 ? (
              <span className="rounded-lg bg-steam-science/15 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-steam-science">
                {formatCount(nearCapacityCount)} gần đầy
              </span>
            ) : null}
            {pendingTotal > 0 ? (
              <span className="rounded-lg bg-steam-arts/15 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-steam-arts">
                {formatCount(pendingTotal)} chờ duyệt
              </span>
            ) : null}
          </div>

          <ul className="max-h-[200px] space-y-2 overflow-y-auto overscroll-contain pr-1 sm:max-h-[240px] lg:max-h-[280px]">
            {rows.map((row, index) => {
              const tone = loadTone(row.utilization);
              const ratio = Math.min(100, row.utilization * 100);
              return (
                <li key={row.mentorId} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <p className="min-w-0 truncate font-medium text-foreground">
                      <span className="mr-1.5 hidden font-mono text-[10px] tabular-nums text-muted-foreground @min-[320px]/dash:inline">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {row.name}
                    </p>
                    <p className="shrink-0 tabular-nums text-[11px] text-muted-foreground sm:text-xs">
                      {formatCount(row.assigned)}/{formatCount(row.max)}
                      <span className={cn("ml-1.5 font-semibold", tone.label)}>
                        {ratio.toFixed(0)}%
                      </span>
                      {row.pending > 0 ? (
                        <span className="ml-1.5 font-semibold text-steam-arts">
                          · {formatCount(row.pending)}
                          <span className="hidden @min-[360px]/dash:inline"> chờ</span>
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-300",
                        tone.bar,
                      )}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {hasMore ? (
            <p className="text-[11px] text-muted-foreground">
              Đang hiện {formatCount(rows.length)} / {formatCount(totalKnown)}{" "}
              mentor
            </p>
          ) : null}
        </div>
      )}

      <Link
        href="/manager/experts"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-steam-engineering hover:underline"
      >
        Duyệt mentor
        <ArrowUpRight className="size-3.5" />
      </Link>
    </DashboardPanel>
  );
}
