"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  GraduationCap,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

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
  deriveActiveClassCount,
  toPercentValue,
} from "./chart-data";
import { DashboardAlertStrip } from "./dashboard-alert-strip";
import { DashboardRangeTabs } from "./dashboard-range-tabs";
import {
  formatCount,
  formatMoney,
  formatRate,
  greetingByHour,
  type AttentionItem,
} from "./dashboard-utils";
import { KpiStatCard } from "./kpi-stat-card";
import { OperationsHealthPanel } from "./panels/operations-health-panel";
import { TrendPanel } from "./panels/trend-panel";

const QUICK_LINKS = [
  { href: "/manager/programs", label: "Chương trình" },
  { href: "/manager/classes", label: "Lớp học" },
  { href: "/manager/assignments", label: "Bài tập" },
  { href: "/manager/attendance", label: "Điểm danh" },
] as const;

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
  { ssr: false, loading: () => <PanelSkeleton className="h-[400px]" /> },
);

const RevenueMixPanel = dynamic(
  () =>
    import("./panels/revenue-mix-panel").then((m) => m.RevenueMixPanel),
  { ssr: false, loading: () => <PanelSkeleton className="h-[400px]" /> },
);

const MentorLoadPanel = dynamic(
  () =>
    import("./panels/mentor-load-panel").then((m) => m.MentorLoadPanel),
  { ssr: false, loading: () => <PanelSkeleton className="h-64" /> },
);

const AssessmentPanel = dynamic(
  () =>
    import("./panels/assessment-panel").then((m) => m.AssessmentPanel),
  { ssr: false, loading: () => <PanelSkeleton className="h-[400px]" /> },
);

const StatusBreakdownPanel = dynamic(
  () =>
    import("./panels/status-breakdown-panel").then(
      (m) => m.StatusBreakdownPanel,
    ),
  { ssr: false, loading: () => <PanelSkeleton className="h-[400px]" /> },
);

function buildActionItems(landing: DashboardLanding): AttentionItem[] {
  const items: AttentionItem[] = [];
  const { operations, assessment, revenue } = landing;

  if (operations.pendingMentorRequestsCount > 0) {
    items.push({
      id: "mentor-pending",
      title: "Duyệt yêu cầu Mentor",
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
      title: "Backlog chấm bài",
      detail: `${formatCount(assessment.gradingBacklogCount)} bài`,
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-border/70"
          />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-[320px] animate-pulse rounded-2xl bg-border/70 lg:col-span-2" />
        <div className="h-[320px] animate-pulse rounded-2xl bg-border/70" />
      </div>
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
          Không tải được dashboard
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
  const activeClassCount = deriveActiveClassCount(operations.classesByStatus);

  const revenueDelta = deltaPercent(
    revenue.revenueInRange,
    revenue.revenueInPreviousRange,
  );
  const enrollmentDelta = deltaPercent(
    enrollment.newEnrollmentsInRange,
    enrollment.newEnrollmentsInPreviousRange,
  );
  const completionDelta = deltaPercent(
    toPercentValue(enrollment.completionRate, enrollment.rateUnit),
    toPercentValue(
      enrollment.completionRateInPreviousRange,
      enrollment.rateUnit,
    ),
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 bg-background px-5 py-5 lg:px-6 lg:py-6">
      <header className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            {greetingByHour()}, {profile?.fullName ?? "Manager"}
          </p>
          <h1 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Tổng quan vận hành
          </h1>
          <p className="max-w-xl text-xs text-muted-foreground sm:text-sm">
            Số liệu theo khoảng thời gian bạn chọn — nắm tình hình và ưu tiên
            việc cần làm.
          </p>
          <nav
            aria-label="Đi nhanh tới"
            className="flex flex-wrap items-center gap-x-1.5 gap-y-1 pt-1 text-xs text-muted-foreground"
          >
            {QUICK_LINKS.map((item, index) => (
              <React.Fragment key={item.href}>
                {index > 0 ? <span aria-hidden>·</span> : null}
                <Link
                  href={item.href}
                  className="font-medium text-foreground/80 transition-colors hover:text-foreground hover:underline"
                >
                  {item.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>
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

      <DashboardAlertStrip items={actionItems} />

      {/* Bento: KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          label="Doanh thu kỳ"
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
          footnote={`Tích lũy ${formatMoney(revenue.totalRevenue)}`}
        />
        <KpiStatCard
          label="Đăng ký mới"
          hint="Trong kỳ đã chọn"
          value={enrollment.newEnrollmentsInRange}
          href="/manager/programs"
          icon={Users}
          accentClassName="text-steam-science"
          delta={enrollmentDelta}
          footnote={`${formatCount(enrollment.activeStudents)} học viên đang học`}
        />
        <KpiStatCard
          label="Lớp đang chạy"
          hint="Đang mở / Đang học"
          value={activeClassCount}
          href="/manager/classes"
          icon={GraduationCap}
          accentClassName="text-steam-engineering"
          footnote={`Lấp đầy TB ${formatRate(toPercentValue(operations.averageCapacityUtilization, operations.rateUnit))}`}
        />
        <KpiStatCard
          label="Mentor chờ duyệt"
          hint="Yêu cầu chưa xử lý"
          value={operations.pendingMentorRequestsCount}
          href="/manager/classes"
          icon={UserCheck}
          accentClassName="text-steam-mathematics"
          alert={operations.pendingMentorRequestsCount > 0}
          footnote={
            operations.pendingMentorRequestsCount > 0
              ? "Cần xử lý tại Lớp học"
              : completionDelta != null
                ? `Hoàn thành ${formatRate(toPercentValue(enrollment.completionRate, enrollment.rateUnit))}`
                : "Không có yêu cầu mới"
          }
        />
      </div>

      {/* Bento: trend + ops */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <TrendPanel
            range={range}
            isLoading={isLoading}
            enrollment={enrollment}
            revenue={revenue}
            assessment={assessment}
            operations={operations}
          />
        </div>
        <div className="min-w-0">
          <OperationsHealthPanel
            enrollment={enrollment}
            operations={operations}
            assessment={assessment}
            activeClassCount={activeClassCount}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Bento: programs + revenue */}
      <div className="grid gap-3 lg:grid-cols-2">
        <TopProgramsPanel
          enrollment={enrollment}
          revenue={revenue}
          isLoading={isLoading}
          revealSignature={range}
        />
        <RevenueMixPanel revenue={revenue} isLoading={isLoading} />
      </div>

      {/* Bento: assessment + classes */}
      <div className="grid gap-3 lg:grid-cols-2">
        <AssessmentPanel
          assessment={assessment}
          isLoading={isLoading}
          revealSignature={range}
        />
        <StatusBreakdownPanel
          operations={operations}
          isLoading={isLoading}
          revealSignature={range}
        />
      </div>

      <MentorLoadPanel
        operations={operations}
        isLoading={isLoading}
        revealSignature={range}
      />
    </div>
  );
}
