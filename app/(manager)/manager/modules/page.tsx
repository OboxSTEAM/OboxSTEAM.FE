"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderTree, Search, X } from "lucide-react";

import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { ManagerDataTable, type ColumnDef } from "@/components/manager/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { getModules, getPrograms, type Module } from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { formatProgramPrice } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";

// ── Module type chip config ─────────────────────────────────────────────────
const MODULE_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả", letter: "∞", color: "#2D2D2D", bg: "bg-[#2D2D2D]", activeBg: "border-[#2D2D2D] bg-[#2D2D2D] text-white" },
  { value: "Theory", label: "Lý thuyết", letter: "T", color: "#4FC3F7", bg: "bg-[#4FC3F7]/10", activeBg: "border-[#4FC3F7]/40 bg-[#4FC3F7]/10 text-[#0d6e9c]" },
  { value: "Experiential", label: "Trải nghiệm", letter: "E", color: "#7CB342", bg: "bg-[#7CB342]/10", activeBg: "border-[#7CB342]/40 bg-[#7CB342]/10 text-[#3d5c22]" },
  { value: "Research", label: "Nghiên cứu", letter: "R", color: "#7E57C2", bg: "bg-[#7E57C2]/10", activeBg: "border-[#7E57C2]/40 bg-[#7E57C2]/10 text-[#51308a]" },
] as const;

const SORT_OPTIONS = [
  { label: "Sắp xếp theo", value: "all" },
  { label: "Tên học phần", value: "name" },
  { label: "Mã học phần", value: "code" },
  { label: "Thứ tự học", value: "moduleOrder" },
  { label: "Học phí", value: "price" },
  { label: "Ngày tạo", value: "createdAt" },
];

// ── Main page ────────────────────────────────────────────────────────────────
export default function ManagerModulesPage() {
  const [search, setSearch] = useState("");
  const [moduleType, setModuleType] = useState("all");
  const [sortBy, setSortBy] = useState("all");
  const [isDescending, setIsDesc] = useState(false);
  const [page, setPage] = useState(1);

  // Fetch programs for programId → name mapping
  const { data: programsData } = useClientFetch({
    fetcher: async () => getPrograms({ pageSize: 100 }),
    onError: (err) => showAppErrorFromUnknown(err, "programs.list"),
    deps: [],
  });
  const programsList = programsData?.data?.items || [];
  const programMap = new Map(programsList.map((p) => [p.id, p]));

  // Fetch modules
  const { data: modulesData, isLoading, markLoading } = useClientFetch({
    fetcher: async () =>
      getModules({
        search: search.trim() || undefined,
        moduleType: moduleType === "all" ? undefined : moduleType,
        sortBy: sortBy === "all" ? undefined : sortBy,
        isDescending: sortBy !== "all" ? isDescending : undefined,
        page,
        pageSize: 10,
      }),
    onError: (err) => showAppErrorFromUnknown(err, "programs.list"),
    deps: [search, moduleType, sortBy, isDescending, page],
  });

  const modulesList = modulesData?.data?.items || [];
  const totalPages = modulesData?.data?.totalPages || 1;
  const showClear = search !== "" || moduleType !== "all" || sortBy !== "all" || isDescending;

  const handleSearchChange = (val: string) => {
    markLoading();
    setSearch(val);
    setPage(1);
  };

  const handleClearFilters = () => {
    markLoading();
    setSearch("");
    setModuleType("all");
    setSortBy("all");
    setIsDesc(false);
    setPage(1);
  };

  const columns: ColumnDef<Module>[] = [
    {
      header: "Mã Module",
      accessorKey: "code",
      className: "font-mono text-xs w-[130px]",
      render: (row) =>
        row.code || <span className="text-[#6B6B6B] italic text-[11px]">Chưa gán</span>,
    },
    {
      header: "Tên Module",
      accessorKey: "name",
      className: "font-semibold text-[#2D2D2D]",
      render: (row) => row.name,
    },
    {
      header: "Loại học phần",
      accessorKey: "moduleType",
      className: "w-[130px]",
      render: (row) => {
        const opt = MODULE_TYPE_OPTIONS.find((o) => o.value === row.moduleType);
        return opt ? (
          <span
            className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold border", opt.activeBg)}
          >
            {opt.label}
          </span>
        ) : row.moduleType;
      },
    },
    {
      header: "Học phí",
      accessorKey: "price",
      className: "text-right w-[130px]",
      render: (row) => formatProgramPrice(row.price),
    },
    {
      header: "Bắt buộc",
      accessorKey: "isMandatory",
      className: "text-center w-[110px]",
      render: (row) => (
        <Badge
          variant="secondary"
          className={cn(
            "font-normal border",
            row.isMandatory
              ? "bg-[#E94B3C]/8 text-[#E94B3C] border-[#E94B3C]/10"
              : "bg-[#F5F5F0] text-[#6B6B6B] border-[#E5E5E0]"
          )}
        >
          {row.isMandatory ? "Bắt buộc" : "Tùy chọn"}
        </Badge>
      ),
    },
    {
      header: "Chương trình học",
      className: "min-w-[180px]",
      render: (row) => {
        const program = programMap.get(row.programId);
        if (!program)
          return <span className="text-[#6B6B6B] text-xs">Đang tải...</span>;
        return (
          <Link
            href={`/manager/programs/${row.programId}`}
            className="text-[#4FC3F7] hover:underline font-semibold block truncate max-w-[200px]"
          >
            {program.name}
          </Link>
        );
      },
    },
    {
      header: "Thao tác",
      className: "text-center w-[120px]",
      render: (row) => (
        <Link
          href={`/manager/programs/${row.programId}?tab=curriculum`}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold bg-[#FAFAF5] hover:bg-[#F0F0EB] text-[#2D2D2D] border border-[#D8D8D3] transition-colors"
        >
          Xem chi tiết
        </Link>
      ),
    },
  ];

  const breadcrumbs = [{ label: "Module" }];

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Danh sách học phần"
        description="Quản lý toàn bộ các học phần STEAM của tất cả chương trình học trên hệ thống."
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 pb-12">
        <div className="rounded-xl border border-[#E5E5E0] bg-white overflow-hidden shadow-sm">

          {/* ── Filter Controls – Program-style ───────────────────────── */}
          <div className="flex flex-col gap-5 border-b border-[#E5E5E0] bg-white px-6 py-5">

            {/* 1. Search full-width */}
            <div className="relative w-full">
              <Search className="absolute top-2.5 left-3.5 size-4 text-[#6B6B6B]" />
              <Input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm tên hoặc mã module..."
                className="h-10 pl-10 pr-8 rounded-xl border-[#E5E5E0] text-sm text-[#2D2D2D] bg-[#FAFAF5]/50 focus-visible:ring-[#4FC3F7]"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute top-3 right-3 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="size-4 text-[#6B6B6B]" />
                </button>
              )}
            </div>

            {/* 2. Module type chip buttons */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-heading text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                  Lọc theo loại học phần
                </p>
                <p className="text-xs text-[#6B6B6B]/60">Nhấn để chọn</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {MODULE_TYPE_OPTIONS.map((opt) => {
                  const isActive = moduleType === opt.value;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        markLoading();
                        setModuleType(isActive && opt.value !== "all" ? "all" : opt.value);
                        setPage(1);
                      }}
                      className={cn(
                        "group inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition-all duration-200 text-xs font-semibold",
                        "hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] active:scale-[0.98]",
                        isActive
                          ? opt.activeBg
                          : "border-[#E5E5E0] bg-[#FAFAF5]/50 text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full font-heading text-[10px] font-bold",
                          isActive
                            ? opt.bg
                            : "bg-white border border-[#E5E5E0] shadow-sm"
                        )}
                        style={!isActive ? { color: opt.color } : undefined}
                      >
                        {opt.letter}
                      </span>
                      <span className="leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Bottom row: Sort + Order + Clear */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E5E0] pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Sort by select */}
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    markLoading();
                    setSortBy(val ?? "all");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "h-9 min-w-[160px] rounded-lg")}>
                    <span className="truncate">
                      {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sắp xếp theo"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className={LIGHT_SELECT_CONTENT} align="start" sideOffset={8}>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className={LIGHT_SELECT_ITEM}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Asc/Desc toggle – only visible when sortBy is active */}
                {sortBy !== "all" && (
                  <div className="flex rounded-lg border border-[#E5E5E0] overflow-hidden">
                    {[
                      { label: "Tăng dần", val: false },
                      { label: "Giảm dần", val: true },
                    ].map(({ label, val }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          markLoading();
                          setIsDesc(val);
                          setPage(1);
                        }}
                        className={cn(
                          "h-9 px-3 text-xs font-semibold transition-colors",
                          isDescending === val
                            ? "bg-[#2D2D2D] text-white"
                            : "bg-white text-[#6B6B6B] hover:bg-[#F5F5F0]"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear filters */}
              {showClear && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 gap-1.5 px-3 rounded-lg text-xs font-semibold text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]"
                >
                  <X className="size-3.5" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>

          {/* ── Table ─────────────────────────────────────────────────── */}
          <div className="p-6 bg-white">
            <ManagerDataTable
              columns={columns}
              data={modulesList}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              emptyState={
                <div className="py-12 text-center">
                  <FolderTree className="size-12 text-[#6B6B6B]/30 mx-auto mb-3" />
                  <h4 className="text-base font-semibold text-[#2D2D2D]">
                    Không tìm thấy học phần nào
                  </h4>
                  <p className="text-sm text-[#6B6B6B] max-w-xs mx-auto mt-1">
                    Thử thay đổi từ khóa tìm kiếm hoặc tắt bộ lọc để hiển thị nhiều kết quả hơn.
                  </p>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
