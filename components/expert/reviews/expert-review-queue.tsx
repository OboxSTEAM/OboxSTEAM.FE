"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";

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
import {
  getProgramReviewQueue,
  type ProgramReviewQueueItem,
} from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
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
      }).format(date);
}

export function ExpertReviewQueue() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, markLoading } = useClientFetch({
    fetcher: () => getProgramReviewQueue({ page, pageSize: PAGE_SIZE }),
    deps: [page],
    onError: (error) => showAppErrorFromUnknown(error, "expert.review.queue"),
  });

  const totalPages = data?.data?.totalPages ?? 1;
  const totalCount = data?.data?.totalCount ?? 0;

  const programs = useMemo(() => {
    const items = data?.data?.items ?? [];
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return items;
    return items.filter((program) =>
      `${program.name} ${program.code} ${program.frameworkName}`
        .toLocaleLowerCase("vi")
        .includes(keyword),
    );
  }, [data?.data?.items, search]);

  const columns: ColumnDef<ProgramReviewQueueItem>[] = [
    {
      header: "Chương trình",
      render: (program) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {program.name || "Chưa đặt tên"}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {program.code || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Trạng thái",
      className: "w-36",
      render: (program) => (
        <Badge
          variant="secondary"
          className="rounded-md bg-amber-500/10 text-[11px] font-medium text-amber-700 dark:text-amber-400"
        >
          {PROGRAM_STATUS_LABELS[program.status] ?? program.status}
        </Badge>
      ),
    },
    {
      header: "Khung áp dụng",
      className: "max-w-56",
      render: (program) =>
        program.frameworkId || program.frameworkName ? (
          <Badge
            variant="secondary"
            className="max-w-52 truncate rounded-md bg-muted text-[11px] font-medium text-foreground"
          >
            {program.frameworkName || "Khung đã gán"}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Chưa gán khung</span>
        ),
    },
    {
      header: "Gửi duyệt",
      className: "w-28 tabular-nums",
      render: (program) => formatDate(program.updatedAt ?? program.createdAt),
    },
    {
      header: "Thao tác",
      className: "w-32 text-right",
      render: (program) => (
        <div className="flex justify-end">
          <Button
            nativeButton={false}
            render={<Link href={`/expert/reviews/${program.id}`} />}
            variant="outline"
            className="h-9 gap-1.5 rounded-lg border-border px-3 text-xs font-semibold"
          >
            Thẩm định
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Duyệt chương trình"
        description="Hàng chờ curriculum cần chuyên gia thẩm định và phê duyệt."
        breadcrumbs={[{ label: "Duyệt chương trình" }]}
      />

      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex items-center justify-between border-b border-border bg-background/70 px-6 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              <span className="font-mono font-bold text-foreground">
                {totalCount}
              </span>{" "}
              chương trình đang chờ duyệt
            </p>
            <p className="text-xs text-muted-foreground">
              Chấm rubric theo khung được gán trước khi phê duyệt.
            </p>
          </div>

          <ManagerFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm theo tên, mã hoặc khung…"
            showClear={search !== ""}
            onClearFilters={() => setSearch("")}
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
                  icon={ClipboardCheck}
                  title="Chưa có chương trình cần duyệt"
                  description="Khi Manager gửi chương trình sang hội đồng chuyên gia, hàng chờ duyệt sẽ xuất hiện tại đây."
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
