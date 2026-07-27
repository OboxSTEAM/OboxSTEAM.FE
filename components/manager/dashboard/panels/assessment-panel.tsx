"use client";

import { ClipboardList } from "lucide-react";

import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { ChartTooltip } from "@/components/charts/tooltip";
import { Grid } from "@/components/charts/grid";
import { YAxis } from "@/components/charts/y-axis";
import type { AssessmentOverview } from "@/lib/api";

import {
  axisFormatterFor,
  STEAM_FILL,
  statusCountsToChartData,
  toPercentValue,
} from "../chart-data";
import {
  DashboardPanel,
  DashboardSectionTitle,
} from "../dashboard-panel";
import {
  formatCount,
  formatRate,
  prefersReducedMotion,
} from "../dashboard-utils";

type AssessmentPanelProps = {
  assessment: AssessmentOverview;
  isLoading?: boolean;
  revealSignature: string;
};

export function AssessmentPanel({
  assessment,
  isLoading,
  revealSignature,
}: AssessmentPanelProps) {
  const reducedMotion = prefersReducedMotion();
  const data = statusCountsToChartData(
    assessment.submissionsByStatus,
    "submission",
  );
  const passRate = toPercentValue(assessment.passRate, assessment.rateUnit);
  const formatAxis = axisFormatterFor("Count");

  return (
    <DashboardPanel>
      <div className="mb-2 flex items-center gap-2">
        <ClipboardList className="size-4 text-steam-engineering" />
        <DashboardSectionTitle
          title="Đánh giá & chấm bài"
          description="Trạng thái bài nộp và chất lượng trong kỳ"
        />
      </div>

      <dl className="mb-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        <div className="rounded-xl bg-steam-engineering/8 px-2.5 py-1.5">
          <dt className="text-muted-foreground">Bài nộp kỳ</dt>
          <dd className="mt-0.5 font-heading text-base font-bold tabular-nums text-foreground">
            {formatCount(assessment.submissionsInRange)}
          </dd>
        </div>
        <div className="rounded-xl bg-background px-2.5 py-1.5">
          <dt className="text-muted-foreground">Điểm TB</dt>
          <dd className="mt-0.5 font-heading text-base font-bold tabular-nums text-foreground">
            {assessment.averageScore.toFixed(1)}
          </dd>
        </div>
        <div className="rounded-xl bg-background px-2.5 py-1.5">
          <dt className="text-muted-foreground">Tỷ lệ đậu</dt>
          <dd className="mt-0.5 font-heading text-base font-bold tabular-nums text-foreground">
            {formatRate(passRate)}
          </dd>
        </div>
        <div className="rounded-xl bg-background px-2.5 py-1.5">
          <dt className="text-muted-foreground">Turnaround</dt>
          <dd className="mt-0.5 font-heading text-base font-bold tabular-nums text-foreground">
            {assessment.averageGradingTurnaroundHours.toFixed(1)}h
          </dd>
        </div>
      </dl>

      <div className="h-[220px]">
        <BarChart
          data={data}
          xDataKey="name"
          status={isLoading ? "loading" : "ready"}
          revealSignature={`${revealSignature}-assessment`}
          animationDuration={reducedMotion ? 0 : 1100}
          aspectRatio="auto"
          className="h-full"
          barGap={0.45}
          margin={{ top: 8, right: 12, bottom: 28, left: 40 }}
        >
          <Grid horizontal hideHorizontalEdgeLines numTicksRows={3} />
          <Bar dataKey="value" fill={STEAM_FILL.engineering} lineCap="round" />
          <YAxis formatValue={formatAxis} numTicks={3} />
          <BarXAxis />
          <ChartTooltip
            content={({ point }) => (
              <div className="rounded-lg bg-popover px-3 py-2 text-popover-foreground shadow-md">
                <p className="text-[11px] text-muted-foreground">
                  {String(point.name ?? "—")}
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">
                  {formatCount(Number(point.value ?? 0))}
                </p>
              </div>
            )}
          />
        </BarChart>
      </div>

      {assessment.gradingBacklogCount > 0 ? (
        <p className="mt-2 text-[11px] text-destructive">
          {formatCount(assessment.gradingBacklogCount)} bài vượt ngưỡng{" "}
          {assessment.gradingBacklogThresholdHours}h chờ chấm.
        </p>
      ) : null}
    </DashboardPanel>
  );
}
