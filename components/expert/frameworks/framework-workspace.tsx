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
  GitBranch,
  History,
  Info,
  ListChecks,
  LockKeyhole,
  Plus,
  Rocket,
  Trash2,
} from "lucide-react";
import { z } from "zod";

import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  ExpertWorkbenchHero,
  ExpertWorkflowRail,
} from "@/components/expert/shared/expert-workbench";
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
import { cn } from "@/lib/utils";

const countTextSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^[1-9]\d{0,3}$/.test(value),
    "Để trống nếu không ràng buộc, hoặc nhập số nguyên từ 1 trở lên.",
  );

const metadataSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên khung."),
  description: z.string().trim().max(4000),
  academicGuidance: z.string().trim().max(8000),
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
  const [isRubricDirty, setIsRubricDirty] = useState(false);
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

  const draftVersion = versions.find((v) => !v.isPublished) ?? null;
  const selectedVersion =
    versions.find((v) => v.id === activeVersionId) ??
    draftVersion ??
    versions.find((v) => v.id === framework?.currentVersionId) ??
    versions[0] ??
    null;
  const isEditingDraft =
    selectedVersion != null &&
    draftVersion?.id === selectedVersion.id &&
    !selectedVersion.isPublished;

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
    if (!framework || !selectedVersion) return;
    reset({
      name: framework.name,
      description: selectedVersion.description,
      academicGuidance: selectedVersion.academicGuidance,
      category: framework.category,
      minModules:
        selectedVersion.minModules != null
          ? String(selectedVersion.minModules)
          : "",
      minOfflineSessions:
        selectedVersion.minOfflineSessions != null
          ? String(selectedVersion.minOfflineSessions)
          : "",
      minLiveSessions:
        selectedVersion.minLiveSessions != null
          ? String(selectedVersion.minLiveSessions)
          : "",
      requireCapstoneResearchMilestone:
        selectedVersion.requireCapstoneResearchMilestone ?? false,
    });
  }, [framework, selectedVersion, reset]);

  useEffect(() => {
    const version = selectedVersion;
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
    setIsRubricDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reseed when version list changes
  }, [versionsData?.data, selectedVersion?.id]);

  async function handleSaveMetadata(values: MetadataValues) {
    if (!framework || !isEditingDraft) return;
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
    if (!framework || !selectedVersion || !isEditingDraft) return;
    setIsSavingRubric(true);
    try {
      await saveFrameworkDraftRubric(framework.id, selectedVersion.id, {
        criteria: criteria.map((c, index) => ({
          name: c.name.trim(),
          description: c.description.trim() || null,
          evidenceGuidance: c.evidenceGuidance.trim() || null,
          maxScore: Number(c.maxScore),
          displayOrder: index,
        })),
      });
      showAppSuccess({ title: "Đã lưu rubric" });
      setIsRubricDirty(false);
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
    setIsRubricDirty(true);
  }

  function removeCriterion(key: string) {
    setCriteria((prev) => prev.filter((c) => c.key !== key));
    setIsRubricDirty(true);
  }

  function updateCriterion(key: string, patch: Partial<CriterionDraft>) {
    setCriteria((prev) =>
      prev.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    );
    setIsRubricDirty(true);
  }

  function selectVersion(versionId: string) {
    if (
      isRubricDirty &&
      !window.confirm("Rubric có thay đổi chưa lưu. Bạn có muốn bỏ các thay đổi này?")
    ) {
      return;
    }
    setActiveVersionId(versionId);
  }

  const totalPossibleScore = criteria.reduce((total, criterion) => {
    const value = Number(criterion.maxScore);
    return Number.isFinite(value) ? total + value : total;
  }, 0);

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
      <ExpertWorkbenchHero
        eyebrow="Bộ khung thẩm định"
        title={framework.name || "Khung chưa đặt tên"}
        description="Khung đặt chuẩn cấu trúc; rubric là bộ tiêu chí bạn sẽ chấm khi thẩm định. Phiên bản đã xuất bản được giữ nguyên."
        icon={BookOpen}
        actions={
          <>
            <Button
              nativeButton={false}
              render={<Link href="/expert/frameworks" />}
              variant="outline"
              className="h-10 gap-2 rounded-xl"
            >
              <ArrowLeft className="size-4" />
              Danh sách bộ khung
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowArchiveConfirm(true)}
              className="h-10 gap-2 rounded-xl text-primary"
            >
              <Archive className="size-4" />
              Lưu trữ
            </Button>
          </>
        }
      >
        <ExpertWorkflowRail
          animate
          steps={[
            {
              label: "Phạm vi áp dụng",
              detail: "Nêu đối tượng, cấp độ và mục tiêu của bộ khung.",
              state: "done",
            },
            {
              label: "Chuẩn học thuật",
              detail: "Đặt hướng dẫn và điều kiện cấu trúc tối thiểu.",
              state: "done",
            },
            {
              label: "Rubric & minh chứng",
              detail: "Chuyển chuẩn chuyên môn thành tiêu chí quan sát được.",
              state: isEditingDraft ? "current" : "done",
            },
            {
              label: "Xuất bản",
              detail: "Khóa phiên bản để Manager có thể gán cho chương trình.",
              state: isEditingDraft ? "next" : "done",
            },
          ]}
        />
      </ExpertWorkbenchHero>

      <div className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 pb-12 sm:px-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
            {isEditingDraft ? (
              <Info className="mt-0.5 size-5 shrink-0 text-primary" />
            ) : (
              <LockKeyhole className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            )}
            <div>
              <p className="text-sm font-bold text-foreground">
                {isEditingDraft
                  ? `Đang biên tập bản nháp v${selectedVersion?.versionNumber ?? "—"}`
                  : `Đang xem phiên bản v${selectedVersion?.versionNumber ?? "—"} đã xuất bản`}
              </p>
              <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                {isEditingDraft
                  ? "Các thay đổi chỉ ảnh hưởng bản nháp này cho đến khi bạn xuất bản."
                  : "Phiên bản này chỉ đọc. Chương trình đã gán vẫn giữ nguyên nội dung, kể cả khi có phiên bản mới."}
              </p>
            </div>
          </div>

          <form
            className="space-y-5"
            onSubmit={handleSubmit((values) => void handleSaveMetadata(values))}
          >
            <fieldset disabled={!isEditingDraft} className="space-y-5 disabled:opacity-75">
              <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_4px_18px_rgba(45,45,45,0.04)] sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">01 · Bối cảnh</p>
                  <h2 className="mt-1 font-heading text-lg font-bold text-foreground">Phạm vi áp dụng</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Giúp người thiết kế chương trình hiểu bộ khung dành cho ai và kết quả học tập nào được kỳ vọng.
                  </p>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="fw-name">Tên bộ khung</Label>
                    <Input id="fw-name" {...register("name")} className="h-11 rounded-xl" />
                    {errors.name ? <p className="text-xs text-primary">{errors.name.message}</p> : null}
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="fw-desc">Mục đích và phạm vi sử dụng</Label>
                    <Textarea
                      id="fw-desc"
                      rows={4}
                      placeholder="Ví dụ: dùng cho chương trình Robotics nhập môn 10–13 tuổi; ưu tiên tư duy thiết kế, an toàn và khả năng giải thích lựa chọn kỹ thuật."
                      {...register("description")}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lĩnh vực STEAM chính</Label>
                    <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={!isEditingDraft}>
                          <SelectTrigger className={THEME_SELECT_TRIGGER}>{PROGRAM_CATEGORY_META[field.value].label}</SelectTrigger>
                          <SelectContent className={THEME_SELECT_CONTENT}>
                            {PROGRAM_CATEGORY_ORDER.map((cat) => (
                              <SelectItem key={cat} value={cat} className={THEME_SELECT_ITEM}>{PROGRAM_CATEGORY_META[cat].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_4px_18px_rgba(45,45,45,0.04)] sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">02 · Chuẩn nền</p>
                  <h2 className="mt-1 font-heading text-lg font-bold text-foreground">Chuẩn học thuật & điều kiện cấu trúc</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Số buổi là mẫu hoạt động trong curriculum, không phải lịch lớp. Để trống nghĩa là không ràng buộc.
                  </p>
                </div>
                <div className="mt-5 space-y-2">
                  <Label htmlFor="fw-guidance">Hướng dẫn học thuật cho người thiết kế</Label>
                  <Textarea
                    id="fw-guidance"
                    rows={5}
                    placeholder="Nêu nguyên tắc sư phạm, độ sâu kiến thức, cách tổ chức trải nghiệm và những điều không nên đánh đổi."
                    {...register("academicGuidance")}
                    className="rounded-xl"
                  />
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="fw-min-modules">Học phần tối thiểu</Label>
                    <Input id="fw-min-modules" inputMode="numeric" placeholder="Không ràng buộc" {...register("minModules")} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fw-min-offline">Mẫu offline tối thiểu</Label>
                    <Input id="fw-min-offline" inputMode="numeric" placeholder="Không ràng buộc" {...register("minOfflineSessions")} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fw-min-live">Mẫu live tối thiểu</Label>
                    <Input id="fw-min-live" inputMode="numeric" placeholder="Không ràng buộc" {...register("minLiveSessions")} className="h-11 rounded-xl" />
                  </div>
                </div>
                <Controller
                  control={control}
                  name="requireCapstoneResearchMilestone"
                  render={({ field }) => (
                    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/60 p-4">
                      <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-bold text-foreground">Bắt buộc có mốc nghiên cứu / capstone</span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">Curriculum cần có ít nhất một mốc tổng hợp để học viên chứng minh khả năng vận dụng.</span>
                      </span>
                    </label>
                  )}
                />
                {isEditingDraft ? (
                  <div className="mt-5 flex justify-end border-t border-border pt-4">
                    <Button type="submit" disabled={isSavingMeta} className="h-10 rounded-xl bg-foreground px-5 font-semibold text-background hover:bg-foreground/90">
                      {isSavingMeta ? "Đang lưu…" : "Lưu bối cảnh & quy tắc"}
                    </Button>
                  </div>
                ) : null}
              </section>
            </fieldset>
          </form>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_4px_18px_rgba(45,45,45,0.04)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">03 · Bằng chứng</p>
              <h2 className="mt-1 flex items-center gap-2 font-heading text-lg font-bold text-foreground">
                <ListChecks className="size-5 text-primary" /> Rubric thẩm định
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                Mỗi tiêu chí cần nêu chuẩn cần đạt, minh chứng cần quan sát và điểm tối đa. Điểm số hỗ trợ nhận định, không tự quyết định đậu/rớt.
              </p>
            </div>
            {isEditingDraft ? <div className="flex gap-2">
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
                disabled={isSavingRubric || !isRubricDirty}
                className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-white"
              >
                {isSavingRubric ? "Đang lưu…" : isRubricDirty ? "Lưu rubric" : "Đã lưu"}
              </Button>
            </div> : null}
          </div>

          {criteria.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-border bg-background/50 p-6 text-center">
              <p className="text-sm font-semibold text-foreground">Chưa có tiêu chí thẩm định</p>
              <p className="mt-1 text-sm text-muted-foreground">Nếu xuất bản như hiện tại, chuyên gia chỉ có thể ghi nhận xét tổng quan.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {criteria.map((criterion, index) => (
                <div
                  key={criterion.key}
                  className="rounded-xl border border-border bg-background/50 p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid flex-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`criterion-${criterion.key}-name`}>Tiêu chí {index + 1}</Label>
                        <Input id={`criterion-${criterion.key}-name`} value={criterion.name} onChange={(e) => updateCriterion(criterion.key, { name: e.target.value })} placeholder="Tên năng lực hoặc tiêu chí" disabled={!isEditingDraft} className="rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`criterion-${criterion.key}-score`}>Điểm tối đa</Label>
                        <Input id={`criterion-${criterion.key}-score`} value={criterion.maxScore} onChange={(e) => updateCriterion(criterion.key, { maxScore: e.target.value })} inputMode="numeric" placeholder="10" disabled={!isEditingDraft} className="rounded-lg" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor={`criterion-${criterion.key}-description`}>Chuẩn cần đạt</Label>
                        <Textarea id={`criterion-${criterion.key}-description`} value={criterion.description} onChange={(e) => updateCriterion(criterion.key, { description: e.target.value })} placeholder="Mô tả chất lượng hoặc mức độ chuyên môn mong đợi" rows={2} disabled={!isEditingDraft} className="rounded-lg" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor={`criterion-${criterion.key}-evidence`}>Minh chứng cần quan sát</Label>
                        <Textarea id={`criterion-${criterion.key}-evidence`} value={criterion.evidenceGuidance} onChange={(e) => updateCriterion(criterion.key, { evidenceGuidance: e.target.value })} placeholder="Chỉ ra sản phẩm, hành vi hoặc dấu hiệu giúp chuyên gia đánh giá tiêu chí" rows={3} disabled={!isEditingDraft} className="rounded-lg" />
                      </div>
                    </div>
                    {isEditingDraft ? <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCriterion(criterion.key)}
                      aria-label="Xóa tiêu chí"
                      className="size-9 text-primary"
                    >
                      <Trash2 className="size-4" />
                    </Button> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
            <span className="text-muted-foreground">{criteria.length} tiêu chí</span>
            <span className="font-mono font-bold text-foreground">Tổng {totalPossibleScore} điểm</span>
          </div>
        </section>
        </main>

        <aside className="xl:sticky xl:top-5 xl:self-start">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
            <div className="border-b border-border bg-background/70 px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                  <History className="size-4 text-primary" />
                  Lịch sử phiên bản
                </h2>
                <Badge variant="secondary" className="rounded-md font-mono text-[11px]">
                  {versions.length}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleCreateDraft()}
                  disabled={draftVersion != null}
                  className="h-8 gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold"
                >
                  <GitBranch className="size-3.5" />
                  {draftVersion ? "Đã có nháp" : "Tạo nháp"}
                </Button>
                {isEditingDraft ? (
                  <Button
                    type="button"
                    onClick={() => setShowPublishConfirm(true)}
                    disabled={isPublishing || isRubricDirty}
                    title={
                      isRubricDirty ? "Lưu rubric trước khi xuất bản" : undefined
                    }
                    className="h-8 gap-1.5 rounded-lg bg-primary px-2.5 text-[11px] font-semibold text-white hover:bg-primary/90"
                  >
                    <Rocket className="size-3.5" />
                    {isPublishing ? "Đang xuất bản…" : "Xuất bản"}
                  </Button>
                ) : null}
              </div>
            </div>

            <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto">
              {versions.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Chưa có phiên bản.
                </li>
              ) : (
                versions.map((version: ProgramFrameworkVersion) => {
                  const isSelected = selectedVersion?.id === version.id;
                  const isLive =
                    version.isPublished &&
                    version.id === framework.currentVersionId;
                  const score = version.criteria.reduce(
                    (total, criterion) => total + criterion.maxScore,
                    0,
                  );

                  return (
                    <li
                      key={version.id}
                      className={cn(
                        "px-4 py-3 transition-colors",
                        isSelected && "bg-primary/6",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold tabular-nums text-foreground">
                              v{version.versionNumber}
                            </span>
                            {version.isPublished ? (
                              <Badge
                                variant="secondary"
                                className="rounded-md text-[10px] font-semibold"
                              >
                                {isLive ? "Đang dùng" : "Đã xuất bản"}
                              </Badge>
                            ) : (
                              <Badge className="rounded-md bg-amber-500/12 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                                Bản nháp
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {version.criteria.length} tiêu chí · {score} điểm
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant={isSelected ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => selectVersion(version.id)}
                          className="h-8 shrink-0 rounded-lg px-2.5 text-[11px] font-semibold"
                        >
                          {isSelected
                            ? "Đang xem"
                            : version.isPublished
                              ? "Xem"
                              : "Sửa"}
                        </Button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="flex items-start gap-2 border-t border-border bg-muted/40 px-4 py-3 text-[11px] leading-5 text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <p>
                Manager chỉ gán bản đã xuất bản. Bản mới không tự thay thế chương
                trình đang dùng bản cũ.
              </p>
            </div>
          </section>
        </aside>
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
