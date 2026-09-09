"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";

import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
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
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-semibold text-foreground">
              {item.name || "Chưa đặt tên"}
            </p>
            {item.isAdvisor ? (
              <Badge className="rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                Phụ trách
              </Badge>
            ) : null}
            {item.unreadFeedbackCount > 0 ? (
              <Badge className="rounded-md bg-amber-500/15 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                {item.unreadFeedbackCount} chưa đọc
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {item.code || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Phiên bản khung",
      className: "w-28",
      render: (item) =>
        item.frameworkVersionNumber != null ? (
          <span className="font-mono text-sm text-foreground">
            v{item.frameworkVersionNumber}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: "Trạng thái",
      className: "w-32",
      render: (item) => (
        <Badge
          variant="secondary"
          className="rounded-md bg-muted text-[11px] font-medium text-foreground"
        >
          {PROGRAM_STATUS_LABELS[item.status]}
        </Badge>
      ),
    },
    {
      header: "Hoạt động gần nhất",
      className: "w-36 tabular-nums",
      render: (item) => formatDate(item.latestActivityAt),
    },
    {
      header: "Việc ưu tiên",
      className: "max-w-48",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {getAdvisoryNextActionLabel(item.nextAction)}
        </span>
      ),
    },
    {
      header: "Thao tác",
      className: "w-32 text-right",
      render: (item) => (
        <div className="flex justify-end">
          <Button
            nativeButton={false}
            render={<Link href={`/expert/programs/${item.programId}`} />}
            variant="outline"
            className="h-9 gap-1.5 rounded-lg border-border px-3 text-xs font-semibold"
          >
            Mở
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Chương trình phụ trách"
        description="Theo dõi thẩm định, góp ý curriculum và chấm rubric cho các chương trình được giao."
        breadcrumbs={[{ label: "Chương trình phụ trách" }]}
      />

      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex items-center justify-between border-b border-border bg-background/70 px-6 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              <span className="font-mono font-bold text-foreground">{totalCount}</span>{" "}
              chương trình
            </p>
            <p className="text-xs text-muted-foreground">
              Ưu tiên: Chờ quyết định → Góp ý chưa đọc → Nháp đánh giá
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

          <div className="p-6">
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
