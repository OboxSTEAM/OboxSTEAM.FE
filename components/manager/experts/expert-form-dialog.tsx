"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  Award,
  BriefcaseBusiness,
  GraduationCap,
  ImagePlus,
  Link2,
  Loader2,
  Search,
  UserRound,
} from "lucide-react";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogScrollBody,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollPopup,
  DialogTitle,
  dialogScrollFormClassName,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EMPTY_CREDENTIAL_DRAFTS,
  uploadExpertAvatar,
  type Expert,
  type ExpertCredentialDrafts,
  type Program,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { expertUpsertSchema, uploadExpertAvatarSchema } from "@/lib/validations/experts";
import { cn } from "@/lib/utils";

import { ExpertCredentialsEditor } from "./expert-credentials-editor";

export type ExpertFormValues = z.infer<typeof expertUpsertSchema>;

type ExpertFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expert: Expert | null;
  defaultProgramId?: string;
  programs: Program[];
  isProgramsLoading: boolean;
  isSubmitting: boolean;
  onSubmit: (
    values: ExpertFormValues,
    drafts: ExpertCredentialDrafts,
  ) => Promise<void>;
  onExpertChange?: (expert: Expert) => void;
};

const INPUT_CLASS =
  "h-11 rounded-xl border-input bg-card text-sm text-foreground focus-visible:ring-ring/50";
const TEXTAREA_CLASS =
  "w-full resize-none rounded-xl border border-input bg-card px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function toDefaultValues(
  expert: Expert | null,
  defaultProgramId?: string,
): ExpertFormValues {
  const assignedPrograms =
    expert?.programs.map((program) => ({
      programId: program.programId,
      roleInBoard: program.roleInBoard,
    })) ?? [];

  if (
    defaultProgramId &&
    !assignedPrograms.some((program) => program.programId === defaultProgramId)
  ) {
    assignedPrograms.push({ programId: defaultProgramId, roleInBoard: "" });
  }

  return {
    code: expert?.code ?? "",
    userId: expert?.userId ?? "",
    fullName: expert?.fullName ?? "",
    title: expert?.title ?? "",
    organization: expert?.organization ?? "",
    bio: expert?.bio ?? "",
    avatarUrl: expert?.avatarUrl ?? "",
    linkedInUrl: expert?.linkedInUrl ?? "",
    achievements: expert?.achievements ?? "",
    specialization: expert?.specialization ?? [],
    programs: assignedPrograms,
  };
}

export function ExpertFormDialog({
  open,
  onOpenChange,
  expert,
  defaultProgramId,
  programs,
  isProgramsLoading,
  isSubmitting,
  onSubmit,
  onExpertChange,
}: ExpertFormDialogProps) {
  const expertId = expert?.id ?? null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [credentialDrafts, setCredentialDrafts] = useState<ExpertCredentialDrafts>(
    EMPTY_CREDENTIAL_DRAFTS,
  );
  const [programQuery, setProgramQuery] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [specializationText, setSpecializationText] = useState(
    expert?.specialization.join(", ") ?? "",
  );

  const {
    control,
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ExpertFormValues>({
    resolver: zodResolver(expertUpsertSchema),
    defaultValues: toDefaultValues(expert, defaultProgramId),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "programs" });

  useEffect(() => {
    if (!open) return;
    reset(toDefaultValues(expert, defaultProgramId));
    setProgramQuery("");
    setSpecializationText(expert?.specialization.join(", ") ?? "");
    setCredentialDrafts(EMPTY_CREDENTIAL_DRAFTS);
    // Only reset when the dialog opens or the expert identity changes — not when
    // nested credentials update the same expert object.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [defaultProgramId, expertId, open, reset]);

  const avatarUrl = useWatch({ control, name: "avatarUrl" });
  const fullName = useWatch({ control, name: "fullName" });
  const selectedPrograms = useWatch({ control, name: "programs" }) ?? [];
  const visibleSelectedCount = selectedPrograms.filter((selected) =>
    programs.some((program) => program.id === selected.programId),
  ).length;
  const visiblePrograms = useMemo(() => {
    const query = programQuery.trim().toLowerCase();
    const selectedIds = new Set(selectedPrograms.map((item) => item.programId));
    const matches = (program: Program) => {
      if (!query) return true;
      return (
        program.name.toLowerCase().includes(query) ||
        program.code.toLowerCase().includes(query)
      );
    };
    return [...programs]
      .filter((program) => selectedIds.has(program.id) || matches(program))
      .sort((left, right) => {
        const leftSelected = selectedIds.has(left.id) ? 0 : 1;
        const rightSelected = selectedIds.has(right.id) ? 0 : 1;
        if (leftSelected !== rightSelected) return leftSelected - rightSelected;
        return left.name.localeCompare(right.name, "vi");
      });
  }, [programQuery, programs, selectedPrograms]);

  function toggleProgram(programId: string, checked: boolean) {
    const index = fields.findIndex((field) => field.programId === programId);
    if (checked && index === -1) {
      append({ programId, roleInBoard: "" });
    } else if (!checked && index >= 0) {
      remove(index);
    }
  }

  async function handleAvatarFile(file: File) {
    if (!expertId) return;

    const parsed = uploadExpertAvatarSchema.safeParse({ file });
    if (!parsed.success) {
      showAppErrorFromUnknown(parsed.error, "experts.upload-avatar");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await uploadExpertAvatar(expertId, parsed.data.file);
      if (!result?.data) {
        throw new Error("Không nhận được hồ sơ chuyên gia sau khi tải ảnh.");
      }
      const nextUrl = result.data.avatarUrl ?? "";
      setValue("avatarUrl", nextUrl, { shouldDirty: true, shouldValidate: true });
      onExpertChange?.(result.data);
      showAppSuccess({
        title: "Đã cập nhật ảnh đại diện",
        description: result.message,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "experts.upload-avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogScrollPopup className="max-w-6xl">
        <form
          onSubmit={handleSubmit((values) => onSubmit(values, credentialDrafts))}
          className={dialogScrollFormClassName}
        >
          <DialogScrollHeader>
            <DialogTitle>
              {expert ? "Cập nhật hồ sơ chuyên gia" : "Thêm chuyên gia"}
            </DialogTitle>
            <DialogDescription>
              Quản lý thông tin hồ sơ và vai trò của chuyên gia trong từng chương trình.
            </DialogDescription>
          </DialogScrollHeader>
          <DialogClose />

          <DialogScrollBody className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <div className="rounded-2xl border border-border bg-background p-5 text-center">
                <Avatar className="mx-auto size-24 border-4 border-white shadow-sm">
                  <AvatarImage src={avatarUrl || undefined} alt={fullName || "Chuyên gia"} />
                  <AvatarFallback className="bg-[#4FC3F7]/15 font-heading text-xl font-bold text-[#0D6E9C] dark:text-[#7dd3fc]">
                    {getInitials(fullName) || <UserRound className="size-7" />}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-3 truncate font-heading text-sm font-bold text-foreground">
                  {fullName || "Chuyên gia mới"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {visibleSelectedCount} chương trình được chọn
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={expertId ? "avatar-file" : "avatarUrl"}>
                  Ảnh đại diện
                </Label>
                {expertId ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingAvatar || isSubmitting}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-11 w-full gap-2 rounded-xl"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ImagePlus className="size-4" />
                      )}
                      {avatarUrl ? "Tải ảnh mới" : "Tải ảnh lên"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      id="avatar-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void handleAvatarFile(file);
                      }}
                    />
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      JPG/PNG · tối đa 5 MB. Ảnh được lưu ngay qua API avatar.
                    </p>
                  </>
                ) : (
                  <>
                    <Input
                      id="avatarUrl"
                      placeholder="https://... (hoặc tải ảnh sau khi tạo)"
                      {...register("avatarUrl")}
                      className={INPUT_CLASS}
                    />
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Sau khi tạo chuyên gia, bạn có thể tải ảnh lên trực tiếp.
                    </p>
                  </>
                )}
                <FieldError message={errors.avatarUrl?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedInUrl">LinkedIn</Label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    id="linkedInUrl"
                    placeholder="https://linkedin.com/in/..."
                    {...register("linkedInUrl")}
                    className={cn(INPUT_CLASS, "pl-9")}
                  />
                </div>
                <FieldError message={errors.linkedInUrl?.message} />
              </div>
            </aside>

            <div className="min-w-0 space-y-6">
              <FormSection icon={UserRound} title="Thông tin cơ bản">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id="fullName"
                    label="Họ và tên"
                    required
                    error={errors.fullName?.message}
                  >
                    <Input
                      id="fullName"
                      placeholder="TS. Nguyễn Minh An"
                      {...register("fullName")}
                      className={INPUT_CLASS}
                    />
                  </FormField>
                  <FormField
                    id="code"
                    label="Mã chuyên gia"
                    required
                    error={errors.code?.message}
                  >
                    <Input
                      id="code"
                      placeholder="EXP-001"
                      {...register("code")}
                      className={cn(INPUT_CLASS, "font-mono")}
                    />
                  </FormField>
                  <FormField id="title" label="Chức danh" error={errors.title?.message}>
                    <Input
                      id="title"
                      placeholder="Tiến sĩ Khoa học Máy tính"
                      {...register("title")}
                      className={INPUT_CLASS}
                    />
                  </FormField>
                  <FormField
                    id="organization"
                    label="Tổ chức"
                    error={errors.organization?.message}
                  >
                    <Input
                      id="organization"
                      placeholder="Đại học Bách khoa Hà Nội"
                      {...register("organization")}
                      className={INPUT_CLASS}
                    />
                  </FormField>
                </div>
                <FormField id="bio" label="Giới thiệu" error={errors.bio?.message}>
                  <textarea
                    id="bio"
                    rows={4}
                    placeholder="Tóm tắt chuyên môn và kinh nghiệm nổi bật..."
                    {...register("bio")}
                    className={TEXTAREA_CLASS}
                  />
                </FormField>
                <FormField
                  id="achievements"
                  label="Thành tựu"
                  error={errors.achievements?.message}
                >
                  <textarea
                    id="achievements"
                    rows={3}
                    placeholder="Các công trình, giải thưởng hoặc đóng góp nổi bật..."
                    {...register("achievements")}
                    className={TEXTAREA_CLASS}
                  />
                </FormField>
                <FormField
                  id="specialization"
                  label="Chuyên môn"
                  error={errors.specialization?.message}
                >
                  <Input
                    id="specialization"
                    placeholder="Robotics, STEM, Lập trình (cách nhau bằng dấu phẩy)"
                    value={specializationText}
                    onChange={(event) => {
                      const next = event.target.value;
                      setSpecializationText(next);
                      const tags = next
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean);
                      setValue("specialization", tags, { shouldValidate: true });
                    }}
                    className={INPUT_CLASS}
                  />
                </FormField>
              </FormSection>

              <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
              <FormSection icon={BriefcaseBusiness} title="Chương trình tham gia">
                <p className="-mt-2 text-xs leading-5 text-muted-foreground">
                  Chọn chương trình và ghi rõ vai trò của chuyên gia trong hội đồng.
                </p>
                {isProgramsLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-14 animate-pulse rounded-xl bg-muted"
                      />
                    ))}
                  </div>
                ) : programs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    Chưa có chương trình để gán.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input
                        value={programQuery}
                        onChange={(event) => setProgramQuery(event.target.value)}
                        placeholder="Tìm theo tên hoặc mã chương trình..."
                        className={cn(INPUT_CLASS, "pl-9")}
                      />
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Đã chọn {visibleSelectedCount}/{programs.length} chương trình
                      {programQuery.trim()
                        ? ` · ${visiblePrograms.length} kết quả`
                        : ""}
                    </p>
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {visiblePrograms.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                          Không có chương trình khớp “{programQuery.trim()}”.
                        </p>
                      ) : (
                        visiblePrograms.map((program) => {
                      const fieldIndex = fields.findIndex(
                        (field) => field.programId === program.id,
                      );
                      const isSelected = fieldIndex >= 0;
                      return (
                        <div
                          key={program.id}
                          className={cn(
                            "grid gap-3 rounded-xl border p-3 transition-colors sm:grid-cols-[minmax(0,1fr)_minmax(0,180px)]",
                            isSelected
                              ? "border-[#4FC3F7]/60 bg-[#4FC3F7]/5"
                              : "border-border bg-card",
                          )}
                        >
                          <label className="flex min-w-0 cursor-pointer items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                toggleProgram(program.id, checked === true)
                              }
                              className="border-input data-checked:border-primary data-checked:bg-primary"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {program.name}
                              </span>
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {program.code}
                              </span>
                            </span>
                          </label>
                          {isSelected ? (
                            <Controller
                              control={control}
                              name={`programs.${fieldIndex}.roleInBoard`}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  placeholder="Vai trò trong hội đồng"
                                  className="h-9 rounded-lg border-border bg-card text-xs"
                                />
                              )}
                            />
                          ) : null}
                        </div>
                      );
                        })
                      )}
                    </div>
                  </div>
                )}
              </FormSection>

              <FormSection icon={GraduationCap} title="Hồ sơ chuyên môn">
                <p className="-mt-2 text-xs leading-5 text-muted-foreground">
                  {expert
                    ? "Bằng cấp và bài báo lưu ngay khi thêm hoặc sửa."
                    : "Thêm trước vào form. Hệ thống sẽ lưu cùng lúc khi tạo chuyên gia."}
                </p>
                <ExpertCredentialsEditor
                  expert={expert}
                  drafts={credentialDrafts}
                  onDraftsChange={setCredentialDrafts}
                  onExpertChange={(next) => onExpertChange?.(next)}
                />
              </FormSection>
              </div>
            </div>
          </DialogScrollBody>

          <DialogScrollFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-11 rounded-xl border-border px-5"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-xl bg-primary px-6 font-semibold text-white hover:bg-primary/90 active:scale-[0.98]"
            >
              {isSubmitting
                ? "Đang lưu..."
                : expert
                  ? "Lưu thay đổi"
                  : "Tạo chuyên gia"}
            </Button>
          </DialogScrollFooter>
        </form>
      </DialogScrollPopup>
    </Dialog>
  );
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Award;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
        <Icon className="size-4 text-primary" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function FormField({
  id,
  label,
  required,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-1 text-primary">*</span> : null}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-primary">{message}</p>;
}
