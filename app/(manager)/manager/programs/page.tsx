"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit2, FolderPlus, FolderSearch, Plus, Trash2, Search, X } from "lucide-react";

import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { ManagerDataTable, type ColumnDef } from "@/components/manager/shared/data-table";
import { ManagerStatusBadge } from "@/components/manager/shared/status-badge";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  deleteProgram,
  getPrograms,
  type Program,
  type ProgramCategory,
  type ProgramLevel,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  PROGRAM_CATEGORY_META,
  PROGRAM_CATEGORY_ORDER,
  PROGRAM_LEVEL_LABELS,
  PROGRAM_LEVEL_ORDER,
} from "@/lib/programs/constants";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";

const CATEGORY_LABELS: Record<string, string> = {
  Science: "Khoa học",
  Technology: "Công nghệ",
  Engineering: "Kỹ thuật",
  Mathematic: "Toán học",
  Art: "Nghệ thuật",
};

const LEVEL_LABELS: Record<string, string> = {
  Beginner: "Cơ bản",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
  AllLevels: "Mọi cấp độ",
};

const getCategoryStyle = (cat: string, isActive: boolean) => {
  const styles: Record<string, { bg: string; border: string; text: string; circleBg: string }> = {
    Science: {
      bg: "bg-[#E94B3C]/8 hover:bg-[#E94B3C]/12",
      border: "border-[#E94B3C]/40",
      text: "text-[#E94B3C] dark:text-[#f2665a]",
      circleBg: "bg-[#E94B3C]/15",
    },
    Technology: {
      bg: "bg-[#7CB342]/8 hover:bg-[#7CB342]/12",
      border: "border-[#7CB342]/40",
      text: "text-[#3d5c22] dark:text-[#b8e086]",
      circleBg: "bg-[#7CB342]/15",
    },
    Engineering: {
      bg: "bg-[#4FC3F7]/10 hover:bg-[#4FC3F7]/15",
      border: "border-[#4FC3F7]/40",
      text: "text-[#0d6e9c] dark:text-[#7dd3fc]",
      circleBg: "bg-[#4FC3F7]/15",
    },
    Art: {
      bg: "bg-[#FDD835]/10 hover:bg-[#FDD835]/15",
      border: "border-[#FDD835]/40",
      text: "text-[#826e0e] dark:text-[#fde047]",
      circleBg: "bg-[#FDD835]/15",
    },
    Mathematic: {
      bg: "bg-[#7E57C2]/8 hover:bg-[#7E57C2]/12",
      border: "border-[#7E57C2]/40",
      text: "text-[#51308a] dark:text-[#c4b5fd]",
      circleBg: "bg-[#7E57C2]/15",
    },
  };
  return styles[cat] ?? { bg: "", border: "", text: "", circleBg: "" };
};

export default function ManagerProgramsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);

  // Client side fetch with debouncing/deps
  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: async () => {
      const result = await getPrograms({
        search: search.trim() || undefined,
        category: category === "all" ? undefined : (category as ProgramCategory),
        level: level === "all" ? undefined : (level as ProgramLevel),
        page,
        pageSize: 10,
      });
      return result;
    },
    deps: [search, category, level, page],
    onError: (err) => {
      showAppErrorFromUnknown(err, "programs.list");
    },
  });

  const programs = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteProgram(deleteTarget.id);
      showAppSuccess({
        title: "Xóa thành công",
        description: `Chương trình ${deleteTarget.name} đã được xóa thành công.`,
      });
      setDeleteTarget(null);
      retry(); // Reload table data
    } catch (err) {
      showAppErrorFromUnknown(err, "programs.delete");
    }
  }

  // Define table columns
  const columns: ColumnDef<Program>[] = [
    {
      header: "Mã CT",
      accessorKey: "code",
      className: "w-28 font-mono font-semibold text-foreground",
    },
    {
      header: "Tên chương trình",
      accessorKey: "name",
      className: "max-w-xs truncate font-medium text-foreground",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.seriesName}</span>
        </div>
      ),
    },
    {
      header: "Thể loại",
      render: (row) => (row.category ? CATEGORY_LABELS[row.category] ?? row.category : "—"),
    },
    {
      header: "Độ khó",
      render: (row) => LEVEL_LABELS[row.level] ?? row.level,
    },
    {
      header: "Học phí",
      className: "text-right font-mono text-foreground",
      render: (row) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(row.price),
    },
    {
      header: "Trạng thái",
      render: (row) => <ManagerStatusBadge status={row.status} />,
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
            render={<Link href={`/manager/programs/${row.id}`} />}
            className="size-8 text-muted-foreground hover:bg-muted rounded-lg"
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(row)}
            className="size-8 text-[#E94B3C] hover:bg-[#E94B3C]/10 rounded-lg"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSearchChange = (val: string) => {
    markLoading();
    setSearch(val);
    setPage(1);
  };

  const breadcrumbs = [{ label: "Chương trình" }];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <ManagerPageHeader
        title="Quản lý Chương trình học"
        description="Danh sách các chương trình đào tạo STEAM thuộc hệ thống OboxSTEAM."
        breadcrumbs={breadcrumbs}
      >
        <Button
          nativeButton={false}
          render={<Link href="/manager/programs/create" />}
          className="h-10 rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90 gap-1.5"
        >
          <Plus className="size-4" />
          Tạo chương trình
        </Button>
      </ManagerPageHeader>

      <div className="px-6 pb-12">
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {/* Custom Filters Controls (styled like homepage layout, theme-aware) */}
          <div className="flex flex-col gap-5 border-b border-border bg-card px-6 py-5">
            {/* 1. Search Input (Full width) */}
            <div className="relative w-full">
              <Search className="absolute top-2.5 left-3.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm chương trình..."
                className="h-10 pl-10 pr-8 rounded-xl border-border text-sm text-foreground bg-background/50 focus-visible:ring-[#4FC3F7]"
              />
              {search ? (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute top-3 right-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#4FC3F7]"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              ) : null}
            </div>

            {/* 2. Category Selector */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lọc theo STEAM
                </p>
                <p className="text-xs text-muted-foreground/60">Nhấn để chọn lĩnh vực</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* "Tất cả" category button */}
                <button
                  type="button"
                  onClick={() => {
                    markLoading();
                    setCategory("all");
                    setPage(1);
                  }}
                  className={cn(
                    "group inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition-all duration-200 text-xs font-semibold",
                    "hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] active:scale-[0.98]",
                    category === "all"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  Tất cả
                </button>

                {PROGRAM_CATEGORY_ORDER.map((cat) => {
                  const meta = PROGRAM_CATEGORY_META[cat];
                  const isActive = category === cat;
                  const custom = getCategoryStyle(cat, isActive);

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        markLoading();
                        setCategory(isActive ? "all" : cat);
                        setPage(1);
                      }}
                      className={cn(
                        "group inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition-all duration-200 text-xs font-semibold",
                        "hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] active:scale-[0.98]",
                        isActive
                          ? `${custom.bg} ${custom.border} ${custom.text}`
                          : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full font-heading text-[10px] font-bold",
                          isActive
                            ? custom.circleBg
                            : "bg-card border border-border shadow-sm"
                        )}
                        style={!isActive ? { color: meta.color } : undefined}
                      >
                        {meta.letter}
                      </span>
                      <span className="leading-tight">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Bottom Row: Level Select & Clear Filter Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <Select
                value={level}
                onValueChange={(val) => {
                  markLoading();
                  setLevel(val ?? "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className={THEME_SELECT_TRIGGER}>
                  <span className="truncate">
                    {level === "all" ? "Tất cả cấp độ" : (LEVEL_LABELS[level] ?? level)}
                  </span>
                </SelectTrigger>
                <SelectContent className={THEME_SELECT_CONTENT} align="start" sideOffset={8}>
                  <SelectItem value="all" className={THEME_SELECT_ITEM}>
                    Tất cả cấp độ
                  </SelectItem>
                  {PROGRAM_LEVEL_ORDER.map((lvl) => (
                    <SelectItem
                      key={lvl}
                      value={lvl}
                      className={THEME_SELECT_ITEM}
                    >
                      {PROGRAM_LEVEL_LABELS[lvl]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {search !== "" || category !== "all" || level !== "all" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    markLoading();
                    setSearch("");
                    setCategory("all");
                    setLevel("all");
                    setPage(1);
                  }}
                  className="h-9 gap-1.5 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                  Xóa bộ lọc
                </Button>
              ) : null}
            </div>
          </div>

          {/* Table content list */}
          <div className="p-6 bg-card">
            <ManagerDataTable
              columns={columns}
              data={programs}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              emptyState={
                <ManagerEmptyState
                  title="Không tìm thấy chương trình nào"
                  description="Hãy thử đổi từ khóa tìm kiếm, lọc bộ lọc khác hoặc nhấn tạo mới một chương trình."
                  icon={FolderSearch}
                  actionLabel="Tạo chương trình học"
                  actionHref="/manager/programs/create"
                />
              }
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xóa chương trình học?"
        description={`Bạn có chắc chắn muốn xóa chương trình "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Đồng ý xóa"
        variant="destructive"
      />
    </div>
  );
}
