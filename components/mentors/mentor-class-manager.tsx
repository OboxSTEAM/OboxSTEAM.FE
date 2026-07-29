"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, UsersRound } from "lucide-react";

import { ClassStatusBadge } from "@/components/manager/classes/class-status-badge";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getClasses,
  getMyMentorProfile,
  getPrograms,
  type Class,
  type ClassListQuery,
  type ClassStatus,
} from "@/lib/api";
import { CLASS_STATUS_LABELS } from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown } from "@/lib/errors";

type SortValue =
  | "startDate-desc"
  | "startDate-asc"
  | "name-asc"
  | "code-asc"
  | "createdAt-desc";

const SORT_OPTIONS = [
  { value: "startDate-desc", label: "Ngày bắt đầu ↓" },
  { value: "startDate-asc", label: "Ngày bắt đầu ↑" },
  { value: "name-asc", label: "Tên A–Z" },
  { value: "code-asc", label: "Mã A–Z" },
  { value: "createdAt-desc", label: "Mới nhất" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Mọi trạng thái" },
  ...(Object.keys(CLASS_STATUS_LABELS) as ClassStatus[]).map((status) => ({
    value: status,
    label: CLASS_STATUS_LABELS[status],
  })),
];

function toSortQuery(
  sort: SortValue,
): Pick<ClassListQuery, "sortBy" | "isDescending"> {
  const [sortBy, direction] = sort.split("-") as [
    NonNullable<ClassListQuery["sortBy"]>,
    "asc" | "desc",
  ];
  return { sortBy, isDescending: direction === "desc" };
}

export function MentorClassManager() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [sort, setSort] = useState<SortValue>("startDate-desc");
  const [page, setPage] = useState(1);

  const {
    data: mentorProfile,
    isLoading: isMentorLoading,
  } = useClientFetch({
    fetcher: async () => {
      const result = await getMyMentorProfile();
      return result?.data ?? null;
    },
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "mentors.detail"),
  });

  const mentorId = mentorProfile?.id ?? null;

  const { data: programsData } = useClientFetch({
    fetcher: () =>
      getPrograms({
        sortBy: "name",
        page: 1,
        pageSize: 100,
      }),
    deps: [],
    onError: () => undefined,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const sortQuery = toSortQuery(sort);

  const { data, isLoading, markLoading } = useClientFetch({
    enabled: mentorId != null,
    fetcher: async () => {
      if (!mentorId) return null;
      return getClasses(
        {
          mentorId,
          search: debouncedSearch || undefined,
          status: status === "all" ? undefined : (status as ClassStatus),
          programId: programFilter === "all" ? undefined : programFilter,
          page,
          pageSize: 20,
          sortBy: sortQuery.sortBy,
          isDescending: sortQuery.isDescending,
        },
        { includeSeatsTaken: true },
      );
    },
    deps: [mentorId, debouncedSearch, status, programFilter, page, sort],
    onError: (error) => showAppErrorFromUnknown(error, "classes.list"),
  });

  const classes = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const programs = programsData?.data?.items ?? [];

  const programNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const program of programs) {
      map.set(program.id, program.name?.trim() || program.code?.trim() || "—");
    }
    return map;
  }, [programs]);

  const programFilterOptions = useMemo(
    () => [
      { value: "all", label: "Mọi chương trình" },
      ...programs.map((program) => ({
        value: program.id,
        label: program.name?.trim() || program.code?.trim() || "Chương trình",
      })),
    ],
    [programs],
  );

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    programFilter !== "all" ||
    sort !== "startDate-desc";

  const columns: ColumnDef<Class>[] = [
    {
      header: "Lớp học",
      sticky: "left",
      className: "min-w-44 max-w-56",
      render: (classItem) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {classItem.name || "Chưa đặt tên"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {classItem.code}
          </p>
        </div>
      ),
    },
    {
      header: "Chương trình",
      className: "max-w-48",
      render: (classItem) => (
        <span className="block truncate text-sm text-foreground">
          {programNameById.get(classItem.programId) ?? "—"}
        </span>
      ),
    },
    {
      header: "Trạng thái",
      className: "w-36",
      render: (classItem) => <ClassStatusBadge status={classItem.status} />,
    },
    {
      header: "Sĩ số",
      className: "w-24 font-mono tabular-nums",
      render: (classItem) =>
        `${classItem.seatsTaken}/${classItem.maxCapacity}`,
    },
    {
      header: "Thời gian",
      className: "min-w-40 text-xs text-muted-foreground",
      render: (classItem) => (
        <div className="space-y-0.5">
          <p>{formatApiDateTimeDisplay(classItem.startDate) || "—"}</p>
          <p>→ {formatApiDateTimeDisplay(classItem.endDate) || "—"}</p>
        </div>
      ),
    },
    {
      header: "Thao tác",
      sticky: "right",
      className: "w-24 text-right",
      render: (classItem) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href={`/mentor/classes/${classItem.id}`} />}
          aria-label={`Xem ${classItem.name}`}
          className="size-9 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
        >
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  if (isMentorLoading && !mentorId) {
    return (
      <div className="flex flex-col gap-6">
        <ManagerPageHeader
          title="Lớp của tôi"
          description="Các lớp bạn đã được gán để giảng dạy."
        />
        <div className="space-y-3 px-6 pb-12">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!mentorId) {
    return (
      <div className="flex flex-col gap-6">
        <ManagerPageHeader
          title="Lớp của tôi"
          description="Các lớp bạn đã được gán để giảng dạy."
        />
        <div className="px-6 pb-12">
          <ManagerEmptyState
            title="Chưa có hồ sơ mentor"
            description="Không tải được hồ sơ mentor. Thử lại sau hoặc liên hệ quản lý."
            icon={UsersRound}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <ManagerPageHeader
        title="Lớp của tôi"
        description="Các lớp bạn đã được gán để giảng dạy."
      >
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/mentor/board" />}
          className="h-10 rounded-lg border-border"
        >
          Tìm lớp mới
        </Button>
      </ManagerPageHeader>

      <ManagerFilterBar
        searchValue={search}
        onSearchChange={(value) => {
          markLoading();
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Tìm theo tên hoặc mã lớp..."
        filters={[
          {
            key: "status",
            placeholder: "Trạng thái",
            value: status,
            onChange: (value) => {
              markLoading();
              setStatus(value);
              setPage(1);
            },
            options: STATUS_FILTER_OPTIONS,
          },
          {
            key: "program",
            placeholder: "Chương trình",
            value: programFilter,
            onChange: (value) => {
              markLoading();
              setProgramFilter(value);
              setPage(1);
            },
            options: programFilterOptions,
            wide: true,
          },
          {
            key: "sort",
            placeholder: "Sắp xếp",
            value: sort,
            onChange: (value) => {
              markLoading();
              setSort(value as SortValue);
              setPage(1);
            },
            options: SORT_OPTIONS,
          },
        ]}
        showClear={hasActiveFilters}
        onClearFilters={() => {
          markLoading();
          setSearch("");
          setDebouncedSearch("");
          setStatus("all");
          setProgramFilter("all");
          setSort("startDate-desc");
          setPage(1);
        }}
      />

      <div className="flex-1 px-6 py-6">
        {!isLoading && classes.length === 0 ? (
          <ManagerEmptyState
            title="Chưa được gán lớp nào"
            description="Khi quản lý duyệt yêu cầu đăng ký của bạn, lớp sẽ xuất hiện tại đây."
            icon={UsersRound}
            actionLabel="Xem bảng lớp"
            actionHref="/mentor/board"
          />
        ) : (
          <ManagerDataTable
            columns={columns}
            data={classes}
            isLoading={isLoading}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => {
              markLoading();
              setPage(nextPage);
            }}
          />
        )}
      </div>
    </div>
  );
}
