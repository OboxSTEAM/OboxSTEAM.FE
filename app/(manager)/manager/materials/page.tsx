"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Edit2,
  FileSearch,
  FileText,
  FileType,
  Image as ImageIcon,
  Link2,
  Search,
  Trash2,
  Video,
  X,
} from "lucide-react";

import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { ManagerDataTable, type ColumnDef } from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
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
  deleteMaterial,
  getMaterials,
  type MaterialListItem,
  type MaterialTypeFilter,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

type MaterialVisual = { Icon: React.ElementType; color: string; label: string };

const MATERIAL_TYPE_VISUAL: Record<string, MaterialVisual> = {
  PDF: { Icon: FileText, color: "#E94B3C", label: "PDF" },
  DOC: { Icon: FileType, color: "#4FC3F7", label: "Tài liệu" },
  Video: { Icon: Video, color: "#7E57C2", label: "Video" },
  Image: { Icon: ImageIcon, color: "#C9A227", label: "Hình ảnh" },
  ExternalLink: { Icon: Link2, color: "#7CB342", label: "Liên kết" },
};

const MATERIAL_TYPE_ORDER: MaterialTypeFilter[] = [
  "PDF",
  "DOC",
  "Video",
  "Image",
  "ExternalLink",
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "uploadedAt", label: "Ngày tải" },
  { value: "title", label: "Tên tài liệu" },
  { value: "materialType", label: "Loại" },
  { value: "activityName", label: "Hoạt động" },
  { value: "courseName", label: "Khóa học" },
  { value: "programName", label: "Chương trình" },
];

/** Compact upload date: handles ISO ("2026-07-17T09:11:55.9Z") and "dd/MM/yyyy HH:mm:ss". */
function splitUploadedAt(value: string): { date: string; time: string } {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      date: `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`,
      time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
    };
  }
  const [date = value, time = ""] = value.split(" ");
  return { date, time: time.slice(0, 5) };
}

function visualFor(materialType: string): MaterialVisual {
  return (
    MATERIAL_TYPE_VISUAL[materialType] ?? {
      Icon: FileText,
      color: "#6B6B6B",
      label: materialType,
    }
  );
}

/** Deep-link into the curriculum tree, opening the activity with its material section. */
function editHref(row: MaterialListItem): string {
  const params = new URLSearchParams({
    node: "activity",
    id: row.activityId,
    courseId: row.courseId,
  });
  return `/manager/programs/${row.programId}?${params.toString()}`;
}

export default function ManagerMaterialsPage() {
  const [search, setSearch] = useState("");
  const [materialType, setMaterialType] = useState<"all" | MaterialTypeFilter>("all");
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [isDescending, setIsDescending] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<MaterialListItem | null>(null);

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: () =>
      getMaterials({
        search: search.trim() || undefined,
        materialType: materialType === "all" ? undefined : materialType,
        sortBy,
        isDescending,
        page,
        pageSize: 10,
      }),
    deps: [search, materialType, sortBy, isDescending, page],
    onError: (err) => {
      showAppErrorFromUnknown(err, "programs.list");
    },
  });

  const materials = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMaterial(deleteTarget.id);
      showAppSuccess({
        title: "Xóa thành công",
        description: `Tài liệu "${deleteTarget.title ?? ""}" đã được xóa.`,
      });
      setDeleteTarget(null);
      retry();
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.material.delete");
    }
  }

  const handleSearchChange = (val: string) => {
    markLoading();
    setSearch(val);
    setPage(1);
  };

  const columns: ColumnDef<MaterialListItem>[] = [
    {
      header: "Tài liệu",
      className: "max-w-xs",
      render: (row) => {
        const { Icon, color } = visualFor(row.materialType);
        return (
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#E5E5E0] bg-white"
              style={{ color }}
            >
              <Icon className="size-4" />
            </span>
            <span className="truncate font-semibold text-[#2D2D2D]">
              {row.title ?? "—"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Loại",
      render: (row) => {
        const { color, label } = visualFor(row.materialType);
        return (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: `${color}18`, color }}
          >
            {label}
          </span>
        );
      },
    },
    {
      header: "Hoạt động",
      className: "max-w-[180px] truncate text-[#2D2D2D]",
      render: (row) => row.activityName ?? "—",
    },
    {
      header: "Khóa học",
      className: "max-w-[180px] truncate text-[#6B6B6B]",
      render: (row) => row.courseName ?? "—",
    },
    {
      header: "Chương trình",
      className: "max-w-[180px] truncate text-[#6B6B6B]",
      render: (row) => row.programName ?? "—",
    },
    {
      header: "Ngày tải",
      className: "whitespace-nowrap",
      render: (row) => {
        const { date, time } = splitUploadedAt(row.uploadedAt);
        return (
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-[#2D2D2D]">{date}</span>
            {time ? <span className="text-xs text-[#6B6B6B]">{time}</span> : null}
          </div>
        );
      },
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
            render={<Link href={editHref(row)} />}
            className="size-8 rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F0]"
            title="Sửa tài liệu trong hoạt động"
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(row)}
            className="size-8 rounded-lg text-[#E94B3C] hover:bg-[#E94B3C]/10"
            title="Xóa tài liệu"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const breadcrumbs = [{ label: "Tài liệu" }];
  const hasFilter = search !== "" || materialType !== "all";

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Quản lý Tài liệu học tập"
        description="Danh sách tài liệu đính kèm trong các hoạt động thuộc chương trình OboxSTEAM."
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-xl border border-[#E5E5E0] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#E5E5E0] bg-white px-6 py-5">
            <div className="relative w-full">
              <Search className="absolute top-2.5 left-3.5 size-4 text-[#6B6B6B]" />
              <Input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm theo tên tài liệu, hoạt động, khóa học, chương trình..."
                className="h-10 rounded-xl border-[#E5E5E0] bg-[#FAFAF5]/50 pr-8 pl-10 text-sm text-[#2D2D2D] focus-visible:ring-[#4FC3F7]"
              />
              {search ? (
                <button
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
                  value={materialType}
                  onValueChange={(val) => {
                    markLoading();
                    setMaterialType((val as "all" | MaterialTypeFilter) ?? "all");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={LIGHT_SELECT_TRIGGER}>
                    <span className="truncate">
                      {materialType === "all"
                        ? "Tất cả loại tài liệu"
                        : visualFor(materialType).label}
                    </span>
                  </SelectTrigger>
                  <SelectContent className={LIGHT_SELECT_CONTENT} align="start" sideOffset={8}>
                    <SelectItem value="all" className={LIGHT_SELECT_ITEM}>
                      Tất cả loại tài liệu
                    </SelectItem>
                    {MATERIAL_TYPE_ORDER.map((mt) => (
                      <SelectItem key={mt} value={mt} className={LIGHT_SELECT_ITEM}>
                        {visualFor(mt).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    markLoading();
                    setSortBy(val ?? "uploadedAt");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={LIGHT_SELECT_TRIGGER}>
                    <span className="truncate">
                      Sắp xếp: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Ngày tải"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className={LIGHT_SELECT_CONTENT} align="start" sideOffset={8}>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className={LIGHT_SELECT_ITEM}>
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
                    setMaterialType("all");
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
              data={materials}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              emptyState={
                <ManagerEmptyState
                  title="Không tìm thấy tài liệu nào"
                  description="Tài liệu được tải lên trong từng hoạt động. Hãy thử đổi từ khóa hoặc bộ lọc khác."
                  icon={FileSearch}
                />
              }
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xóa tài liệu?"
        description={`Bạn có chắc chắn muốn xóa tài liệu "${deleteTarget?.title ?? ""}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Đồng ý xóa"
        variant="destructive"
      />
    </div>
  );
}
