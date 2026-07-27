"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Gauge } from "@/components/charts/gauge";
import type {
  AssessmentOverview,
  EnrollmentOverview,
  OperationsOverview,
} from "@/lib/api";

import { STEAM_FILL, toPercentValue } from "../chart-data";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import { formatCount, prefersReducedMotion } from "../dashboard-utils";

type OperationsHealthPanelProps = {
  enrollment: EnrollmentOverview;
  operations: OperationsOverview;
  assessment: AssessmentOverview;
  activeClassCount: number;
  isLoading?: boolean;
};

function GaugeCell({
  label,
  value,
  activeFill,
  reducedMotion,
}: {
  label: string;
  value: number;
  activeFill: string;
  reducedMotion: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="shrink-0 font-mono font-medium tabular-nums text-foreground">
          {clamped.toFixed(1)}%
        </span>
      </div>
      <Gauge
        orientation="linear"
        value={clamped}
        activeFill={activeFill}
        inactiveFill="var(--secondary)"
        linearHeight={12}
        totalNotches={24}
        minWidth={0}
        className="w-full"
        enterTransition={reducedMotion ? { duration: 0 } : undefined}
      />
    </div>
  );
}

export function OperationsHealthPanel({
  enrollment,
  operations,
  assessment,
  activeClassCount,
  isLoading,
}: OperationsHealthPanelProps) {
  const reducedMotion = prefersReducedMotion();

  if (isLoading) {
    return (
      <DashboardPanel className="h-full">
        <DashboardSectionTitle
          title="Sức khỏe vận hành"
          description="Hoàn thành · điểm danh · lấp đầy · đậu"
        />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-border/70" />
          ))}
        </div>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel className="h-full">
      <DashboardSectionTitle
        title="Sức khỏe vận hành"
        description="Hoàn thành · điểm danh · lấp đầy · đậu"
      />
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GaugeCell
          label="Hoàn thành"
          value={toPercentValue(
            enrollment.completionRate,
            enrollment.rateUnit,
          )}
          activeFill={STEAM_FILL.technology}
          reducedMotion={reducedMotion}
        />
        <GaugeCell
          label="Điểm danh"
          value={toPercentValue(
            operations.averageAttendanceRate,
            operations.rateUnit,
          )}
          activeFill={STEAM_FILL.arts}
          reducedMotion={reducedMotion}
        />
        <GaugeCell
          label="Lấp đầy"
          value={toPercentValue(
            operations.averageCapacityUtilization,
            operations.rateUnit,
          )}
          activeFill={STEAM_FILL.engineering}
          reducedMotion={reducedMotion}
        />
        <GaugeCell
          label="Đậu"
          value={toPercentValue(assessment.passRate, assessment.rateUnit)}
          activeFill={STEAM_FILL.mathematics}
          reducedMotion={reducedMotion}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
        <p>
          Lớp chạy{" "}
          <span className="font-mono font-semibold text-foreground">
            {formatCount(activeClassCount)}
          </span>
          {" · "}
          Mentor chờ{" "}
          <span className="font-mono font-semibold text-foreground">
            {formatCount(operations.pendingMentorRequestsCount)}
          </span>
        </p>
        <Link
          href="/manager/attendance"
          className="inline-flex items-center gap-1 font-semibold text-steam-engineering hover:underline"
        >
          Điểm danh
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </DashboardPanel>
  );
}
