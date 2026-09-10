"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";

import {
  ExpertWorkbenchHero,
  ExpertWorkflowRail,
} from "@/components/expert/shared/expert-workbench";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { getAdvisoryMine, type AdvisoryMineItem } from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  ADVISORY_STATUS_FILTER_OPTIONS,
  getAdvisoryNextActionLabel,
} from "@/lib/expert/advisory-labels";
import { PROGRAM_STATUS_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

export function ExpertAdvisoryHome() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filterConfig = ADVISORY_STATUS_FILTER_OPTIONS.find(
    (opt) => opt.value === statusFilter,
  );

  const { data, isLoading, markLoading } = useClientFetch({
    fetcher: () =>
      getAdvisoryMine({
        page,
        pageSize: PAGE_SIZE,
        status: filterConfig?.status,
        unreadOnly: filterConfig?.unreadOnly,
      }),
    deps: [page, statusFilter],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.mine"),
  });

  const totalPages = data?.data?.totalPages ?? 1;
  const totalCount = data?.data?.totalCount ?? 0;

  const programs = useMemo(() => {
    const items = data?.data?.items ?? [];
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return items;
    return items.filter((item) =>
      `${item.name} ${item.code}`.toLocaleLowerCase("vi").includes(keyword),
    );
  }, [data?.data?.items, search]);

  const columns: ColumnDef<AdvisoryMineItem>[] = [
    {
      header: "Chương trình",
      render: (item) => (
        <div className="min-w-0 max-w-72">
          <p className="font-mono text-[11px] font-semibold text-muted-foreground">
            {item.code || "Chưa có mã"}
          </p>
          <p className="mt-0.5 truncate font-semibold text-foreground">
            {item.name || "Chương trình chưa đặt tên"}
          </p>
        </div>
      ),
    },
    {
      header: "Vai trò",
      className: "w-40",
      render: (item) =>
        item.isAdvisor ? (
          <Badge className="rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
            Phụ trách
          </Badge>
        ) : (
          <Badge variant="secondary" className="rounded-md text-[11px]">
            Hội đồng
          </Badge>
        ),
    },
    {
      header: "Trạng thái",
      className: "w-32",
      render: (item) => (
        <span className="text-sm text-foreground">
          {PROGRAM_STATUS_LABELS[item.status]}
        </span>
      ),
    },
    {
      header: "Việc tiếp theo",
      render: (item) => {
        const isDecision =
          item.nextAction === "ReviewSubmission" ||
          item.nextAction === "PendingReview";
        const hasUnread = item.unreadFeedbackCount > 0;

        return (
          <div className="flex min-w-0 max-w-64 items-start gap-2">
            <span
              aria-hidden
              className={cn(
                "mt-1.5 size-1.5 shrink-0 rounded-full",
                isDecision
                  ? "bg-primary"
                  : hasUnread
                    ? "bg-amber-500"
                    : "bg-border",
              )}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold leading-5",
                  isDecision || hasUnread ? "text-primary" : "text-foreground",
                )}
              >
                {getAdvisoryNextActionLabel(item.nextAction)}
              </p>
              {hasUnread ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.unreadFeedbackCount} trao đổi chưa đọc
                </p>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      header: "Khung",
      className: "w-28 tabular-nums",
      render: (item) => (
        <span className="font-mono text-sm font-semibold text-foreground">
          {item.frameworkVersionNumber != null
            ? `v${item.frameworkVersionNumber}`
            : "—"}
        </span>
      ),
    },
    {
      header: "Cập nhật",
      className: "w-40",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(item.latestActivityAt)}
        </span>
      ),
    },
    {
      header: "Thao tác",
      className: "w-36 text-right",
      sticky: "right",
      render: (item) => (
        <div className="flex justify-end">
          <Button
            nativeButton={false}
            render={<Link href={`/expert/programs/${item.programId}`} />}
            variant="outline"
            className="h-9 gap-1 rounded-lg px-2.5 text-[11px] font-semibold"
          >
            Mở
            <ArrowRight className="size-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ExpertWorkbenchHero
        eyebrow="Bàn cố vấn chương trình"
        title="Chương trình phụ trách"
        description="Đọc bối cảnh → đối chiếu nội dung → trao đổi → quyết định trên đúng bản nộp."
        icon={ShieldCheck}
      >
        <ExpertWorkflowRail
          steps={[
            {
              label: "Hiểu bối cảnh",
              detail: "Mục tiêu, đối tượng học và phiên bản khung đang áp dụng.",
              state: "current",
            },
            {
              label: "Đối chiếu nội dung",
              detail: "Curriculum và các yêu cầu cấu trúc chưa đạt.",
              state: "next",
            },
            {
              label: "Trao đổi",
              detail: "Góp ý đúng học phần, khóa học hoặc tiêu chí liên quan.",
              state: "next",
            },
            {
              label: "Ra quyết định",
              detail: "Chấm rubric trên snapshot và phê duyệt hoặc yêu cầu sửa.",
              state: "next",
            },
          ]}
        />
      </ExpertWorkbenchHero>

      <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex flex-col gap-1 border-b border-border bg-background/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">
                Hàng đợi cố vấn
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Sắp xếp theo việc cần xử lý — mở chương trình để tiếp tục timeline.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono font-bold text-foreground">
                {totalCount}
              </span>{" "}
              chương trình
            </p>
          </div>

          <ManagerFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm theo tên hoặc mã…"
            filters={[
              {
                key: "status",
                placeholder: "Trạng thái",
                value: statusFilter,
                onChange: (value) => {
                  markLoading();
                  setStatusFilter(value || "all");
                  setPage(1);
                },
                options: ADVISORY_STATUS_FILTER_OPTIONS.map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                })),
              },
            ]}
            showClear={search !== "" || statusFilter !== "all"}
            onClearFilters={() => {
              markLoading();
              setSearch("");
              setStatusFilter("all");
              setPage(1);
            }}
          />

          <div className="p-4 sm:p-5">
            <ManagerDataTable
              columns={columns}
              data={programs}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => {
                markLoading();
                setPage(nextPage);
              }}
              emptyState={
                <ManagerEmptyState
                  icon={GraduationCap}
                  title="Chưa có chương trình phụ trách"
                  description="Khi được gán làm chuyên gia phụ trách hoặc tham gia hội đồng, chương trình sẽ hiển thị tại đây."
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
