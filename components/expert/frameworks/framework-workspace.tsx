"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ArrowLeft,
  Archive,
  BookOpen,
  GitBranch,
  History,
  Info,
  ListChecks,
  LockKeyhole,
  Rocket,
} from "lucide-react";

import { FrameworkRulesSection } from "@/components/expert/frameworks/framework-rules-section";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  ExpertWorkbenchHero,
  ExpertWorkflowRail,
} from "@/components/expert/shared/expert-workbench";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  updateProgramFramework,
  type ProgramFrameworkVersion,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  toFrameworkRuleFormValues,
  toFrameworkRuleUpdate,
  toFrameworkRuleValues,
} from "@/lib/frameworks/rule-fields";
import { buildFrameworkRules } from "@/lib/frameworks/rule-labels";
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
import {
  frameworkEditorFormSchema,
  type FrameworkEditorFormValues,
} from "@/lib/validations/program-frameworks";

type FrameworkWorkspaceProps = {
  frameworkId: string;
};

const EMPTY_FORM_VALUES: FrameworkEditorFormValues = {
  name: "",
  description: "",
  academicGuidance: "",
  category: "Science",
  ...toFrameworkRuleFormValues({}),
};

const SECTION_CLASS =
  "rounded-2xl border border-border bg-card p-5 shadow-[0_4px_18px_rgba(45,45,45,0.04)] sm:p-6";

export function FrameworkWorkspace({ frameworkId }: FrameworkWorkspaceProps) {
  const router = useRouter();
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
    formState: { errors, isDirty },
  } = useForm<FrameworkEditorFormValues>({
    resolver: zodResolver(frameworkEditorFormSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });

  useEffect(() => {
    if (!framework || !selectedVersion) return;
    reset({
      name: framework.name,
      description: selectedVersion.description,
      academicGuidance: selectedVersion.academicGuidance,
      category: framework.category,
      ...toFrameworkRuleFormValues(selectedVersion),
    });
  }, [framework, selectedVersion, reset]);

  const watchedValues = useWatch({ control });
  const activeRules = buildFrameworkRules(toFrameworkRuleValues(watchedValues));

  async function handleSave(values: FrameworkEditorFormValues) {
    if (!framework || !isEditingDraft) return;
    setIsSaving(true);
    try {
      await updateProgramFramework(framework.id, {
        name: values.name,
        description: values.description || null,
        academicGuidance: values.academicGuidance || null,
        category: values.category,
        ...toFrameworkRuleUpdate(values),
      });
      showAppSuccess({ title: "Đã lưu khung và quy tắc" });
      reset(values);
      retryVersions();
      retryFramework();
    } catch (error) {
      showAppErrorFromUnknown(error, "frameworks.update");
    } finally {
      setIsSaving(false);
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
          "Chương trình đang dùng phiên bản cũ sẽ không tự nâng cấp. Manager cần chủ động chuyển chương trình sang phiên bản mới.",
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

  function selectVersion(versionId: string) {
    if (
      isDirty &&
      !window.confirm("Khung có thay đổi chưa lưu. Bạn có muốn bỏ các thay đổi này?")
    ) {
      return;
    }
    setActiveVersionId(versionId);
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
      <ExpertWorkbenchHero
        eyebrow="Bộ khung thẩm định"
        title={framework.name || "Khung chưa đặt tên"}
        description="Khung đặt chuẩn học thuật và các quy tắc kiểm tra curriculum tự động. Phiên bản đã xuất bản được giữ nguyên."
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
              detail: "Định hướng sư phạm cho người thiết kế curriculum.",
              state: "done",
            },
            {
              label: "Quy tắc tự động",
              detail: "Chọn điều kiện curriculum phải đạt trước khi chấp thuận.",
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
            onSubmit={handleSubmit((values) => void handleSave(values))}
          >
            <fieldset disabled={!isEditingDraft} className="space-y-5 disabled:opacity-75">
              <section className={SECTION_CLASS}>
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
                    {errors.description ? (
                      <p className="text-xs text-primary">{errors.description.message}</p>
                    ) : null}
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

              <section className={SECTION_CLASS}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">02 · Chuẩn nền</p>
                  <h2 className="mt-1 font-heading text-lg font-bold text-foreground">Chuẩn học thuật</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Định hướng sư phạm cho người thiết kế curriculum và cho chuyên gia khi góp ý.
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
                  {errors.academicGuidance ? (
                    <p className="text-xs text-primary">{errors.academicGuidance.message}</p>
                  ) : null}
                </div>
              </section>

              <section className={SECTION_CLASS}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">03 · Kiểm tra</p>
                  <h2 className="mt-1 flex items-center gap-2 font-heading text-lg font-bold text-foreground">
                    <ListChecks className="size-5 text-primary" /> Quy tắc tự động
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                    Hệ thống tự kiểm tra curriculum theo các quy tắc này; chương trình chỉ được chấp thuận khi mọi quy tắc đều đạt. Để trống ô số để tắt quy tắc đó.
                  </p>
                </div>
                <FrameworkRulesSection
                  control={control}
                  register={register}
                  errors={errors}
                  disabled={!isEditingDraft}
                />
              </section>
            </fieldset>

            {isEditingDraft ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3.5">
                <p className="text-sm text-muted-foreground">
                  {isDirty ? "Có thay đổi chưa lưu." : "Mọi thay đổi đã được lưu."}
                </p>
                <Button
                  type="submit"
                  disabled={isSaving || !isDirty}
                  className="h-10 rounded-xl bg-primary px-5 font-semibold text-white hover:bg-primary/90 active:scale-[0.98]"
                >
                  {isSaving ? "Đang lưu…" : "Lưu khung & quy tắc"}
                </Button>
              </div>
            ) : null}
          </form>
        </main>

        <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-background/70 px-4 py-3.5">
              <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                <ListChecks className="size-4 text-primary" />
                Quy tắc đang bật
              </h2>
              <Badge variant="secondary" className="rounded-md font-mono text-[11px]">
                {activeRules.length}
              </Badge>
            </div>
            {activeRules.length === 0 ? (
              <p className="px-4 py-5 text-sm leading-6 text-muted-foreground">
                Chưa bật quy tắc nào. Chương trình gán khung này sẽ luôn đạt phần kiểm tra tự động.
              </p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto px-4 py-4 text-sm leading-5 text-foreground">
                {activeRules.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

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
                    disabled={isPublishing || isDirty}
                    title={isDirty ? "Lưu thay đổi trước khi xuất bản" : undefined}
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
                  const ruleCount = buildFrameworkRules(version).length;

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
                            {ruleCount > 0 ? `${ruleCount} quy tắc` : "Chưa có quy tắc"}
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
        description="Chương trình đang dùng phiên bản cũ sẽ không tự nâng cấp. Manager cần chủ động chuyển chương trình sang phiên bản mới."
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
