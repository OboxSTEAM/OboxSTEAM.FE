"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ClipboardList,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getDashboardEnrollment,
  getDashboardOperations,
  getDashboardOverview,
  getDashboardRevenue,
  type DashboardOverview,
  type DashboardRange,
  type EnrollmentOverview,
  type OperationsOverview,
  type RevenueOverview,
} from "@/lib/api";
import type { ClassStatus } from "@/lib/api/entities/class";
import { CLASS_STATUS_LABELS } from "@/lib/classes/constants";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

import {
  buildTrendGeometry,
  DASHBOARD_RANGE_OPTIONS,
  formatCount,
  formatMoney,
  formatRate,
  greetingByHour,
  toPercent,
  trendChangePercent,
  type AttentionItem,
} from "./dashboard-utils";

type DashboardLanding = {
  overview: DashboardOverview;
  enrollment: EnrollmentOverview;
  revenue: RevenueOverview;
  operations: OperationsOverview;
};

/** Chỉ việc cần hành động — không lẫn KPI tham chiếu. */
function buildActionItems(overview: DashboardOverview): AttentionItem[] {
  const items: AttentionItem[] = [];
  const { operations } = overview;

  if (operations.pendingMentorRequestsCount > 0) {
    items.push({
      id: "mentor-pending",
      title: "Duyệt yêu cầu Mentor",
      detail: `${formatCount(operations.pendingMentorRequestsCount)} yêu cầu chưa xử lý`,
      href: "/manager/classes",
      status: "Cần làm",
      tone: "danger",
      priority: 1,
    });
  }

  return items.sort((a, b) => a.priority - b.priority);
}

function classStatusLabel(status: string): string {
  return CLASS_STATUS_LABELS[status as ClassStatus] ?? status;
}

const PAYMENT_GATEWAY_VI: Record<string, string> = {
  VnPay: "VNPay",
  Stripe: "Stripe",
  BankTransfer: "Chuyển khoản",
};

function gatewayLabel(gateway: string): string {
  return PAYMENT_GATEWAY_VI[gateway] ?? gateway;
}

function toneBadge(tone: AttentionItem["tone"]) {
  switch (tone) {
    case "danger":
      return "bg-[#E94B3C]/10 text-[#E94B3C]";
    case "warn":
      return "bg-[#FDD835]/25 text-[#7a6200]";
    case "info":
      return "bg-[#4FC3F7]/15 text-[#0d6e9c]";
    default:
      return "bg-[#F5F5F0] text-[#6B6B6B]";
  }
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[#E5E5E0] bg-white",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-heading text-base font-bold text-[#2D2D2D]">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-[#6B6B6B]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function MetricBar({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1.5">
      {label ? (
        <div className="flex justify-between text-[11px] text-[#6B6B6B]">
          <span>{label}</span>
          <span className="font-mono font-medium text-[#2D2D2D]">
            {clamped.toFixed(1)}%
          </span>
        </div>
      ) : null}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F5F5F0]">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="h-24 animate-pulse rounded-2xl bg-[#E5E5E0]/80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#E5E5E0]/80" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl bg-[#E5E5E0]/80 lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl bg-[#E5E5E0]/80" />
      </div>
    </div>
  );
}

export function ManagerDashboard() {
  const { profile } = useCurrentUser();
  const [range, setRange] = React.useState<DashboardRange>("Last30Days");

  const { data, isLoading, hasError, markLoading, retry } = useClientFetch({
    fetcher: async (): Promise<DashboardLanding> => {
      const query = { range, page: 1, pageSize: 5 };
      const [overviewResult, enrollmentResult, revenueResult, operationsResult] =
        await Promise.all([
          getDashboardOverview(query),
          getDashboardEnrollment(query),
          getDashboardRevenue(query),
          getDashboardOperations(query),
        ]);
      return {
        overview: overviewResult!.data,
        enrollment: enrollmentResult!.data,
        revenue: revenueResult!.data,
        operations: operationsResult!.data,
      };
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
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-6 py-16">
        <h2 className="font-heading text-xl font-bold text-[#2D2D2D]">
          Không tải được dashboard
        </h2>
        <p className="text-sm text-[#6B6B6B]">
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

  const { overview, enrollment, revenue, operations } = data;
  const trend = enrollment.enrollmentTrend ?? [];
  const geometry = buildTrendGeometry(trend);
  const change = trendChangePercent(trend);
  const actionItems = buildActionItems(overview);
  const topPrograms = enrollment.topProgramsByEnrollment.items;
  const maxProgramCount = Math.max(...topPrograms.map((p) => p.count), 1);
  const mentors = operations.mentorUtilization.items;
  const gateways = revenue.revenueByGateway ?? [];
  const rangeLabel =
    DASHBOARD_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "30 ngày";

  const axisLabels = (() => {
    if (trend.length === 0) return [];
    if (trend.length === 1) return [trend[0]];
    const mid = Math.floor(trend.length / 2);
    return [trend[0], trend[mid], trend[trend.length - 1]];
  })();

  const kpis = [
    {
      label: "Học viên đang học",
      hint: "Đang hoạt động",
      value: formatCount(overview.enrollment.activeStudents),
      footnote: `+${formatCount(overview.enrollment.newEnrollmentsInRange)} đăng ký mới trong kỳ`,
      href: "/manager/programs",
      icon: Users,
      accent: "#7CB342",
    },
    {
      label: "Chương trình",
      hint: "Tổng số trên hệ thống",
      value: formatCount(overview.enrollment.totalPrograms),
      footnote: `${formatCount(enrollment.totalModules)} module · ${formatCount(enrollment.totalCourses)} khóa`,
      href: "/manager/programs",
      icon: BookOpen,
      accent: "#E94B3C",
    },
    {
      label: "Lớp đang chạy",
      hint: "Đang mở / Đang học",
      value: formatCount(overview.operations.activeClassCount),
      footnote: `Lấp đầy lớp TB ${formatRate(overview.operations.averageCapacityUtilization)}`,
      href: "/manager/classes",
      icon: GraduationCap,
      accent: "#4FC3F7",
    },
    {
      label: "Mentor chờ duyệt",
      hint: "Yêu cầu chưa xử lý",
      value: formatCount(overview.operations.pendingMentorRequestsCount),
      footnote:
        overview.operations.pendingMentorRequestsCount > 0
          ? "Cần xử lý tại Lớp học"
          : "Không có yêu cầu mới",
      href: "/manager/classes",
      icon: UserCheck,
      accent: "#7E57C2",
      alert: overview.operations.pendingMentorRequestsCount > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 bg-[#FAFAF5] px-6 py-8">
      {/* 1. Header + bộ thời gian (điều khiển chính) */}
      <header className="flex flex-col gap-4 border-b border-[#E5E5E0] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#6B6B6B]">
            {greetingByHour()}, {profile?.fullName ?? "Manager"}
          </p>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-[#2D2D2D] sm:text-3xl">
            Tổng quan vận hành
          </h1>
          <p className="max-w-xl text-sm text-[#6B6B6B]">
            Số liệu theo khoảng thời gian bạn chọn bên phải. Dùng để nắm tình
            hình và ưu tiên việc cần làm.
          </p>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[320px]">
          <label
            htmlFor="dashboard-range"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]"
          >
            Khoảng thời gian
          </label>
          <div
            id="dashboard-range"
            role="group"
            aria-label="Chọn khoảng thời gian thống kê"
            className="grid grid-cols-4 rounded-xl border border-[#E5E5E0] bg-white p-1"
          >
            {DASHBOARD_RANGE_OPTIONS.map((option) => {
              const active = option.value === range;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    if (option.value === range) return;
                    markLoading();
                    setRange(option.value);
                  }}
                  className={cn(
                    "rounded-lg px-2 py-2 text-center text-xs font-semibold transition-colors",
                    active
                      ? "bg-[#2D2D2D] text-white"
                      : "text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]",
                  )}
                >
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.short}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-[#6B6B6B]">
            Đang xem: <span className="font-medium text-[#2D2D2D]">{rangeLabel}</span>
            {isLoading ? " · Đang tải…" : null}
          </p>
        </div>
      </header>

      {/* 2. Việc cần làm — ưu tiên hành động */}
      <Panel className="p-5 sm:p-6">
        <SectionTitle
          title="Việc cần làm"
          description={
            actionItems.length > 0
              ? `${actionItems.length} hạng mục cần chú ý trong kỳ này`
              : "Không có hạng mục khẩn trong kỳ này"
          }
        />
        {actionItems.length === 0 ? (
          <p className="mt-4 rounded-xl bg-[#7CB342]/8 px-4 py-3 text-sm text-[#3d5c22]">
            Hệ thống ổn định — không có yêu cầu Mentor chờ duyệt.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#E5E5E0] rounded-xl border border-[#E5E5E0]">
            {actionItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#FAFAF5]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#2D2D2D]">
                        {item.title}
                      </p>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                          toneBadge(item.tone),
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#6B6B6B]">{item.detail}</p>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-[#6B6B6B]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* 3. KPI — cùng kích thước, dễ so sánh */}
      <div>
        <SectionTitle
          title="Chỉ số chính"
          description={`Tóm tắt nhanh trong ${rangeLabel.toLowerCase()}`}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="group rounded-2xl border border-[#E5E5E0] bg-white p-4 transition-colors hover:border-[#2D2D2D]/20 hover:bg-[#FAFAF5]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#2D2D2D]">
                      {kpi.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#6B6B6B]">{kpi.hint}</p>
                  </div>
                  <Icon
                    className="size-4 shrink-0 opacity-80"
                    style={{ color: kpi.accent }}
                  />
                </div>
                <p
                  className="mt-3 font-heading text-3xl font-black tabular-nums tracking-tight"
                  style={{ color: kpi.accent }}
                >
                  {kpi.value}
                </p>
                <p
                  className={cn(
                    "mt-2 text-[11px] leading-snug",
                    kpi.alert ? "font-medium text-[#E94B3C]" : "text-[#6B6B6B]",
                  )}
                >
                  {kpi.footnote}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Chương trình · Doanh thu · Mentor */}
      <div>
        <SectionTitle
          title="Chương trình · Doanh thu · Mentor"
          description="Xem nhanh hiệu suất từng mảng trong kỳ đã chọn"
        />
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <Panel className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="size-4 text-[#E94B3C]" />
              <h3 className="text-sm font-bold text-[#2D2D2D]">
                Top chương trình theo đăng ký
              </h3>
            </div>
            {topPrograms.length === 0 ? (
              <p className="text-sm text-[#6B6B6B]">Chưa có dữ liệu</p>
            ) : (
              <ol className="space-y-3">
                {topPrograms.map((program, index) => (
                  <li key={program.programId} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate text-[#2D2D2D]">
                        <span className="mr-1.5 font-mono text-[#6B6B6B]">
                          {index + 1}.
                        </span>
                        {program.programName ?? "Không tên"}
                      </span>
                      <span className="shrink-0 font-mono font-semibold text-[#2D2D2D]">
                        {formatCount(program.count)}
                      </span>
                    </div>
                    <MetricBar
                      value={(program.count / maxProgramCount) * 100}
                      color="#E94B3C"
                    />
                  </li>
                ))}
              </ol>
            )}
            <Link
              href="/manager/programs"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#E94B3C] hover:underline"
            >
              Quản lý chương trình
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Panel>

          <Panel className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="size-4 text-[#7CB342]" />
              <div>
                <h3 className="text-sm font-bold text-[#2D2D2D]">Doanh thu kỳ</h3>
                <p className="text-[11px] text-[#6B6B6B]">
                  Chỉ xem thống kê
                </p>
              </div>
            </div>
            <p className="font-heading text-2xl font-black tabular-nums text-[#2D2D2D]">
              {formatMoney(revenue.revenueInRange)}
            </p>
            <p className="mt-1 text-xs text-[#6B6B6B]">
              Tổng tích lũy {formatMoney(revenue.totalRevenue)}
            </p>
            <dl className="mt-4 space-y-2 border-t border-[#E5E5E0] pt-3 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-[#6B6B6B]">Giá trị đơn TB</dt>
                <dd className="font-mono font-medium text-[#2D2D2D]">
                  {formatMoney(revenue.averageOrderValue)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#6B6B6B]">Số hóa đơn</dt>
                <dd className="font-mono font-medium text-[#2D2D2D]">
                  {formatCount(revenue.invoiceCount)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#6B6B6B]">Yêu cầu thanh toán đang chờ</dt>
                <dd className="font-mono font-medium text-[#2D2D2D]">
                  {formatCount(revenue.pendingPaymentRequestsCount)}
                </dd>
              </div>
            </dl>
            {gateways.length > 0 ? (
              <div className="mt-4 space-y-1.5 border-t border-[#E5E5E0] pt-3">
                <p className="text-[11px] font-semibold text-[#6B6B6B]">
                  Theo cổng thanh toán
                </p>
                {gateways.map((g) => (
                  <div
                    key={g.gateway}
                    className="flex justify-between text-xs text-[#2D2D2D]"
                  >
                    <span>{gatewayLabel(g.gateway)}</span>
                    <span className="font-mono text-[#6B6B6B]">
                      {formatMoney(g.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserCheck className="size-4 text-[#7E57C2]" />
              <div>
                <h3 className="text-sm font-bold text-[#2D2D2D]">
                  Tải mentor
                </h3>
                <p className="text-[11px] text-[#6B6B6B]">
                  Đã nhận / giới hạn lớp
                </p>
              </div>
            </div>
            {mentors.length === 0 ? (
              <p className="text-sm text-[#6B6B6B]">Chưa có dữ liệu</p>
            ) : (
              <ul className="space-y-3">
                {mentors.map((mentor) => {
                  const load =
                    mentor.max > 0 ? (mentor.assigned / mentor.max) * 100 : 0;
                  return (
                    <li key={mentor.mentorId} className="space-y-1.5">
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="truncate font-medium text-[#2D2D2D]">
                          {mentor.mentorName ?? "Mentor"}
                        </span>
                        <span className="shrink-0 font-mono text-[#6B6B6B]">
                          {mentor.assigned}/{mentor.max}
                          {mentor.pending > 0 ? ` (+${mentor.pending} chờ)` : ""}
                        </span>
                      </div>
                      <MetricBar value={load} color="#7E57C2" />
                    </li>
                  );
                })}
              </ul>
            )}
            {Object.keys(operations.classesByStatus ?? {}).length > 0 ? (
              <div className="mt-4 border-t border-[#E5E5E0] pt-3">
                <p className="mb-2 text-[11px] font-semibold text-[#6B6B6B]">
                  Lớp theo trạng thái
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(operations.classesByStatus ?? {}).map(
                    ([status, count]) => (
                      <span
                        key={status}
                        className="rounded-md border border-[#E5E5E0] bg-[#FAFAF5] px-2 py-0.5 font-mono text-[10px] text-[#2D2D2D]"
                      >
                        {classStatusLabel(status)}: {count}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ) : null}
            <Link
              href="/manager/classes"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#7E57C2] hover:underline"
            >
              Quản lý lớp học
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Panel>
        </div>
      </div>

      {/* 5. Xu hướng + hoàn thành & tham dự */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5 sm:p-6 lg:col-span-2">
          <SectionTitle
            title="Xu hướng đăng ký"
            description="Số đăng ký mới theo thời gian — dùng để thấy tăng/giảm"
            action={
              change != null ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold",
                    change >= 0
                      ? "bg-[#7CB342]/10 text-[#3d5c22]"
                      : "bg-[#E94B3C]/10 text-[#E94B3C]",
                  )}
                >
                  {change >= 0 ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(1)}% so với điểm đầu kỳ
                </span>
              ) : null
            }
          />

          <div className="relative mt-5 h-56 w-full sm:h-64">
            {trend.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#E5E5E0] bg-[#FAFAF5] text-sm text-[#6B6B6B]">
                Chưa có dữ liệu xu hướng trong khoảng này
              </div>
            ) : (
              <>
                <div className="pointer-events-none absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-full border-b border-dashed border-[#E5E5E0]/70"
                    />
                  ))}
                </div>
                <svg
                  className="h-[calc(100%-1.75rem)] w-full"
                  viewBox="0 0 600 200"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="dashAreaClear" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4FC3F7" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#4FC3F7" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={geometry.area} fill="url(#dashAreaClear)" />
                  <path
                    d={geometry.line}
                    fill="none"
                    stroke="#4FC3F7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex justify-between px-0.5 font-mono text-[10px] text-[#6B6B6B]">
                  {axisLabels.map((p, i) => (
                    <span key={`${p?.label}-${i}`}>{p?.label ?? "—"}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <p className="mt-4 border-t border-[#E5E5E0] pt-3 text-xs text-[#6B6B6B]">
            Tổng đăng ký mới trong kỳ:{" "}
            <span className="font-semibold text-[#2D2D2D]">
              {formatCount(enrollment.newEnrollmentsInRange)}
            </span>
          </p>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <SectionTitle
            title="Hoàn thành & tham dự"
            description="Chỉ số vận hành tham chiếu — chấm bài do Mentor phụ trách"
          />
          <div className="mt-5 space-y-5">
            <MetricBar
              label="Tỷ lệ hoàn thành chương trình"
              value={toPercent(overview.enrollment.completionRate)}
              color="#7CB342"
            />
            <MetricBar
              label="Điểm danh trung bình"
              value={toPercent(operations.averageAttendanceRate)}
              color="#FDD835"
            />
            <MetricBar
              label="Tỷ lệ lấp đầy lớp (học viên / sức chứa)"
              value={toPercent(overview.operations.averageCapacityUtilization)}
              color="#4FC3F7"
            />
            <div className="rounded-xl bg-[#FAFAF5] px-3 py-3 text-xs text-[#6B6B6B]">
              Lớp đang chạy:{" "}
              <span className="font-mono font-semibold text-[#2D2D2D]">
                {formatCount(overview.operations.activeClassCount)}
              </span>
              <br />
              Mentor chờ duyệt:{" "}
              <span className="font-mono font-semibold text-[#2D2D2D]">
                {formatCount(overview.operations.pendingMentorRequestsCount)}
              </span>
            </div>
            <Link
              href="/manager/attendance"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d6e9c] hover:underline"
            >
              Xem điểm danh
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </Panel>
      </div>

      {/* 6. Lối tắt ổn định */}
      <Panel className="p-4 sm:p-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">
          Đi nhanh tới
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/manager/programs", label: "Chương trình", icon: BookOpen },
            { href: "/manager/classes", label: "Lớp học", icon: GraduationCap },
            {
              href: "/manager/assignments",
              label: "Bài tập",
              icon: ClipboardList,
            },
            { href: "/manager/attendance", label: "Điểm danh", icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-lg border border-[#E5E5E0] bg-[#FAFAF5] px-3 py-2 text-xs font-semibold text-[#2D2D2D] transition-colors hover:bg-white hover:border-[#2D2D2D]/20"
              >
                <Icon className="size-3.5 text-[#6B6B6B]" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
