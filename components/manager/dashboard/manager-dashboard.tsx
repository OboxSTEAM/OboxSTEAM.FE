"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Users,
  Wallet,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getClassMentorRequests,
  getDashboardLanding,
  type ClassMentorRequest,
  type DashboardLanding,
  type DashboardRange,
} from "@/lib/api";
import { managerClassDetailHref } from "@/lib/manager/class-paths";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

import {
  deltaPercent,
} from "./chart-data";
import { AttendanceSummaryCard } from "./attendance-summary-card";
import { DashboardActionQueue } from "./dashboard-action-queue";
import { PassRateByProgramCard } from "./pass-rate-by-program-card";
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

const ProgramRevenuePanel = dynamic(
  () =>
    import("./panels/program-revenue-panel").then((m) => m.ProgramRevenuePanel),
  { ssr: false, loading: () => <PanelSkeleton className="h-[300px]" /> },
);

const StatusBreakdownPanel = dynamic(
  () =>
    import("./panels/status-breakdown-panel").then(
      (m) => m.StatusBreakdownPanel,
    ),
  { ssr: false, loading: () => <PanelSkeleton className="h-[300px]" /> },
);

const MentorLoadPanel = dynamic(
  () =>
    import("./panels/mentor-load-panel").then((m) => m.MentorLoadPanel),
  { ssr: false, loading: () => <PanelSkeleton className="h-[300px]" /> },
);

type PendingMentorClass = {
  classId: string;
  className: string;
  classCode: string;
  requestCount: number;
};

function groupPendingMentorClasses(
  requests: ClassMentorRequest[],
): PendingMentorClass[] {
  const byClass = new Map<string, PendingMentorClass>();

  for (const request of requests) {
    const existing = byClass.get(request.classId);
    if (existing) {
      existing.requestCount += 1;
      continue;
    }

    byClass.set(request.classId, {
      classId: request.classId,
      className: request.className?.trim() || "Lớp chưa đặt tên",
      classCode: request.classCode?.trim() || "",
      requestCount: 1,
    });
  }

  return [...byClass.values()];
}

function buildActionItems(
  landing: DashboardLanding,
  pendingClasses: PendingMentorClass[],
  includeMentorFallback: boolean,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const { operations, revenue } = landing;

  if (pendingClasses.length > 0) {
    for (const pendingClass of pendingClasses) {
      const requestLabel = `${formatCount(pendingClass.requestCount)} yêu cầu`;
      items.push({
        id: `mentor-pending-${pendingClass.classId}`,
        title: pendingClass.className,
        detail: pendingClass.classCode
          ? `${pendingClass.classCode} · ${requestLabel}`
          : requestLabel,
        href: managerClassDetailHref(pendingClass.classId),
        status: "Phê duyệt",
        tone: "danger",
        priority: 1,
      });
    }
  } else if (includeMentorFallback && operations.pendingMentorRequestsCount > 0) {
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-border/70"
          />
        ))}
      </div>
      <div className="h-[320px] animate-pulse rounded-2xl bg-border/70" />
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
        pageSize: 20,
      });
      return result!.data;
    },
    deps: [range],
    onError: (err) => {
      showAppErrorFromUnknown(err, "dashboard.load");
    },
  });

  const pendingMentorCount = data?.operations.pendingMentorRequestsCount ?? 0;
  const {
    data: pendingMentorData,
    isLoading: isPendingMentorsLoading,
    hasError: hasPendingMentorsError,
  } = useClientFetch({
    enabled: pendingMentorCount > 0,
    minSkeletonMs: 0,
    fetcher: () =>
      getClassMentorRequests({
        status: "Pending",
        page: 1,
        pageSize: Math.min(Math.max(pendingMentorCount, 1), 100),
      }),
    deps: [pendingMentorCount],
    onError: (err) => {
      showAppErrorFromUnknown(err, "classMentorRequests.list");
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

  const { enrollment, revenue, operations } = data;
  const pendingClasses = groupPendingMentorClasses(
    pendingMentorData?.data?.items ?? [],
  );
  const isMentorQueueLoading =
    pendingMentorCount > 0 &&
    isPendingMentorsLoading &&
    pendingClasses.length === 0;
  const actionItems = buildActionItems(
    data,
    isMentorQueueLoading ? [] : pendingClasses,
    !isMentorQueueLoading &&
      (hasPendingMentorsError || pendingClasses.length === 0),
  );

  const revenueDelta = deltaPercent(
    revenue.revenueInRange,
    revenue.revenueInPreviousRange,
  );
  const enrollmentDelta = deltaPercent(
    enrollment.newEnrollmentsInRange,
    enrollment.newEnrollmentsInPreviousRange,
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] space-y-5 bg-background px-4 py-4 sm:space-y-6 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
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

      <DashboardActionQueue
        items={actionItems}
        pendingClassSlots={
          isMentorQueueLoading ? Math.min(pendingMentorCount, 4) : 0
        }
      />

      <section className="min-w-0 space-y-3" aria-labelledby="business-group-heading">
        <div id="business-group-heading">
          <DashboardGroupHeading title="Doanh thu và tuyển sinh" />
        </div>

        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
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
          />
          <KpiStatCard
            label="Đăng ký mới"
            hint="Trong kỳ đã chọn"
            value={enrollment.newEnrollmentsInRange}
            href="/manager/programs"
            icon={Users}
            accentClassName="text-steam-science"
            delta={enrollmentDelta}
          />
        </div>

        <TrendPanel
          range={range}
          isLoading={isLoading}
          enrollment={enrollment}
          revenue={revenue}
        />

        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="min-w-0">
            <ProgramRevenuePanel
              revenue={revenue}
              isLoading={isLoading}
              revealSignature={range}
            />
          </div>
          <div className="min-w-0">
            <TopProgramsPanel
              enrollment={enrollment}
              revenue={revenue}
              isLoading={isLoading}
              revealSignature={range}
            />
          </div>
        </div>
      </section>

      <section className="min-w-0 space-y-3" aria-labelledby="quality-group-heading">
        <div id="quality-group-heading">
          <DashboardGroupHeading title="Chất lượng giảng dạy" />
        </div>

        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          <AttendanceSummaryCard />
          <PassRateByProgramCard items={enrollment.programEnrollmentsByStatus} />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2 xl:items-stretch">
          <MentorLoadPanel operations={operations} />
          <StatusBreakdownPanel
            datasets={[
              {
                key: "class",
                label: "Lớp học",
                title: "Tình trạng vận hành lớp học",
                description: "Tỷ trọng lớp theo trạng thái vận hành",
                items: operations.classesByStatus,
                kind: "class",
                href: "/manager/classes",
                linkLabel: "Quản lý lớp học",
              },
            ]}
            isLoading={isLoading}
            revealSignature={range}
          />
        </div>
      </section>
    </div>
  );
}
