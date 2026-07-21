"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Eye,
  Pencil,
  Play,
  Plus,
  UsersRound,
} from "lucide-react";

import {
  ClassFormDialog,
  type ClassFormSubmitPayload,
} from "@/components/manager/classes/class-form-dialog";
import { ClassStatusBadge } from "@/components/manager/classes/class-status-badge";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Button } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  completeClass,
  getClasses,
  getPrograms,
  openClass,
  startClass,
  updateClass,
  type Class,
  type ClassListQuery,
  type ClassStatus,
} from "@/lib/api";
import {
  CLASS_STATUS_LABELS,
  getNextClassLifecycleAction,
} from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

type SortValue =
  | "createdAt-desc"
  | "createdAt-asc"
  | "name-asc"
  | "code-asc"
  | "startDate-asc"
  | "startDate-desc";

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Mới tạo" },
  { value: "createdAt-asc", label: "Cũ nhất" },
  { value: "name-asc", label: "Tên A–Z" },
  { value: "code-asc", label: "Mã A–Z" },
  { value: "startDate-asc", label: "Ngày bắt đầu ↑" },
  { value: "startDate-desc", label: "Ngày bắt đầu ↓" },
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
    ClassListQuery["sortBy"],
    "asc" | "desc",
  ];
  return { sortBy, isDescending: direction === "desc" };
}

type LifecycleTarget = {
  classItem: Class;
  action: "open" | "start" | "complete";
  label: string;
};

type ClassManagerProps = {
  fixedProgramId?: string;
  embedded?: boolean;
};

export function ClassManager({
  fixedProgramId,
  embedded = false,
}: ClassManagerProps = {}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [sort, setSort] = useState<SortValue>("createdAt-desc");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [lifecycleTarget, setLifecycleTarget] = useState<LifecycleTarget | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const programId = fixedProgramId ?? programFilter;

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: async () =>
      getClasses(
        {
          search: debouncedSearch || undefined,
          status: status === "all" ? undefined : (status as ClassStatus),
          programId:
            programId === "all" || !programId ? undefined : programId,
          ...toSortQuery(sort),
          page,
          pageSize: 10,
        },
        { includeSeatsTaken: true },
      ),
    deps: [debouncedSearch, status, programId, sort, page],
    onError: (error) => showAppErrorFromUnknown(error, "classes.list"),
  });

  const { data: programsData, isLoading: isProgramsLoading } = useClientFetch({
    fetcher: () =>
      getPrograms({
        sortBy: "name",
        page: 1,
        pageSize: 100,
      }),
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "programs.list"),
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const classes = data?.data?.items ?? [];
  const programs = useMemo(
    () => programsData?.data?.items ?? [],
    [programsData?.data?.items],
  );
  const totalPages = data?.data?.totalPages ?? 1;
  const totalCount = data?.data?.totalCount ?? 0;

  const programNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const program of programs) {
      map.set(program.id, program.name);
    }
    return map;
  }, [programs]);

  const programFilterOptions = useMemo(
    () => [
      { value: "all", label: "Mọi chương trình" },
      ...programs.map((program) => ({
        value: program.id,
        label: program.name,
      })),
    ],
    [programs],
  );

  function handleSearchChange(value: string) {
    markLoading();
    setSearch(value);
    setPage(1);
  }

  function openEdit(classItem: Class) {
    setEditingClass(classItem);
    setFormOpen(true);
  }

  async function handleSubmit(values: ClassFormSubmitPayload) {
    setIsSubmitting(true);
    try {
      if (editingClass) {
        // Preserve the class's assigned mentor — BE has no mentor-list API yet,
        // so the form cannot reassign it.
        await updateClass(editingClass.id, {
          ...values,
          mentorId: editingClass.mentorId,
        });
        showAppSuccess({
          title: "Đã cập nhật lớp học",
          description: `Lớp ${values.name} đã được lưu.`,
        });
      } else {
        // Blocked until BE ships a mentor-list API (create requires a real mentorId).
        showAppErrorFromUnknown(
          new Error("Missing mentor list API"),
          "classes.create",
        );
        return;
      }
      setFormOpen(false);
      setEditingClass(null);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(
        error,
        editingClass ? "classes.update" : "classes.create",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLifecycle() {
    if (!lifecycleTarget) return;
    const { classItem, action, label } = lifecycleTarget;
    try {
      if (action === "open") await openClass(classItem.id);
      else if (action === "start") await startClass(classItem.id);
      else await completeClass(classItem.id);

      showAppSuccess({
        title: "Đã cập nhật trạng thái",
        description: `${label} cho lớp ${classItem.name || classItem.code}.`,
      });
      setLifecycleTarget(null);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "classes.lifecycle");
      throw error;
    }
  }

  const columns: ColumnDef<Class>[] = [
    {
      header: "Lớp học",
      render: (classItem) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#2D2D2D]">
            {classItem.name || "Chưa đặt tên"}
          </p>
          <p className="font-mono text-xs text-[#6B6B6B]">{classItem.code}</p>
        </div>
      ),
    },
    {
      header: "Chương trình",
      className: "max-w-48",
      render: (classItem) => (
        <span className="block truncate text-sm text-[#2D2D2D]">
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
      className: "min-w-40 text-xs text-[#6B6B6B]",
      render: (classItem) => (
        <div className="space-y-0.5">
          <p>{formatApiDateTimeDisplay(classItem.startDate) || "—"}</p>
          <p>→ {formatApiDateTimeDisplay(classItem.endDate) || "—"}</p>
        </div>
      ),
    },
    {
      header: "Thao tác",
      className: "w-44 text-right",
      render: (classItem) => {
        const next = getNextClassLifecycleAction(classItem.status);
        return (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              nativeButton={false}
              render={<Link href={`/manager/classes/${classItem.id}`} />}
              aria-label={`Xem ${classItem.name}`}
              className="size-9 rounded-lg text-[#6B6B6B] hover:bg-[#4FC3F7]/10 hover:text-[#0D6E9C]"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              nativeButton={false}
              render={
                <Link href={`/manager/sessions?classId=${classItem.id}`} />
              }
              aria-label={`Lịch học ${classItem.name}`}
              className="size-9 rounded-lg text-[#6B6B6B] hover:bg-[#FDD835]/25 hover:text-[#8A7200]"
            >
              <CalendarDays className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => openEdit(classItem)}
              aria-label={`Sửa ${classItem.name}`}
              className="size-9 rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]"
            >
              <Pencil className="size-4" />
            </Button>
            {next ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setLifecycleTarget({
                    classItem,
                    action: next.action,
                    label: next.label,
                  })
                }
                aria-label={next.label}
                className="size-9 rounded-lg text-[#7CB342] hover:bg-[#7CB342]/10 hover:text-[#3d5c22]"
              >
                <Play className="size-4" />
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  const filters = [
    {
      key: "status",
      placeholder: "Trạng thái",
      value: status,
      onChange: (value: string) => {
        markLoading();
        setStatus(value || "all");
        setPage(1);
      },
      options: STATUS_FILTER_OPTIONS,
    },
    ...(!fixedProgramId
      ? [
          {
            key: "program",
            placeholder: "Chương trình",
            value: programId,
            onChange: (value: string) => {
              markLoading();
              setProgramFilter(value || "all");
              setPage(1);
            },
            options: programFilterOptions,
            wide: true,
          },
        ]
      : []),
    {
      key: "sort",
      placeholder: "Sắp xếp",
      value: sort,
      onChange: (value: string) => {
        markLoading();
        setSort((value as SortValue) || "createdAt-desc");
        setPage(1);
      },
      options: SORT_OPTIONS,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {!embedded ? (
        <ManagerPageHeader
          title="Quản lý lớp học"
          description="Tạo lớp cohort, mở tuyển sinh và theo dõi sĩ số theo chương trình."
          breadcrumbs={[{ label: "Lớp học" }]}
        >
          <Button
            type="button"
            disabled
            title="Tạm khóa: chờ backend bổ sung API danh sách Mentor để gán mentor cho lớp"
            className="h-11 gap-2 rounded-xl bg-[#E94B3C] px-5 font-semibold text-white hover:bg-[#D94134] active:scale-[0.98] disabled:opacity-50"
          >
            <Plus className="size-4" />
            Tạo lớp
          </Button>
        </ManagerPageHeader>
      ) : null}

      <div className={embedded ? "pb-4" : "px-6 pb-12"}>
        <div className="overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] bg-[#FAFAF5]/70 px-6 py-3">
            <p className="text-xs font-medium text-[#6B6B6B]">
              <span className="font-mono font-bold text-[#2D2D2D]">
                {totalCount}
              </span>{" "}
              lớp học
            </p>
            {embedded ? (
              <Button
                type="button"
                disabled
                title="Tạm khóa: chờ backend bổ sung API danh sách Mentor để gán mentor cho lớp"
                className="h-9 gap-2 rounded-lg bg-[#E94B3C] px-4 font-semibold text-white hover:bg-[#D94134] active:scale-[0.98] disabled:opacity-50"
              >
                <Plus className="size-4" />
                Tạo lớp
              </Button>
            ) : (
              <p className="hidden text-xs text-[#6B6B6B] sm:block">
                Tạo lớp tạm khóa — chờ API danh sách Mentor từ backend
              </p>
            )}
          </div>
          <ManagerFilterBar
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Tìm theo tên hoặc mã lớp..."
            filters={filters}
            showClear={
              search !== "" ||
              status !== "all" ||
              (!fixedProgramId && programFilter !== "all") ||
              sort !== "createdAt-desc"
            }
            onClearFilters={() => {
              markLoading();
              setSearch("");
              setDebouncedSearch("");
              setStatus("all");
              if (!fixedProgramId) setProgramFilter("all");
              setSort("createdAt-desc");
              setPage(1);
            }}
          />
          <div className="overflow-x-auto p-6">
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
              emptyState={
                <ManagerEmptyState
                  title="Chưa có lớp học phù hợp"
                  description="Thử đổi bộ lọc. Tạo lớp đang tạm khóa cho đến khi backend bổ sung API danh sách Mentor."
                  icon={UsersRound}
                />
              }
            />
          </div>
        </div>
      </div>

      <ClassFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingClass(null);
        }}
        classItem={editingClass}
        programs={programs}
        isProgramsLoading={isProgramsLoading}
        isSubmitting={isSubmitting}
        defaultProgramId={fixedProgramId}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={lifecycleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setLifecycleTarget(null);
        }}
        onConfirm={handleLifecycle}
        title={lifecycleTarget?.label ?? "Chuyển trạng thái?"}
        description={`Xác nhận “${lifecycleTarget?.label ?? ""}” cho lớp “${lifecycleTarget?.classItem.name || lifecycleTarget?.classItem.code || ""}”.`}
        confirmLabel={lifecycleTarget?.label ?? "Xác nhận"}
      />
    </div>
  );
}
