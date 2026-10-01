"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowRight,
  BookOpen,
  Plus,
} from "lucide-react";

import { FrameworkFormDialog } from "@/components/expert/frameworks/framework-form-dialog";
import {
  ExpertWorkbenchHero,
  ExpertWorkflowRail,
} from "@/components/expert/shared/expert-workbench";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  createProgramFramework,
  deleteProgramFramework,
  getProgramFrameworks,
  type ProgramCategory,
  type ProgramFramework,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { buildFrameworkRules } from "@/lib/frameworks/rule-labels";
import {
  PROGRAM_CATEGORY_META,
  PROGRAM_CATEGORY_ORDER,
} from "@/lib/programs/constants";
import type { FrameworkCreateFormValues } from "@/lib/validations/program-frameworks";

const CATEGORY_OPTIONS = [
  { value: "all", label: "Mọi lĩnh vực" },
  ...PROGRAM_CATEGORY_ORDER.map((category) => ({
    value: category,
    label: PROGRAM_CATEGORY_META[category].label,
  })),
];

const PAGE_SIZE = 10;

export function ExpertFrameworkManager() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProgramFramework | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: () =>
      getProgramFrameworks({
        search: debouncedSearch || undefined,
        category: category === "all" ? undefined : (category as ProgramCategory),
        page,
        pageSize: PAGE_SIZE,
      }),
    deps: [debouncedSearch, category, page],
    onError: (error) => showAppErrorFromUnknown(error, "frameworks.list"),
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const frameworks = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const totalCount = data?.data?.totalCount ?? 0;

  function openCreate() {
    setFormOpen(true);
  }

  async function handleCreate(values: FrameworkCreateFormValues) {
    setIsSubmitting(true);
    try {
      const created = await createProgramFramework({
        name: values.name,
        description: values.description || null,
        academicGuidance: values.academicGuidance || null,
        category: values.category,
      });
      const frameworkId = created?.data?.id;
      showAppSuccess({
        title: "Đã tạo khung chương trình",
        description: `Khung “${values.name}” sẵn sàng để đặt quy tắc.`,
      });
      setFormOpen(false);
      if (frameworkId) {
        router.push(`/expert/frameworks/${frameworkId}`);
        return;
      }
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "frameworks.create");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProgramFramework(deleteTarget.id);
      showAppSuccess({
        title: "Đã lưu trữ bộ khung",
        description: `Bộ khung “${deleteTarget.name}” không còn dùng cho chương trình mới.`,
      });
      setDeleteTarget(null);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "frameworks.delete");
      throw error;
    }
  }

  const columns: ColumnDef<ProgramFramework>[] = [
    {
      header: "Khung chương trình",
      render: (framework) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {framework.name || "Chưa đặt tên"}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {framework.description || "Chưa có mô tả"}
          </p>
        </div>
      ),
    },
    {
      header: "Lĩnh vực",
      className: "w-32",
      render: (framework) => (
        <span className="inline-flex items-center gap-2 text-sm text-foreground">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: PROGRAM_CATEGORY_META[framework.category].color }}
          />
          {PROGRAM_CATEGORY_META[framework.category].label}
        </span>
      ),
    },
    {
      header: "Trạng thái phiên bản",
      className: "w-44",
      render: (framework) => (
        <div className="flex flex-wrap gap-1.5">
          {framework.currentVersionNumber != null ? (
            <Badge className="rounded-md bg-emerald-500/10 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              Phát hành v{framework.currentVersionNumber}
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-md text-[11px]">
              Chưa phát hành
            </Badge>
          )}
          {framework.hasDraftVersion ? (
            <Badge className="rounded-md bg-amber-500/12 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              Có bản nháp
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      header: "Quy tắc",
      className: "w-40",
      render: (framework) => {
        const rules = buildFrameworkRules(framework);

        if (rules.length === 0) {
          return (
            <span className="text-xs text-muted-foreground">Không ràng buộc</span>
          );
        }

        return (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className="inline-flex max-w-full cursor-help items-center rounded-md border border-transparent px-1.5 py-0.5 text-left text-sm font-medium text-foreground outline-none hover:border-border hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              }
            >
              <span className="truncate tabular-nums">
                {rules.length} quy tắc
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-72 text-left leading-5">
              <ul className="space-y-1">
                {rules.map((rule) => (
                  <li key={rule}>· {rule}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      header: "Thao tác",
      className: "w-44 text-right",
      render: (framework) => (
        <div className="flex justify-end gap-1">
          <Button
            nativeButton={false}
            render={<Link href={`/expert/frameworks/${framework.id}`} />}
            variant="outline"
            className="h-9 gap-1 rounded-lg px-2.5 text-[11px] font-semibold"
          >
            Vào biên soạn
            <ArrowRight className="size-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(framework)}
            aria-label={`Lưu trữ bộ khung ${framework.name}`}
            className="size-9 rounded-lg text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Archive className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ExpertWorkbenchHero
        eyebrow="Thư viện chuẩn học thuật"
        title="Bộ khung thẩm định"
        description="Khung gồm hướng dẫn học thuật và các quy tắc kiểm tra curriculum tự động. Hoàn thiện rồi xuất bản để Manager gán vào chương trình."
        icon={BookOpen}
        actions={
          <Button
            type="button"
            onClick={openCreate}
            className="h-11 gap-2 rounded-xl bg-primary px-5 font-semibold text-white hover:bg-primary/90 active:scale-[0.98]"
          >
            <Plus className="size-4" />
            Khởi tạo bộ khung
          </Button>
        }
      >
        <ExpertWorkflowRail
          steps={[
            {
              label: "Xác định bối cảnh",
              detail: "Đối tượng học, cấp độ và kết quả mong đợi.",
              state: "current",
            },
            {
              label: "Đặt chuẩn nền",
              detail: "Nguyên tắc sư phạm cho người thiết kế curriculum.",
              state: "next",
            },
            {
              label: "Đặt quy tắc",
              detail: "Điều kiện curriculum phải đạt trước khi chấp thuận.",
              state: "next",
            },
            {
              label: "Xuất bản",
              detail: "Khóa phiên bản để gán vào chương trình.",
              state: "next",
            },
          ]}
        />
      </ExpertWorkbenchHero>

      <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex items-center justify-between border-b border-border bg-background/70 px-6 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              <span className="font-mono font-bold text-foreground">{totalCount}</span>{" "}
              khung chương trình
            </p>
            <p className="text-xs text-muted-foreground">
              Manager chỉ gán phiên bản đã xuất bản; chương trình đã gán không tự nâng cấp.
            </p>
          </div>

          <ManagerFilterBar
            searchValue={search}
            onSearchChange={(value) => {
              markLoading();
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Tìm theo tên khung..."
            filters={[
              {
                key: "category",
                placeholder: "Lĩnh vực",
                value: category,
                onChange: (value) => {
                  markLoading();
                  setCategory(value || "all");
                  setPage(1);
                },
                options: CATEGORY_OPTIONS,
              },
            ]}
            showClear={search !== "" || category !== "all"}
            onClearFilters={() => {
              markLoading();
              setSearch("");
              setDebouncedSearch("");
              setCategory("all");
              setPage(1);
            }}
          />

          <div className="p-6">
            <ManagerDataTable
              columns={columns}
              data={frameworks}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => {
                markLoading();
                setPage(nextPage);
              }}
              emptyState={
                <ManagerEmptyState
                  icon={BookOpen}
                  title="Chưa có bộ khung thẩm định"
                  description="Khởi tạo bộ khung đầu tiên, sau đó hoàn thiện bối cảnh, chuẩn học thuật và quy tắc trong trang biên tập."
                  actionLabel="Khởi tạo bộ khung"
                  onAction={openCreate}
                />
              }
            />
          </div>
        </div>
      </div>

      <FrameworkFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        isSubmitting={isSubmitting}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="Lưu trữ bộ khung này?"
        description={`Bộ khung “${deleteTarget?.name ?? ""}” sẽ không còn được chọn cho chương trình mới. Các chương trình đã gán vẫn giữ nguyên phiên bản và lịch sử thẩm định.`}
        confirmLabel="Lưu trữ"
        variant="destructive"
      />
    </div>
  );
}
