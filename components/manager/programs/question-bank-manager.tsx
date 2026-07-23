"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Database,
  Edit2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { CreateQuestionBankDialog } from "@/components/manager/programs/create-question-bank-dialog";
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
  deleteQuestionBank,
  getProgramsWithModules,
  getQuestionBanks,
  hydrateProgramCurriculum,
  type QuestionBankListItem,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { questionBankEditHref } from "@/lib/manager/curriculum-catalog";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "updatedAt", label: "Cập nhật" },
  { value: "name", label: "Tên ngân hàng" },
  { value: "createdAt", label: "Ngày tạo" },
  { value: "courseName", label: "Khóa học" },
  { value: "programName", label: "Chương trình" },
  { value: "questionCount", label: "Số câu hỏi" },
];

export function QuestionBankManager() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [isDescending, setIsDescending] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<QuestionBankListItem | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: () =>
      getQuestionBanks({
        search: search.trim() || undefined,
        sortBy,
        isDescending,
        page,
        pageSize: 10,
      }),
    deps: [search, sortBy, isDescending, page],
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
  const banks = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const hasFilter = search !== "";

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteQuestionBank(deleteTarget.id);
      showAppSuccess({
        title: "Đã xóa",
        description: `Ngân hàng "${deleteTarget.name ?? ""}" đã được xóa.`,
      });
      setDeleteTarget(null);
      retry();
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.questionBank.delete");
    }
  }

  const handleSearchChange = (val: string) => {
    markLoading();
    setSearch(val);
    setPage(1);
  };

  const columns: ColumnDef<QuestionBankListItem>[] = useMemo(
    () => [
      {
        header: "Ngân hàng đề",
        className: "max-w-xs",
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#E5E5E0] bg-white text-[#7CB342]">
              <Database className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#2D2D2D]">
                {row.name ?? "—"}
              </p>
              <p className="truncate text-[11px] text-[#6B6B6B]">
                {row.moduleName ?? "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "Câu hỏi",
        render: (row) => (
          <span className="tabular-nums text-[#2D2D2D]">
            {row.questionCount ?? 0}
          </span>
        ),
      },
      {
        header: "Khóa học",
        className: "max-w-[180px] truncate text-[#2D2D2D]",
        render: (row) => row.courseName ?? "—",
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
              render={<Link href={questionBankEditHref(row)} />}
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
              title="Xóa ngân hàng"
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
        title="Ngân hàng câu hỏi"
        description="Danh sách ngân hàng đề theo khóa học. Import CSV trong khung chương trình."
        breadcrumbs={[{ label: "Ngân hàng câu hỏi" }]}
      >
        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="h-11 gap-2 rounded-xl bg-[#E94B3C] px-5 font-semibold text-white hover:bg-[#D94134] active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Tạo ngân hàng
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
                placeholder="Tìm theo tên, khóa học, chương trình…"
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
                  value={sortBy}
                  onValueChange={(val) => {
                    markLoading();
                    setSortBy(val ?? "updatedAt");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={LIGHT_SELECT_TRIGGER}>
                    <span className="truncate">
                      Sắp xếp:{" "}
                      {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ??
                        "Cập nhật"}
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
              data={banks}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(next) => {
                markLoading();
                setPage(next);
              }}
              emptyState={
                <ManagerEmptyState
                  icon={Database}
                  title="Chưa có ngân hàng đề"
                  description="Tạo ngân hàng ngay trên trang này, hoặc trong khung chương trình → khóa học."
                  actionLabel="Tạo ngân hàng"
                  onAction={() => setCreateOpen(true)}
                />
              }
            />
          </div>
        </div>
      </div>

      <CreateQuestionBankDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        programs={programs}
        onCreated={() => retry()}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa ngân hàng đề"
        description={`Xóa "${deleteTarget?.name ?? ""}" và toàn bộ câu hỏi?`}
        confirmLabel="Xóa bỏ"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </div>
  );
}
