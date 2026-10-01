"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck } from "lucide-react";

import { ExpertWorkbenchHero } from "@/components/expert/shared/expert-workbench";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { ProgramPagination } from "@/components/programs/program-pagination";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { getAdvisoryMine, type AdvisoryMineItem, type ProgramStatus } from "@/lib/api";
import { PIN_STATUS_BADGE_CLASSES } from "@/lib/advisory/pin-actions";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { PROGRAM_STATUS_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
const SKELETON_CARDS = 6;

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

const STATUS_TONE: Partial<Record<ProgramStatus, string>> = {
  Approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Active: "bg-primary/10 text-primary",
};

const APPROVAL_COPY: Record<AdvisoryMineItem["approvalState"], { label: string; tone: string }> = {
  None: { label: "Chưa chấp thuận", tone: "bg-muted text-muted-foreground" },
  Approved: {
    label: "Đã chấp thuận",
    tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  Revoked: {
    label: "Chấp thuận đã bị huỷ",
    tone: "bg-amber-500/12 text-amber-800 dark:text-amber-300",
  },
};

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

  const totalCount = data?.data?.totalCount ?? 0;
  const programs = useMemo(() => {
    const items = data?.data?.items ?? [];
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return items;
    return items.filter((item) =>
      `${item.name} ${item.code}`.toLocaleLowerCase("vi").includes(keyword),
    );
  }, [data?.data?.items, search]);

  function changePage(nextPage: number) {
    markLoading();
    setPage(nextPage);
  }

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
            showClear={search !== "" || filter !== "all"}
            onClearFilters={() => {
              markLoading();
              setSearch("");
              setFilter("all");
              setPage(1);
            }}
          />

          <div className="p-4 sm:p-5">
            {isLoading ? (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
                {Array.from({ length: SKELETON_CARDS }, (_, index) => (
                  <li key={index}>
                    <ProgramCardSkeleton />
                  </li>
                ))}
              </ul>
            ) : programs.length === 0 ? (
              <ManagerEmptyState
                icon={GraduationCap}
                title={filter === "all" && !search ? "Chưa có chương trình phụ trách" : "Không có chương trình phù hợp"}
                description={
                  filter === "all" && !search
                    ? "Khi được gán làm chuyên gia phụ trách hoặc tham gia hội đồng, chương trình sẽ hiển thị tại đây."
                    : "Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm."
                }
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {programs.map((item) => (
                  <li key={item.programId}>
                    <ProgramCard item={item} />
                  </li>
                ))}
              </ul>
            )}

            {!isLoading && data?.data ? (
              <ProgramPagination
                theme="light"
                className="mt-6"
                currentPage={data.data.currentPage}
                totalPages={data.data.totalPages}
                hasPrevious={data.data.hasPrevious}
                hasNext={data.data.hasNext}
                onPageChange={changePage}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgramCard({ item }: { item: AdvisoryMineItem }) {
  const approval = APPROVAL_COPY[item.approvalState];
  const isApprovalImplied = item.status === "Approved" && item.approvalState === "Approved";
  const updatedAt = formatApiDateTimeDisplay(item.latestActivityAt);

  return (
    <Link
      href={`/expert/programs/${item.programId}`}
      className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-background p-4 outline-none transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[0_6px_20px_rgba(45,45,45,0.06)] focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate font-mono text-[11px] font-semibold text-muted-foreground">
          {item.code || "Chưa có mã"}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
            item.isAdvisor ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {item.isAdvisor ? "Phụ trách" : "Hội đồng"}
        </span>
      </div>

      <p className="line-clamp-2 font-semibold leading-snug text-foreground">
        {item.name || "Chương trình chưa đặt tên"}
      </p>

      <div className="flex flex-wrap gap-1.5">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            STATUS_TONE[item.status] ?? "bg-muted text-muted-foreground",
          )}
        >
          {PROGRAM_STATUS_LABELS[item.status]}
        </span>
        {isApprovalImplied ? null : (
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", approval.tone)}>
            {approval.label}
          </span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border pt-3 text-[11px]">
        {item.unreadCount > 0 ? (
          <span className="rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground tabular-nums">
            {item.unreadCount} tin chưa đọc
          </span>
        ) : null}
        {item.openPinCount > 0 ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-semibold tabular-nums",
              PIN_STATUS_BADGE_CLASSES.Open,
            )}
          >
            {item.openPinCount} mục cần sửa
          </span>
        ) : null}
        <span className="ml-auto text-muted-foreground tabular-nums">
          {item.frameworkVersionNumber != null ? `Khung v${item.frameworkVersionNumber}` : "Chưa gắn khung"}
          {updatedAt ? ` · ${updatedAt}` : ""}
        </span>
      </div>
    </Link>
  );
}

function ProgramCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-background p-4">
      <div className="flex justify-between gap-3">
        <div className="h-3 w-20 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
      <div className="h-5 w-4/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="flex gap-1.5">
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
        <div className="h-5 w-24 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      </div>
      <div className="mt-auto flex justify-between border-t border-border pt-3">
        <div className="h-4 w-24 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
        <div className="h-3 w-28 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}
