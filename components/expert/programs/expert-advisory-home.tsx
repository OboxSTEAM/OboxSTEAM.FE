"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";

import { ExpertWorkbenchHero } from "@/components/expert/shared/expert-workbench";
import { ManagerDataTable, type ColumnDef } from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { getAdvisoryMine, type AdvisoryMineItem, type ProgramStatus } from "@/lib/api";
import { PIN_STATUS_BADGE_CLASSES } from "@/lib/advisory/pin-actions";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { PROGRAM_STATUS_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const FILTER_OPTIONS: {
  value: string;
  label: string;
  status?: ProgramStatus;
  unreadOnly?: boolean;
}[] = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Có tin chưa đọc", unreadOnly: true },
  { value: "Draft", label: "Bản nháp", status: "Draft" },
  { value: "Approved", label: "Đã chấp thuận", status: "Approved" },
  { value: "Active", label: "Đang mở", status: "Active" },
  { value: "Inactive", label: "Ngừng hoạt động", status: "Inactive" },
];

const APPROVAL_COPY: Record<AdvisoryMineItem["approvalState"], { label: string; tone: string }> = {
  None: { label: "Chưa chấp thuận", tone: "text-muted-foreground" },
  Approved: { label: "Đã chấp thuận", tone: "text-emerald-700 dark:text-emerald-300" },
  Revoked: { label: "Chấp thuận đã bị huỷ", tone: "text-amber-800 dark:text-amber-300" },
};

const COLUMNS: ColumnDef<AdvisoryMineItem>[] = [
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
    className: "w-32",
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
    className: "w-44",
    render: (item) => {
      const approval = APPROVAL_COPY[item.approvalState];
      const isApprovalImplied = item.status === "Approved" && item.approvalState === "Approved";
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-foreground">{PROGRAM_STATUS_LABELS[item.status]}</span>
          {isApprovalImplied ? null : (
            <span className={cn("text-[11px] font-medium", approval.tone)}>{approval.label}</span>
          )}
        </div>
      );
    },
  },
  {
    header: "Trao đổi",
    className: "w-44 whitespace-normal",
    render: (item) => {
      if (item.unreadCount === 0 && item.openPinCount === 0) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      return (
        <div className="flex flex-wrap items-center gap-1">
          {item.unreadCount > 0 ? (
            <Badge className="rounded-md bg-primary text-[11px] font-semibold tabular-nums text-primary-foreground">
              {item.unreadCount} chưa đọc
            </Badge>
          ) : null}
          {item.openPinCount > 0 ? (
            <Badge
              className={cn(
                "rounded-md text-[11px] font-semibold tabular-nums",
                PIN_STATUS_BADGE_CLASSES.Open,
              )}
            >
              {item.openPinCount} cần sửa
            </Badge>
          ) : null}
        </div>
      );
    },
  },
  {
    header: "Khung",
    className: "w-24 tabular-nums",
    render: (item) => (
      <span className="font-mono text-sm font-semibold text-foreground">
        {item.frameworkVersionNumber != null ? `v${item.frameworkVersionNumber}` : "—"}
      </span>
    ),
  },
  {
    header: "Cập nhật",
    className: "w-40",
    render: (item) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {formatApiDateTimeDisplay(item.latestActivityAt) || "—"}
      </span>
    ),
  },
  {
    header: "Thao tác",
    className: "w-28 text-right",
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

/** Expert home: programs the viewer advises or sits on the board for, from `advisory-mine`. */
export function ExpertAdvisoryHome() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filterConfig = FILTER_OPTIONS.find((option) => option.value === filter);

  const { data, isLoading, markLoading } = useClientFetch({
    fetcher: () =>
      getAdvisoryMine({
        page,
        pageSize: PAGE_SIZE,
        status: filterConfig?.status,
        unreadOnly: filterConfig?.unreadOnly,
      }),
    deps: [page, filter],
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

  const isFiltered = filter !== "all" || search !== "";

  return (
    <div className="flex flex-col gap-6">
      <ExpertWorkbenchHero
        eyebrow="Bàn cố vấn chương trình"
        title="Chương trình phụ trách"
        description="Đọc khung chương trình, trao đổi với manager ngay trên từng mục và chấp thuận khi chương trình đạt yêu cầu."
        icon={ShieldCheck}
      />

      <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex flex-col gap-1 border-b border-border bg-background/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">Danh sách cố vấn</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Mở chương trình để xem khung, trò chuyện và chấp thuận.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono font-bold text-foreground">{totalCount}</span> chương trình
            </p>
          </div>

          <ManagerFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm theo tên hoặc mã…"
            filters={[
              {
                key: "status",
                placeholder: "Lọc",
                value: filter,
                onChange: (value) => {
                  markLoading();
                  setFilter(value || "all");
                  setPage(1);
                },
                options: FILTER_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                })),
              },
            ]}
            showClear={isFiltered}
            onClearFilters={() => {
              markLoading();
              setSearch("");
              setFilter("all");
              setPage(1);
            }}
          />

          <div className="p-4 sm:p-5">
            <ManagerDataTable
              columns={COLUMNS}
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
                  title={isFiltered ? "Không có chương trình phù hợp" : "Chưa có chương trình phụ trách"}
                  description={
                    isFiltered
                      ? "Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm."
                      : "Khi được gán làm chuyên gia phụ trách hoặc tham gia hội đồng, chương trình sẽ hiển thị tại đây."
                  }
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
