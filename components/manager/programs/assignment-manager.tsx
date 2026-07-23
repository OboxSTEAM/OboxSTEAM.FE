"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ClipboardList,
  Edit2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { CreateAssignmentDialog } from "@/components/manager/programs/create-assignment-dialog";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  deleteAssignment,
  getAssignments,
  getProgramsWithModules,
  hydrateProgramCurriculum,
  type AssignmentListItem,
  type AssignmentTypeInput,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { assignmentEditHref } from "@/lib/manager/curriculum-catalog";

const TYPE_LABELS: Record<string, string> = {
  Quiz: "Trắc nghiệm",
  Retrospective: "Nhật ký phản tư",
  FileUpload: "Nộp tệp",
};

const TYPE_ORDER: Array<"all" | AssignmentTypeInput> = [
  "all",
  "Quiz",
  "Retrospective",
  "FileUpload",
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "createdAt", label: "Ngày tạo" },
  { value: "title", label: "Tiêu đề" },
  { value: "code", label: "Mã" },
  { value: "dueDate", label: "Hạn nộp" },
  { value: "assignmentType", label: "Loại" },
  { value: "moduleName", label: "Module" },
  { value: "programName", label: "Chương trình" },
];

export function AssignmentManager() {
  const [search, setSearch] = useState("");
  const [assignmentType, setAssignmentType] = useState<"all" | AssignmentTypeInput>(
    "all",
  );
  const [sortBy, setSortBy] = useState("createdAt");
  const [isDescending, setIsDescending] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentListItem | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: () =>
      getAssignments({
        search: search.trim() || undefined,
        assignmentType: assignmentType === "all" ? undefined : assignmentType,
        sortBy,
        isDescending,
        page,
        pageSize: 10,
      }),
    deps: [search, assignmentType, sortBy, isDescending, page],
    onError: (error) => showAppErrorFromUnknown(error, "programs.list"),
  });

  const { data: programsData } = useClientFetch({
    fetcher: async () => {
      const result = await getProgramsWithModules({ page: 1, pageSize: 100 });
      const items = result?.data?.items ?? [];
      const hydrated = await Promise.all(
        items.map((p) => hydrateProgramCurriculum(p)),
      );
      return { data: { items: hydrated } };
    },
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "programs.list"),
  });

  const programs = programsData?.data?.items ?? [];
  const assignments = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const hasFilter = search !== "" || assignmentType !== "all";

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteAssignment(deleteTarget.id);
      showAppSuccess({
        title: "Đã xóa",
        description: `Bài tập "${deleteTarget.title ?? ""}" đã được xóa.`,
      });
      setDeleteTarget(null);
      retry();
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.node.delete");
    }
  }

  const handleSearchChange = (val: string) => {
    markLoading();
    setSearch(val);
    setPage(1);
  };

  const columns: ColumnDef<AssignmentListItem>[] = useMemo(
    () => [
      {
        header: "Bài tập",
        className: "max-w-xs",
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#E5E5E0] bg-white text-[#f59e0b]">
              <ClipboardList className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#2D2D2D]">
                {row.title ?? "—"}
              </p>
              <p className="truncate text-[11px] text-[#6B6B6B]">
                {row.code || "Không mã"}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "Loại",
        render: (row) => (
          <span className="inline-flex rounded-full bg-[#F5F5F0] px-2.5 py-0.5 text-xs font-semibold text-[#2D2D2D]">
            {TYPE_LABELS[row.assignmentType] ?? row.assignmentType}
          </span>
        ),
      },
      {
        header: "Module",
        className: "max-w-[180px] truncate text-[#2D2D2D]",
        render: (row) => row.moduleName ?? "—",
      },
      {
        header: "Chương trình",
        className: "max-w-[180px] truncate text-[#6B6B6B]",
        render: (row) => row.programName ?? "—",
      },
      {
        header: "Thao tác",
        className: "text-right w-24",
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              render={
                <Link
                  href={assignmentEditHref(row.programId, row.moduleId, row.id)}
                />
              }
              className="size-8 rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F0]"
              title="Mở trong khung chương trình"
            >
              <Edit2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row)}
              className="size-8 rounded-lg text-[#E94B3C] hover:bg-[#E94B3C]/10"
              title="Xóa bài tập"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Bài tập"
        description="Danh sách bài tập theo module. Tạo tại đây hoặc trong khung chương trình."
        breadcrumbs={[{ label: "Bài tập" }]}
      >
        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="h-11 gap-2 rounded-xl bg-[#E94B3C] px-5 font-semibold text-white hover:bg-[#D94134] active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Tạo bài tập
        </Button>
      </ManagerPageHeader>

      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-xl border border-[#E5E5E0] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#E5E5E0] bg-white px-6 py-5">
            <div className="relative w-full">
              <Search className="absolute top-2.5 left-3.5 size-4 text-[#6B6B6B]" />
              <Input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm theo tiêu đề, mã, module, chương trình…"
                className="h-10 rounded-xl border-[#E5E5E0] bg-[#FAFAF5]/50 pr-8 pl-10 text-sm text-[#2D2D2D] focus-visible:ring-[#4FC3F7]"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute top-3 right-3 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#4FC3F7]"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="size-4 text-[#6B6B6B]" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={assignmentType}
                  onValueChange={(val) => {
                    markLoading();
                    setAssignmentType(
                      (val as "all" | AssignmentTypeInput) ?? "all",
                    );
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={LIGHT_SELECT_TRIGGER}>
                    <span className="truncate">
                      {assignmentType === "all"
                        ? "Tất cả loại bài tập"
                        : TYPE_LABELS[assignmentType]}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    className={LIGHT_SELECT_CONTENT}
                    align="start"
                    sideOffset={8}
                  >
                    {TYPE_ORDER.map((t) => (
                      <SelectItem key={t} value={t} className={LIGHT_SELECT_ITEM}>
                        {t === "all" ? "Tất cả loại bài tập" : TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    markLoading();
                    setSortBy(val ?? "createdAt");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={LIGHT_SELECT_TRIGGER}>
                    <span className="truncate">
                      Sắp xếp:{" "}
                      {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ??
                        "Ngày tạo"}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    className={LIGHT_SELECT_CONTENT}
                    align="start"
                    sideOffset={8}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem
                        key={o.value}
                        value={o.value}
                        className={LIGHT_SELECT_ITEM}
                      >
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    markLoading();
                    setIsDescending((v) => !v);
                    setPage(1);
                  }}
                  className="h-9 gap-1.5 rounded-lg border-[#E5E5E0] px-3 text-xs font-semibold text-[#2D2D2D] hover:bg-[#F5F5F0]"
                  title={isDescending ? "Đang giảm dần" : "Đang tăng dần"}
                >
                  {isDescending ? (
                    <ArrowDownWideNarrow className="size-4" />
                  ) : (
                    <ArrowUpWideNarrow className="size-4" />
                  )}
                  {isDescending ? "Giảm dần" : "Tăng dần"}
                </Button>
              </div>

              {hasFilter ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    markLoading();
                    setSearch("");
                    setAssignmentType("all");
                    setPage(1);
                  }}
                  className="h-9 gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]"
                >
                  <X className="size-3.5" />
                  Xóa bộ lọc
                </Button>
              ) : null}
            </div>
          </div>

          <div className="bg-white p-6">
            <ManagerDataTable
              columns={columns}
              data={assignments}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(next) => {
                markLoading();
                setPage(next);
              }}
              emptyState={
                <ManagerEmptyState
                  icon={ClipboardList}
                  title="Chưa có bài tập"
                  description="Tạo bài tập ngay trên trang này, hoặc trong khung chương trình → module."
                  actionLabel="Tạo bài tập"
                  onAction={() => setCreateOpen(true)}
                />
              }
            />
          </div>
        </div>
      </div>

      <CreateAssignmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        programs={programs}
        onCreated={() => retry()}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa bài tập"
        description={`Xóa "${deleteTarget?.title ?? ""}"? Hành động không thể hoàn tác.`}
        confirmLabel="Xóa bỏ"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </div>
  );
}
