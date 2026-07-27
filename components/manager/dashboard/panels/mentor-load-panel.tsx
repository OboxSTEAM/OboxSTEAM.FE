"use client";

import Link from "next/link";
import { ArrowUpRight, UserCheck } from "lucide-react";

import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { ChartTooltip } from "@/components/charts/tooltip";
import { Grid } from "@/components/charts/grid";
import type { OperationsOverview } from "@/lib/api";

import { STEAM_FILL } from "../chart-data";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import { formatCount, formatRate, prefersReducedMotion } from "../dashboard-utils";

type MentorLoadPanelProps = {
  operations: OperationsOverview;
  isLoading?: boolean;
  revealSignature?: string;
};

type MentorRow = {
  name: string;
  assigned: number;
  remaining: number;
  pending: number;
  max: number;
  utilization: number;
};

function buildMentorRows(
  items: OperationsOverview["mentorUtilization"]["items"],
): MentorRow[] {
  return items
    .map((mentor) => {
      const max = Math.max(mentor.max, 0);
      const assigned = Math.max(mentor.assigned, 0);
      const remaining = Math.max(max - assigned, 0);
      const utilization = max > 0 ? (assigned / max) * 100 : assigned > 0 ? 100 : 0;
      return {
        name: mentor.mentorName ?? "Mentor",
        assigned,
        remaining,
        pending: Math.max(mentor.pending, 0),
        max: Math.max(max, assigned),
        utilization,
      };
    })
    .sort((a, b) => b.utilization - a.utilization || b.pending - a.pending);
}

export function MentorLoadPanel({
  operations,
  isLoading,
  revealSignature = "mentor",
}: MentorLoadPanelProps) {
  const reducedMotion = prefersReducedMotion();
  const mentors = operations.mentorUtilization.items;
  const rows = buildMentorRows(mentors);

  const totalAssigned = rows.reduce((sum, row) => sum + row.assigned, 0);
  const totalCapacity = rows.reduce((sum, row) => sum + row.max, 0);
  const totalPending = rows.reduce((sum, row) => sum + row.pending, 0);
  const overloaded = rows.filter((row) => row.assigned >= row.max && row.max > 0).length;
  const avgUtilization =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + row.utilization, 0) / rows.length
      : 0;

  const chartHeight = Math.min(320, Math.max(160, rows.length * 44 + 24));

  if (isLoading) {
    return (
      <DashboardPanel>
        <DashboardSectionTitle
          title="Tải mentor"
          description="Đã nhận so với giới hạn lớp · yêu cầu chờ"
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-border/70" />
          ))}
        </div>
        <div className="mt-3 h-[200px] animate-pulse rounded-xl bg-border/70" />
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel>
      <div className="mb-3 flex items-center gap-2">
        <UserCheck className="size-4 text-steam-mathematics" />
        <DashboardSectionTitle
          title="Tải mentor"
          description="Đã nhận so với giới hạn lớp · yêu cầu chờ"
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu mentor</p>
      ) : (
        <>
          <dl className="mb-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
            <div className="rounded-xl bg-steam-mathematics/8 px-2.5 py-1.5">
              <dt className="text-muted-foreground">Mentor</dt>
              <dd className="mt-0.5 font-heading text-base font-bold tabular-nums text-foreground">
                {formatCount(rows.length)}
              </dd>
            </div>
            <div className="rounded-xl bg-background px-2.5 py-1.5">
              <dt className="text-muted-foreground">Lấp đầy TB</dt>
              <dd className="mt-0.5 font-heading text-base font-bold tabular-nums text-steam-mathematics">
                {formatRate(avgUtilization)}
              </dd>
            </div>
            <div className="rounded-xl bg-background px-2.5 py-1.5">
              <dt className="text-muted-foreground">Đã nhận / max</dt>
              <dd className="mt-0.5 font-heading text-base font-bold tabular-nums text-foreground">
                {formatCount(totalAssigned)}/{formatCount(totalCapacity)}
              </dd>
            </div>
            <div className="rounded-xl bg-background px-2.5 py-1.5">
              <dt className="text-muted-foreground">Chờ duyệt</dt>
              <dd
                className={
                  totalPending > 0
                    ? "mt-0.5 font-heading text-base font-bold tabular-nums text-steam-science"
                    : "mt-0.5 font-heading text-base font-bold tabular-nums text-foreground"
                }
              >
                {formatCount(totalPending)}
              </dd>
            </div>
          </dl>

          <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2 rounded-sm"
                style={{ background: STEAM_FILL.mathematics }}
              />
              Đã nhận
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-secondary" />
              Còn trống
            </span>
            {overloaded > 0 ? (
              <span className="font-medium text-steam-science">
                {formatCount(overloaded)} mentor đầy / vượt giới hạn
              </span>
            ) : null}
          </div>

          <div style={{ height: chartHeight }}>
            <BarChart
              data={rows}
              xDataKey="name"
              orientation="horizontal"
              stacked
              stackGap={2}
              status="ready"
              revealSignature={`${revealSignature}-mentor`}
              animationDuration={reducedMotion ? 0 : 1100}
              aspectRatio="auto"
              className="h-full"
              barGap={0.35}
              margin={{ top: 4, right: 16, bottom: 4, left: 120 }}
            >
              <Grid horizontal={false} vertical />
              <Bar
                dataKey="assigned"
                fill={STEAM_FILL.mathematics}
                lineCap="round"
              />
              <Bar
                dataKey="remaining"
                fill="var(--secondary)"
                lineCap="round"
              />
              <BarYAxis />
              <ChartTooltip
                content={({ point }) => {
                  const assigned = Number(point.assigned ?? 0);
                  const remaining = Number(point.remaining ?? 0);
                  const pending = Number(point.pending ?? 0);
                  const max = Number(point.max ?? assigned + remaining);
                  const utilization = Number(point.utilization ?? 0);
                  return (
                    <div className="rounded-lg bg-popover px-3 py-2 text-popover-foreground shadow-md">
                      <p className="text-[11px] text-muted-foreground">
                        {String(point.name ?? "—")}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums">
                        {formatCount(assigned)}/{formatCount(max)} lớp ·{" "}
                        {formatRate(utilization)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Còn trống {formatCount(remaining)}
                        {pending > 0
                          ? ` · ${formatCount(pending)} yêu cầu chờ`
                          : ""}
                      </p>
                    </div>
                  );
                }}
              />
            </BarChart>
          </div>
        </>
      )}

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
