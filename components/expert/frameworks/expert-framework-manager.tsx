"use client";

import { useEffect, useState } from "react";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";

import {
  FrameworkFormDialog,
  type CriterionDraft,
  type FrameworkFormValues,
} from "@/components/expert/frameworks/framework-form-dialog";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
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
  addFrameworkCriterion,
  createProgramFramework,
  deleteFrameworkCriterion,
  deleteProgramFramework,
  getProgramFrameworkById,
  getProgramFrameworks,
  updateFrameworkCriterion,
  updateProgramFramework,
  type FrameworkRubricCriterionRequestInput,
  type ProgramCategory,
  type ProgramFramework,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  PROGRAM_CATEGORY_META,
  PROGRAM_CATEGORY_ORDER,
} from "@/lib/programs/constants";

const CATEGORY_OPTIONS = [
  { value: "all", label: "Mọi lĩnh vực" },
  ...PROGRAM_CATEGORY_ORDER.map((category) => ({
    value: category,
    label: PROGRAM_CATEGORY_META[category].label,
  })),
];

const PAGE_SIZE = 10;

function toCount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function toCriterionRequest(
  criterion: CriterionDraft,
  index: number,
): FrameworkRubricCriterionRequestInput {
  return {
    name: criterion.name.trim(),
    description: criterion.description.trim() || null,
    maxScore: Number(criterion.maxScore),
    displayOrder: index,
  };
}

function hasCriterionChanged(
  criterion: CriterionDraft,
  index: number,
  framework: ProgramFramework,
): boolean {
  const original = framework.criteria.find((item) => item.id === criterion.id);
  if (!original) return true;
  return (
    original.name !== criterion.name.trim() ||
    original.description !== criterion.description.trim() ||
    original.maxScore !== Number(criterion.maxScore) ||
    original.displayOrder !== index
  );
}

/** Applies added / edited / removed rubric rows against the saved framework. */
async function syncFrameworkCriteria(
  framework: ProgramFramework,
  drafts: CriterionDraft[],
): Promise<void> {
  const keptIds = new Set(
    drafts.map((draft) => draft.id).filter((id): id is string => id != null),
  );

  for (const original of framework.criteria) {
    if (!keptIds.has(original.id)) {
      await deleteFrameworkCriterion(framework.id, original.id);
    }
  }

  for (const [index, draft] of drafts.entries()) {
    const request = toCriterionRequest(draft, index);
    if (draft.id) {
      if (hasCriterionChanged(draft, index, framework)) {
        await updateFrameworkCriterion(framework.id, draft.id, request);
      }
      continue;
    }
    await addFrameworkCriterion(framework.id, request);
  }
}

export function ExpertFrameworkManager() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFramework, setEditingFramework] =
    useState<ProgramFramework | null>(null);
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
    setEditingFramework(null);
    setFormOpen(true);
  }

  function openEdit(framework: ProgramFramework) {
    void (async () => {
      try {
        const result = await getProgramFrameworkById(framework.id);
        setEditingFramework(result?.data ?? framework);
        setFormOpen(true);
      } catch (error) {
        showAppErrorFromUnknown(error, "frameworks.detail");
      }
    })();
  }

  async function handleSubmit(
    values: FrameworkFormValues,
    criteria: CriterionDraft[],
  ) {
    setIsSubmitting(true);
    try {
      if (editingFramework) {
        const minModules = toCount(values.minModules);
        const minOfflineSessions = toCount(values.minOfflineSessions);
        const minLiveSessions = toCount(values.minLiveSessions);

        await updateProgramFramework(editingFramework.id, {
          name: values.name,
          description: values.description || null,
          category: values.category,
          minModules,
          minOfflineSessions,
          minLiveSessions,
          requireCapstoneResearchMilestone:
            values.requireCapstoneResearchMilestone,
          clearMinModules: minModules == null,
          clearMinOfflineSessions: minOfflineSessions == null,
          clearMinLiveSessions: minLiveSessions == null,
        });
        await syncFrameworkCriteria(editingFramework, criteria);
        showAppSuccess({
          title: "Đã cập nhật khung chương trình",
          description: `Khung “${values.name}” đã được lưu.`,
        });
      } else {
        await createProgramFramework({
          name: values.name,
          description: values.description || null,
          category: values.category,
          minModules: toCount(values.minModules),
          minOfflineSessions: toCount(values.minOfflineSessions),
          minLiveSessions: toCount(values.minLiveSessions),
          requireCapstoneResearchMilestone:
            values.requireCapstoneResearchMilestone,
          criteria: criteria.map(toCriterionRequest),
        });
        showAppSuccess({
          title: "Đã tạo khung chương trình",
          description: `Khung “${values.name}” sẵn sàng để gán cho chương trình.`,
        });
      }
      setFormOpen(false);
      setEditingFramework(null);
      retry();
    } catch (error) {
      showAppErrorFromUnknown(
        error,
        editingFramework ? "frameworks.update" : "frameworks.create",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProgramFramework(deleteTarget.id);
      showAppSuccess({
        title: "Đã xóa khung chương trình",
        description: `Khung “${deleteTarget.name}” đã được xóa.`,
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
      header: "Yêu cầu tối thiểu",
      render: (framework) => {
        const rules = [
          framework.minModules != null
            ? `${framework.minModules} học phần`
            : null,
          framework.minOfflineSessions != null
            ? `${framework.minOfflineSessions} buổi offline`
            : null,
          framework.minLiveSessions != null
            ? `${framework.minLiveSessions} buổi live`
            : null,
          framework.requireCapstoneResearchMilestone ? "Có capstone" : null,
        ].filter(Boolean) as string[];

        if (rules.length === 0) {
          return <span className="text-xs text-muted-foreground">Không ràng buộc</span>;
        }

        return (
          <div className="flex max-w-72 flex-wrap gap-1.5">
            {rules.map((rule) => (
              <Badge
                key={rule}
                variant="secondary"
                className="rounded-md bg-muted text-[11px] font-medium text-foreground"
              >
                {rule}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      header: "Tiêu chí",
      className: "w-24 tabular-nums",
      render: (framework) => (
        <span className="font-mono text-sm font-semibold text-foreground">
          {framework.criteria.length}
        </span>
      ),
    },
    {
      header: "Thao tác",
      className: "w-24 text-right",
      render: (framework) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => openEdit(framework)}
            aria-label={`Sửa khung ${framework.name}`}
            className="size-9 rounded-lg text-muted-foreground hover:bg-[#FDD835]/25 hover:text-[#8A7200] dark:hover:text-[#fde047]"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(framework)}
            aria-label={`Xóa khung ${framework.name}`}
            className="size-9 rounded-lg text-primary hover:bg-primary/10 hover:text-primary"
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
        title="Khung chương trình"
        description="Blueprint và tiêu chí rubric dùng để thẩm định chương trình."
        breadcrumbs={[{ label: "Khung chương trình" }]}
      >
        <Button
          type="button"
          onClick={openCreate}
          className="h-11 gap-2 rounded-xl bg-primary px-5 font-semibold text-white hover:bg-primary/90 active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Tạo khung
        </Button>
      </ManagerPageHeader>

      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex items-center justify-between border-b border-border bg-background/70 px-6 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              <span className="font-mono font-bold text-foreground">{totalCount}</span>{" "}
              khung chương trình
            </p>
            <p className="text-xs text-muted-foreground">
              Khung được gán cho chương trình khi Manager tạo hoặc chỉnh curriculum.
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
                  title="Chưa có khung chương trình"
                  description="Tạo blueprint đầu tiên với bộ tiêu chí rubric để bắt đầu thẩm định."
                  actionLabel="Tạo khung"
                  onAction={openCreate}
                />
              }
            />
          </div>
        </div>
      </div>

      <FrameworkFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingFramework(null);
        }}
        framework={editingFramework}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="Xóa khung chương trình?"
        description={`Khung “${deleteTarget?.name ?? ""}” và toàn bộ tiêu chí rubric sẽ bị xóa. Các chương trình đang gán khung này sẽ mất ràng buộc thẩm định.`}
        confirmLabel="Xóa khung"
        variant="destructive"
      />
    </div>
  );
}
