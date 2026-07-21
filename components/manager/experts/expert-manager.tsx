"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Link2,
  Pencil,
  Plus,
  Trash2,
  UserRoundSearch,
} from "lucide-react";

import { ExpertProfileDialog } from "@/components/experts/expert-profile-dialog";
import { ExpertFormDialog, type ExpertFormValues } from "@/components/manager/experts/expert-form-dialog";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { ManagerDataTable, type ColumnDef } from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  createExpert,
  deleteExpert,
  getExperts,
  getPrograms,
  updateExpert,
  type Expert,
  type ExpertListQuery,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

type SortValue = "createdAt-desc" | "createdAt-asc" | "fullName-asc" | "code-asc";

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Mới cập nhật" },
  { value: "createdAt-asc", label: "Cũ nhất" },
  { value: "fullName-asc", label: "Tên A–Z" },
  { value: "code-asc", label: "Mã A–Z" },
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function toSortQuery(sort: SortValue): Pick<ExpertListQuery, "sortBy" | "isDescending"> {
  const [sortBy, direction] = sort.split("-") as [
    ExpertListQuery["sortBy"],
    "asc" | "desc",
  ];
  return { sortBy, isDescending: direction === "desc" };
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN").format(date);
}

export function ExpertManager() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortValue>("createdAt-desc");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expert | null>(null);
  const [profileExpertId, setProfileExpertId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: async () =>
      getExperts({
        search: debouncedSearch || undefined,
        ...toSortQuery(sort),
        page,
        pageSize: 10,
      }),
    deps: [debouncedSearch, sort, page],
    onError: (error) => showAppErrorFromUnknown(error, "experts.list"),
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

  const experts = data?.data?.items ?? [];
  const programs = programsData?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const totalCount = data?.data?.totalCount ?? 0;

  function handleSearchChange(value: string) {
    markLoading();
    setSearch(value);
    setPage(1);
  }

  function handleSortChange(value: string) {
    markLoading();
    setSort(value as SortValue);
    setPage(1);
  }

  function openCreate() {
    setEditingExpert(null);
    setFormOpen(true);
  }

  function openEdit(expert: Expert) {
    setEditingExpert(expert);
    setFormOpen(true);
  }

  async function handleSubmit(values: ExpertFormValues) {
    setIsSubmitting(true);
    try {
      if (editingExpert) {
        await updateExpert(editingExpert.id, values);
        showAppSuccess({
          title: "Đã cập nhật chuyên gia",
          description: `Hồ sơ của ${values.fullName} đã được lưu.`,
        });
      } else {
        await createExpert(values);
        showAppSuccess({
          title: "Đã thêm chuyên gia",
          description: `${values.fullName} đã được thêm vào danh sách.`,
        });
      }
      setFormOpen(false);
      setEditingExpert(null);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(
        error,
        editingExpert ? "experts.update" : "experts.create",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteExpert(deleteTarget.id);
      showAppSuccess({
        title: "Đã xóa chuyên gia",
        description: `${deleteTarget.fullName || deleteTarget.code} đã được xóa khỏi hệ thống.`,
      });
      setDeleteTarget(null);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "experts.delete");
      throw error;
    }
  }

  const columns: ColumnDef<Expert>[] = [
    {
      header: "Chuyên gia",
      render: (expert) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-10 border border-[#E5E5E0]">
            <AvatarImage
              src={expert.avatarUrl || undefined}
              alt={expert.fullName || expert.code}
            />
            <AvatarFallback className="bg-[#4FC3F7]/12 font-heading text-xs font-bold text-[#0D6E9C]">
              {getInitials(expert.fullName) || "CG"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#2D2D2D]">
              {expert.fullName || "Chưa cập nhật tên"}
            </p>
            <p className="truncate text-xs text-[#6B6B6B]">
              {expert.title || "Chưa cập nhật chức danh"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Mã",
      className: "w-28",
      render: (expert) => (
        <span className="font-mono text-xs font-semibold text-[#2D2D2D]">
          {expert.code || "—"}
        </span>
      ),
    },
    {
      header: "Tổ chức",
      className: "max-w-48",
      render: (expert) => (
        <span className="block truncate" title={expert.organization}>
          {expert.organization || "—"}
        </span>
      ),
    },
    {
      header: "Chương trình",
      render: (expert) =>
        expert.programs.length > 0 ? (
          <div className="flex max-w-72 flex-wrap gap-1.5">
            {expert.programs.slice(0, 2).map((program) => (
              <Badge
                key={program.programId}
                variant="secondary"
                className="max-w-36 truncate rounded-md bg-[#F5F5F0] text-[11px] font-medium text-[#4C4C48]"
                title={program.roleInBoard || program.name}
              >
                {program.code || program.name}
              </Badge>
            ))}
            {expert.programs.length > 2 ? (
              <button
                type="button"
                onClick={() => setProfileExpertId(expert.id)}
                title={expert.programs
                  .slice(2)
                  .map((program) => `${program.name}${program.roleInBoard ? ` — ${program.roleInBoard}` : ""}`)
                  .join("\n")}
                aria-label={`Xem thêm ${expert.programs.length - 2} chương trình của ${expert.fullName}`}
                className="inline-flex h-5 items-center rounded-md border border-[#CFCFC8] bg-white px-2 text-[11px] font-semibold text-[#4C4C48] transition-colors hover:border-[#4FC3F7] hover:bg-[#4FC3F7]/10 hover:text-[#0D6E9C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/40"
              >
                +{expert.programs.length - 2} chương trình
              </button>
            ) : null}
          </div>
        ) : (
          <span className="text-xs text-[#8A8A84]">Chưa gán</span>
        ),
    },
    {
      header: "Ngày tạo",
      className: "w-28 tabular-nums",
      render: (expert) => formatDate(expert.createdAt),
    },
    {
      header: "Thao tác",
      className: "w-36 text-right",
      render: (expert) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setProfileExpertId(expert.id)}
            aria-label={`Xem ${expert.fullName}`}
            className="size-9 rounded-lg text-[#6B6B6B] hover:bg-[#4FC3F7]/10 hover:text-[#0D6E9C]"
          >
            <Eye className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => openEdit(expert)}
            aria-label={`Sửa ${expert.fullName}`}
            className="size-9 rounded-lg text-[#6B6B6B] hover:bg-[#FDD835]/25 hover:text-[#8A7200]"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(expert)}
            aria-label={`Xóa ${expert.fullName}`}
            className="size-9 rounded-lg text-[#E94B3C] hover:bg-[#E94B3C]/10 hover:text-[#C9362B]"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Quản lý chuyên gia"
        description="Quản lý hồ sơ chuyên môn và hội đồng chuyên gia của các chương trình."
        breadcrumbs={[{ label: "Chuyên gia" }]}
      >
        <Button
          type="button"
          onClick={openCreate}
          className="h-11 gap-2 rounded-xl bg-[#E94B3C] px-5 font-semibold text-white hover:bg-[#D94134] active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Thêm chuyên gia
        </Button>
      </ManagerPageHeader>

      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] bg-[#FAFAF5]/70 px-6 py-3">
            <p className="text-xs font-medium text-[#6B6B6B]">
              <span className="font-mono font-bold text-[#2D2D2D]">{totalCount}</span>{" "}
              chuyên gia
            </p>
            <p className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
              <Link2 className="size-3.5 text-[#4FC3F7]" />
              Có thể gán nhiều chương trình cho mỗi chuyên gia
            </p>
          </div>
          <ManagerFilterBar
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Tìm theo tên hoặc mã chuyên gia..."
            filters={[
              {
                key: "sort",
                placeholder: "Sắp xếp",
                value: sort,
                onChange: handleSortChange,
                options: SORT_OPTIONS,
              },
            ]}
            showClear={search !== "" || sort !== "createdAt-desc"}
            onClearFilters={() => {
              markLoading();
              setSearch("");
              setDebouncedSearch("");
              setSort("createdAt-desc");
              setPage(1);
            }}
          />
          <div className="p-6">
            <ManagerDataTable
              columns={columns}
              data={experts}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => {
                markLoading();
                setPage(nextPage);
              }}
              emptyState={
                <ManagerEmptyState
                  title="Chưa có chuyên gia phù hợp"
                  description="Thử thay đổi từ khóa tìm kiếm hoặc thêm hồ sơ chuyên gia đầu tiên."
                  icon={UserRoundSearch}
                  actionLabel="Thêm chuyên gia"
                  onAction={openCreate}
                />
              }
            />
          </div>
        </div>
      </div>

      <ExpertFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingExpert(null);
        }}
        expert={editingExpert}
        programs={programs}
        isProgramsLoading={isProgramsLoading}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="Xóa chuyên gia?"
        description={`Hồ sơ “${deleteTarget?.fullName || deleteTarget?.code || ""}” sẽ bị xóa mềm khỏi hệ thống. Các liên kết chương trình hiện tại có thể bị ảnh hưởng.`}
        confirmLabel="Xóa chuyên gia"
        variant="destructive"
      />

      <ExpertProfileDialog
        expertId={profileExpertId}
        open={profileExpertId !== null}
        onOpenChange={(open) => {
          if (!open) setProfileExpertId(null);
        }}
      />
    </div>
  );
}
