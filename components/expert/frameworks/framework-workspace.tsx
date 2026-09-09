"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  ArrowLeft,
  Archive,
  BookOpen,
  History,
  ListChecks,
  Plus,
  Rocket,
  Trash2,
} from "lucide-react";
import { z } from "zod";

import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  archiveProgramFramework,
  createFrameworkDraftVersion,
  getFrameworkVersions,
  getProgramFrameworkById,
  publishFrameworkVersion,
  saveFrameworkDraftRubric,
  updateProgramFramework,
  type FrameworkRubricCriterion,
  type ProgramFrameworkVersion,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  PROGRAM_CATEGORY_META,
  PROGRAM_CATEGORY_ORDER,
} from "@/lib/programs/constants";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";

const countTextSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d{1,4}$/.test(value),
    "Chỉ nhập số nguyên không âm.",
  );

const metadataSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên khung."),
  description: z.string().trim().max(4000),
  academicGuidance: z.string().trim().max(4000),
  category: z.enum(["Science", "Technology", "Engineering", "Art", "Mathematic"]),
  minModules: countTextSchema,
  minOfflineSessions: countTextSchema,
  minLiveSessions: countTextSchema,
  requireCapstoneResearchMilestone: z.boolean(),
});

type MetadataValues = z.infer<typeof metadataSchema>;

type CriterionDraft = {
  key: string;
  id: string | null;
  name: string;
  description: string;
  evidenceGuidance: string;
  maxScore: string;
};

type FrameworkWorkspaceProps = {
  frameworkId: string;
};

function toCount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

function createCriterionKey(): string {
  return `criterion-${Math.random().toString(36).slice(2, 10)}`;
}

function criterionFromEntity(c: FrameworkRubricCriterion): CriterionDraft {
  return {
    key: c.id,
    id: c.id,
    name: c.name,
    description: c.description,
    evidenceGuidance: c.evidenceGuidance ?? "",
    maxScore: String(c.maxScore),
  };
}

export function FrameworkWorkspace({ frameworkId }: FrameworkWorkspaceProps) {
  const router = useRouter();
  const [criteria, setCriteria] = useState<CriterionDraft[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [isSavingRubric, setIsSavingRubric] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const { data: frameworkData, isLoading, retry: retryFramework } = useClientFetch({
    fetcher: () => getProgramFrameworkById(frameworkId),
    deps: [frameworkId],
    onError: (error) => showAppErrorFromUnknown(error, "frameworks.detail"),
  });

  const { data: versionsData, retry: retryVersions } = useClientFetch({
    fetcher: () => getFrameworkVersions(frameworkId),
    deps: [frameworkId],
    onError: (error) => showAppErrorFromUnknown(error, "frameworks.versions"),
  });

  const framework = frameworkData?.data ?? null;
  const versions = versionsData?.data ?? [];

  const draftVersion =
    versions.find((v) => !v.isPublished) ??
    versions.find((v) => v.id === framework?.currentVersionId) ??
    null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MetadataValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      name: "",
      description: "",
      academicGuidance: "",
      category: "Science",
      minModules: "",
      minOfflineSessions: "",
      minLiveSessions: "",
      requireCapstoneResearchMilestone: false,
    },
  });

  useEffect(() => {
    if (!framework) return;
    reset({
      name: framework.name,
      description: framework.description,
      academicGuidance: framework.academicGuidance ?? "",
      category: framework.category,
      minModules: framework.minModules != null ? String(framework.minModules) : "",
      minOfflineSessions:
        framework.minOfflineSessions != null
          ? String(framework.minOfflineSessions)
          : "",
      minLiveSessions:
        framework.minLiveSessions != null ? String(framework.minLiveSessions) : "",
      requireCapstoneResearchMilestone:
        framework.requireCapstoneResearchMilestone ?? false,
    });
  }, [framework, reset]);

  useEffect(() => {
    const version =
      versions.find((v) => v.id === activeVersionId) ?? draftVersion;
    if (!version) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear when no version
      setCriteria([]);
      return;
    }
    if (activeVersionId !== version.id) {
      setActiveVersionId(version.id);
    }
    setCriteria(
      [...version.criteria]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(criterionFromEntity),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reseed when version list changes
  }, [versionsData?.data, draftVersion?.id, activeVersionId]);

  async function handleSaveMetadata(values: MetadataValues) {
    if (!framework) return;
    setIsSavingMeta(true);
    try {
      const minModules = toCount(values.minModules);
      const minOfflineSessions = toCount(values.minOfflineSessions);
      const minLiveSessions = toCount(values.minLiveSessions);
      await updateProgramFramework(framework.id, {
        name: values.name,
        description: values.description || null,
        academicGuidance: values.academicGuidance || null,
        category: values.category,
        minModules,
        minOfflineSessions,
        minLiveSessions,
        requireCapstoneResearchMilestone: values.requireCapstoneResearchMilestone,
        clearMinModules: minModules == null,
        clearMinOfflineSessions: minOfflineSessions == null,
        clearMinLiveSessions: minLiveSessions == null,
      });
      showAppSuccess({ title: "Đã lưu thông tin khung" });
      retryFramework();
    } catch (error) {
      showAppErrorFromUnknown(error, "frameworks.update");
    } finally {
      setIsSavingMeta(false);
    }
  }

  async function handleSaveRubric() {
    if (!framework || !draftVersion) return;
    setIsSavingRubric(true);
    try {
      await saveFrameworkDraftRubric(framework.id, draftVersion.id, {
        criteria: criteria.map((c, index) => ({
          name: c.name.trim(),
          description: c.description.trim() || null,
          evidenceGuidance: c.evidenceGuidance.trim() || null,
          maxScore: Number(c.maxScore),
          displayOrder: index,
        })),
      });
      showAppSuccess({ title: "Đã lưu rubric" });
      retryVersions();
      retryFramework();
    } catch (error) {
      showAppErrorFromUnknown(error, "frameworks.criteria");
    } finally {
      setIsSavingRubric(false);
    }
  }

  async function handleCreateDraft() {
    try {
      const result = await createFrameworkDraftVersion(frameworkId);
      showAppSuccess({ title: "Đã tạo phiên bản nháp" });
      if (result?.data?.id) setActiveVersionId(result.data.id);
      retryVersions();
      retryFramework();
    } catch (error) {
      showAppErrorFromUnknown(error, "frameworks.versions");
    }
  }

  async function handlePublish() {
    if (!framework || !draftVersion) return;
    setIsPublishing(true);
    try {
      await publishFrameworkVersion(framework.id, draftVersion.id);
      showAppSuccess({
        title: "Đã xuất bản phiên bản",
        description:
          "Chương trình đang dùng phiên bản cũ sẽ không tự nâng cấp — Manager cần chọn phiên bản mới khi gửi duyệt.",
      });
      setShowPublishConfirm(false);
      retryVersions();
      retryFramework();
    } catch (error) {
      showAppErrorFromUnknown(error, "frameworks.versions");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleArchive() {
    try {
      await archiveProgramFramework(frameworkId);
      showAppSuccess({ title: "Đã lưu trữ khung chương trình" });
      router.push("/expert/frameworks");
    } catch (error) {
      showAppErrorFromUnknown(error, "frameworks.delete");
      throw error;
    }
  }

  function addCriterion() {
    setCriteria((prev) => [
      ...prev,
      {
        key: createCriterionKey(),
        id: null,
        name: "",
        description: "",
        evidenceGuidance: "",
        maxScore: "10",
      },
    ]);
  }

  function removeCriterion(key: string) {
    setCriteria((prev) => prev.filter((c) => c.key !== key));
  }

  function updateCriterion(key: string, patch: Partial<CriterionDraft>) {
    setCriteria((prev) =>
      prev.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    );
  }

  if (isLoading || !framework) {
    return (
      <div className="space-y-4 px-6 pb-12">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title={framework.name || "Khung chương trình"}
        description="Biên tập mục đích, quy tắc cấu trúc, rubric và lịch sử phiên bản."
        breadcrumbs={[
          { label: "Khung chương trình", href: "/expert/frameworks" },
          { label: framework.name },
        ]}
      >
        <Button
          nativeButton={false}
          render={<Link href="/expert/frameworks" />}
          variant="outline"
          className="h-11 gap-2 rounded-xl"
        >
          <ArrowLeft className="size-4" />
          Về danh sách
        </Button>
      </ManagerPageHeader>

      <div className="space-y-6 px-6 pb-12">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
            <BookOpen className="size-4 text-primary" />
            Mục đích & lĩnh vực
          </h2>
          <form
            className="mt-4 grid gap-4 lg:grid-cols-2"
            onSubmit={handleSubmit((values) => void handleSaveMetadata(values))}
          >
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="fw-name">Tên khung</Label>
              <Input id="fw-name" {...register("name")} className="rounded-xl" />
              {errors.name ? (
                <p className="text-xs text-primary">{errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="fw-desc">Mô tả</Label>
              <Textarea id="fw-desc" rows={3} {...register("description")} className="rounded-xl" />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="fw-guidance">Hướng dẫn học thuật</Label>
              <Textarea
                id="fw-guidance"
                rows={3}
                {...register("academicGuidance")}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Lĩnh vực</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={THEME_SELECT_TRIGGER}>
                      {PROGRAM_CATEGORY_META[field.value].label}
                    </SelectTrigger>
                    <SelectContent className={THEME_SELECT_CONTENT}>
                      {PROGRAM_CATEGORY_ORDER.map((cat) => (
                        <SelectItem key={cat} value={cat} className={THEME_SELECT_ITEM}>
                          {PROGRAM_CATEGORY_META[cat].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isSavingMeta}
                className="h-10 rounded-xl bg-primary px-5 font-semibold text-white"
              >
                {isSavingMeta ? "Đang lưu…" : "Lưu thông tin"}
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <h2 className="font-heading text-sm font-bold text-foreground">
            Quy tắc cấu trúc
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Để trống = không ràng buộc. Số buổi offline/live là mẫu hoạt động trong
            curriculum (không phải buổi lớp đã lên lịch).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fw-min-modules">Tối thiểu học phần</Label>
              <Input id="fw-min-modules" {...register("minModules")} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fw-min-offline">Mẫu offline tối thiểu</Label>
              <Input id="fw-min-offline" {...register("minOfflineSessions")} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fw-min-live">Mẫu live tối thiểu</Label>
              <Input id="fw-min-live" {...register("minLiveSessions")} className="rounded-xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Controller
              control={control}
              name="requireCapstoneResearchMilestone"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              )}
            />
            <Label>Bắt buộc mốc nghiên cứu / capstone</Label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
              <ListChecks className="size-4 text-primary" />
              Rubric thẩm định
            </h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={addCriterion}
                className="h-9 gap-1.5 rounded-lg text-xs font-semibold"
              >
                <Plus className="size-3.5" />
                Thêm tiêu chí
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveRubric()}
                disabled={isSavingRubric || !draftVersion}
                className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-white"
              >
                {isSavingRubric ? "Đang lưu…" : "Lưu rubric"}
              </Button>
            </div>
          </div>

          {!draftVersion ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Chưa có phiên bản nháp. Tạo phiên bản nháp để chỉnh rubric.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {criteria.map((criterion) => (
                <div
                  key={criterion.key}
                  className="rounded-xl border border-border bg-background/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid flex-1 gap-3 sm:grid-cols-2">
                      <Input
                        value={criterion.name}
                        onChange={(e) =>
                          updateCriterion(criterion.key, { name: e.target.value })
                        }
                        placeholder="Tên tiêu chí"
                        className="rounded-lg"
                      />
                      <Input
                        value={criterion.maxScore}
                        onChange={(e) =>
                          updateCriterion(criterion.key, { maxScore: e.target.value })
                        }
                        inputMode="numeric"
                        placeholder="Điểm tối đa"
                        className="rounded-lg"
                      />
                      <Input
                        value={criterion.description}
                        onChange={(e) =>
                          updateCriterion(criterion.key, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Mô tả"
                        className="rounded-lg sm:col-span-2"
                      />
                      <Textarea
                        value={criterion.evidenceGuidance}
                        onChange={(e) =>
                          updateCriterion(criterion.key, {
                            evidenceGuidance: e.target.value,
                          })
                        }
                        placeholder="Gợi ý minh chứng cho chuyên gia"
                        rows={2}
                        className="rounded-lg sm:col-span-2"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCriterion(criterion.key)}
                      aria-label="Xóa tiêu chí"
                      className="size-9 text-primary"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
              <History className="size-4 text-primary" />
              Lịch sử phiên bản
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCreateDraft()}
                className="h-9 rounded-lg text-xs font-semibold"
              >
                Tạo phiên bản nháp
              </Button>
              {draftVersion && !draftVersion.isPublished ? (
                <Button
                  type="button"
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={isPublishing}
                  className="h-9 gap-1.5 rounded-lg bg-[#7CB342] px-4 text-xs font-semibold text-white"
                >
                  <Rocket className="size-3.5" />
                  Xuất bản
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowArchiveConfirm(true)}
                className="h-9 gap-1.5 rounded-lg text-xs font-semibold text-primary"
              >
                <Archive className="size-3.5" />
                Lưu trữ
              </Button>
            </div>
          </div>

          <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
            {versions.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                Chưa có phiên bản.
              </li>
            ) : (
              versions.map((version: ProgramFrameworkVersion) => (
                <li
                  key={version.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Phiên bản {version.versionNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {version.criteria.length} tiêu chí ·{" "}
                      {version.isPublished ? "Đã xuất bản" : "Nháp"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {version.isPublished ? (
                      <Badge className="rounded-md bg-[#7CB342]/15 text-[11px] text-[#33691e]">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-md text-[11px]">
                        Draft
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveVersionId(version.id)}
                      className="h-8 rounded-lg text-xs"
                    >
                      Chỉnh sửa
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <ConfirmDialog
        isOpen={showPublishConfirm}
        onOpenChange={setShowPublishConfirm}
        title="Xuất bản phiên bản khung?"
        description="Chương trình đang dùng phiên bản cũ sẽ không tự nâng cấp. Manager phải chọn phiên bản mới khi gửi thẩm định."
        confirmLabel="Xuất bản"
        onConfirm={handlePublish}
      />

      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title="Lưu trữ khung chương trình?"
        description="Khung sẽ không còn dùng cho chương trình mới. Các chương trình đã gán vẫn giữ phiên bản hiện tại."
        confirmLabel="Lưu trữ"
        variant="destructive"
        onConfirm={handleArchive}
      />
    </div>
  );
}
