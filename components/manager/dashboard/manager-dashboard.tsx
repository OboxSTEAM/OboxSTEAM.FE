"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { CheckSquare, Clock, Target, Users, Wallet } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getDashboardLanding,
  type DashboardLanding,
  type DashboardRange,
} from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

import {
  deltaPercent,
  enrollmentMixFootnote,
  paymentMixFootnote,
  toPercentValue,
} from "./chart-data";
import { DashboardActionQueue } from "./dashboard-action-queue";
import { DashboardGroupHeading } from "./dashboard-panel";
import { DashboardRangeTabs } from "./dashboard-range-tabs";
import {
  formatCount,
  formatMoney,
  greetingByHour,
  revenueTitleForRange,
  type AttentionItem,
} from "./dashboard-utils";
import { KpiStatCard } from "./kpi-stat-card";
import { TrendPanel } from "./panels/trend-panel";

function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border border-border/60 bg-border/50",
        className,
      )}
    />
  );
}

const TopProgramsPanel = dynamic(
  () =>
    import("./panels/top-programs-panel").then((m) => m.TopProgramsPanel),
  { ssr: false, loading: () => <PanelSkeleton className="h-[320px]" /> },
);

const StatusBreakdownPanel = dynamic(
  () =>
    import("./panels/status-breakdown-panel").then(
      (m) => m.StatusBreakdownPanel,
    ),
  { ssr: false, loading: () => <PanelSkeleton className="h-[280px]" /> },
);

function buildActionItems(landing: DashboardLanding): AttentionItem[] {
  const items: AttentionItem[] = [];
  const { operations, assessment, revenue } = landing;

  if (operations.pendingMentorRequestsCount > 0) {
    items.push({
      id: "mentor-pending",
      title: "Mentor chờ duyệt",
      detail: `${formatCount(operations.pendingMentorRequestsCount)} yêu cầu`,
      href: "/manager/classes",
      status: "Cần làm",
      tone: "danger",
      priority: 1,
    });
  }

  if (assessment.gradingBacklogCount > 0) {
    items.push({
      id: "grading-backlog",
      title: "Bài nộp chờ chấm",
      detail: `${formatCount(assessment.gradingBacklogCount)} bài · quá ${formatCount(assessment.gradingBacklogThresholdHours)} giờ`,
      href: "/manager/assignments",
      status: "Cần làm",
      tone: "warn",
      priority: 2,
    });
  }

  if (revenue.pendingPaymentRequestsCount > 0) {
    items.push({
      id: "payment-pending",
      title: "Thanh toán chờ",
      detail: `${formatCount(revenue.pendingPaymentRequestsCount)} · ${formatMoney(revenue.pendingPaymentRequestsAmount)}`,
      href: "/manager/programs",
      status: "Theo dõi",
      tone: "info",
      priority: 3,
    });
  }

  return items.sort((a, b) => a.priority - b.priority);
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 px-5 py-5 lg:px-6 lg:py-6">
      <div className="h-14 animate-pulse rounded-2xl bg-border/70" />
      <div className="h-24 animate-pulse rounded-2xl bg-border/70" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-border/70"
          />
        ))}
      </div>
      <div className="h-[280px] animate-pulse rounded-2xl bg-border/70" />
    </div>
  );
}

export function ManagerDashboard() {
  const { profile } = useCurrentUser();
  const [range, setRange] = React.useState<DashboardRange>("Last30Days");

  const { data, isLoading, hasError, markLoading, retry } = useClientFetch({
    fetcher: async (): Promise<DashboardLanding> => {
      const result = await getDashboardLanding({
        range,
        page: 1,
        pageSize: 5,
      });
      return result!.data;
    },
    deps: [range],
    onError: (err) => {
      showAppErrorFromUnknown(err, "dashboard.load");
    },
  });

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  if ((hasError && !data) || !data) {
    return (
      <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-4 px-6 py-16 lg:px-8">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Không tải được tổng quan
        </h2>
        <p className="text-sm text-muted-foreground">
          Kiểm tra kết nối hoặc thử tải lại sau vài giây.
        </p>
        <button
          type="button"
          onClick={retry}
          className={cn(buttonVariants({ variant: "outline" }), "text-sm")}
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { enrollment, revenue, assessment, operations } = data;
  const actionItems = buildActionItems(data);

  const revenueDelta = deltaPercent(
    revenue.revenueInRange,
    revenue.revenueInPreviousRange,
  );
  const enrollmentDelta = deltaPercent(
    enrollment.newEnrollmentsInRange,
    enrollment.newEnrollmentsInPreviousRange,
  );
  const attendanceDelta = deltaPercent(
    toPercentValue(operations.averageAttendanceRate, operations.rateUnit),
    toPercentValue(
      operations.averageAttendanceRateInPreviousRange,
      operations.rateUnit,
    ),
  );
  const passRateDelta = deltaPercent(
    toPercentValue(assessment.passRate, assessment.rateUnit),
    toPercentValue(assessment.passRateInPreviousRange, assessment.rateUnit),
  );

  const attendanceRate = toPercentValue(
    operations.averageAttendanceRate,
    operations.rateUnit,
  );
  const passRate = toPercentValue(assessment.passRate, assessment.rateUnit);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 bg-background px-5 py-5 lg:px-6 lg:py-6">
      <header className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            {greetingByHour()}, {profile?.fullName ?? "Manager"}
          </p>
          <h1 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Tổng quan vận hành
          </h1>
        </div>

        <DashboardRangeTabs
          range={range}
          isLoading={isLoading}
          onChange={(next) => {
            markLoading();
            setRange(next);
          }}
        />
      </header>

      <DashboardActionQueue items={actionItems} />

      <section className="space-y-3" aria-labelledby="business-group-heading">
        <div id="business-group-heading">
          <DashboardGroupHeading title="Doanh thu và Tuyển sinh" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <KpiStatCard
            label={revenueTitleForRange(range)}
            hint="So với kỳ trước"
            value={revenue.revenueInRange}
            href="/manager/programs"
            icon={Wallet}
            accentClassName="text-steam-technology"
            delta={revenueDelta}
            format={{
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
              notation: "compact",
            }}
            footnote={paymentMixFootnote(revenue.revenueByGateway)}
          />
          <KpiStatCard
            label="Đăng ký mới"
            hint="Trong kỳ đã chọn"
            value={enrollment.newEnrollmentsInRange}
            href="/manager/programs"
            icon={Users}
            accentClassName="text-steam-science"
            delta={enrollmentDelta}
            footnote={
              enrollmentMixFootnote(enrollment.programEnrollmentsByStatus) ??
              `${formatCount(enrollment.activeStudents)} học viên đang học`
            }
          />
        </div>

        <TrendPanel
          range={range}
          isLoading={isLoading}
          enrollment={enrollment}
          revenue={revenue}
          assessment={assessment}
          operations={operations}
        />

        <TopProgramsPanel
          enrollment={enrollment}
          revenue={revenue}
          isLoading={isLoading}
          revealSignature={range}
        />
      </section>

      <section className="space-y-3" aria-labelledby="quality-group-heading">
        <div id="quality-group-heading">
          <DashboardGroupHeading title="Chất lượng giảng dạy" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <KpiStatCard
            label="Điểm danh"
            hint="Tỷ lệ có mặt trung bình"
            value={attendanceRate}
            href="/manager/attendance"
            icon={CheckSquare}
            accentClassName="text-steam-arts"
            delta={attendanceDelta}
            format={{ maximumFractionDigits: 1 }}
            suffix="%"
          />
          <KpiStatCard
            label="Tỷ lệ đạt"
            hint="Trong kỳ đã chọn"
            value={passRate}
            href="/manager/assignments"
            icon={Target}
            accentClassName="text-steam-mathematics"
            delta={passRateDelta}
            format={{ maximumFractionDigits: 1 }}
            suffix="%"
          />
          <KpiStatCard
            label="Thời gian chấm bài trung bình"
            hint="Giờ mỗi bài"
            value={assessment.averageGradingTurnaroundHours}
            href="/manager/assignments"
            icon={Clock}
            accentClassName="text-steam-engineering"
            format={{ maximumFractionDigits: 1 }}
            suffix="h"
          />
        </div>

        <StatusBreakdownPanel
          operations={operations}
          isLoading={isLoading}
          revealSignature={range}
        />
      </section>
    </div>
  );
}
