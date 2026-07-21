"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Award, BriefcaseBusiness, Link2, UserRound } from "lucide-react";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Expert, Program } from "@/lib/api";
import { expertUpsertSchema } from "@/lib/validations/experts";
import { cn } from "@/lib/utils";

export type ExpertFormValues = z.infer<typeof expertUpsertSchema>;

type ExpertFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expert: Expert | null;
  defaultProgramId?: string;
  programs: Program[];
  isProgramsLoading: boolean;
  isSubmitting: boolean;
  onSubmit: (values: ExpertFormValues) => Promise<void>;
};

const INPUT_CLASS =
  "h-11 rounded-xl border-[#DDDDD8] bg-white text-sm text-[#2D2D2D] focus-visible:ring-[#4FC3F7]/50";
const TEXTAREA_CLASS =
  "w-full resize-none rounded-xl border border-[#DDDDD8] bg-white px-3.5 py-3 text-sm text-[#2D2D2D] outline-none transition-colors placeholder:text-[#9A9A94] focus:border-[#4FC3F7] focus:ring-2 focus:ring-[#4FC3F7]/30";

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
}: ExpertFormDialogProps) {
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpertFormValues>({
    resolver: zodResolver(expertUpsertSchema),
    defaultValues: toDefaultValues(expert, defaultProgramId),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "programs" });

  useEffect(() => {
    if (open) reset(toDefaultValues(expert, defaultProgramId));
  }, [defaultProgramId, expert, open, reset]);

  const avatarUrl = useWatch({ control, name: "avatarUrl" });
  const fullName = useWatch({ control, name: "fullName" });
  const selectedPrograms = useWatch({ control, name: "programs" });
  const visibleSelectedCount = selectedPrograms.filter((selected) =>
    programs.some((program) => program.id === selected.programId),
  ).length;

  function toggleProgram(programId: string, checked: boolean) {
    const index = fields.findIndex((field) => field.programId === programId);
    if (checked && index === -1) {
      append({ programId, roleInBoard: "" });
    } else if (!checked && index >= 0) {
      remove(index);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[calc(100dvh-2rem)] max-w-4xl overflow-y-auto p-0">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="border-b border-[#E8E8E3] px-6 py-5 pr-14">
            <DialogTitle>
              {expert ? "Cập nhật hồ sơ chuyên gia" : "Thêm chuyên gia"}
            </DialogTitle>
            <DialogDescription>
              Quản lý thông tin hồ sơ và vai trò của chuyên gia trong từng chương trình.
            </DialogDescription>
          </DialogHeader>
          <DialogClose />

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#E8E8E3] bg-[#FAFAF5] p-5 text-center">
                <Avatar className="mx-auto size-24 border-4 border-white shadow-sm">
                  <AvatarImage src={avatarUrl || undefined} alt={fullName || "Chuyên gia"} />
                  <AvatarFallback className="bg-[#4FC3F7]/15 font-heading text-xl font-bold text-[#0D6E9C]">
                    {getInitials(fullName) || <UserRound className="size-7" />}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-3 truncate font-heading text-sm font-bold text-[#2D2D2D]">
                  {fullName || "Chuyên gia mới"}
                </p>
                <p className="mt-1 text-xs text-[#6B6B6B]">
                  {visibleSelectedCount} chương trình được chọn
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">URL ảnh đại diện</Label>
                <Input
                  id="avatarUrl"
                  placeholder="https://..."
                  {...register("avatarUrl")}
                  className={INPUT_CLASS}
                />
                <FieldError message={errors.avatarUrl?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedInUrl">LinkedIn</Label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-3.5 size-4 text-[#8A8A84]" />
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
                  <FormField
                    id="userId"
                    label="ID tài khoản liên kết"
                    error={errors.userId?.message}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="userId"
                      placeholder="Để trống nếu chuyên gia chưa có tài khoản"
                      {...register("userId")}
                      className={cn(INPUT_CLASS, "font-mono")}
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
              </FormSection>

              <FormSection icon={BriefcaseBusiness} title="Chương trình tham gia">
                <p className="-mt-2 text-xs leading-5 text-[#6B6B6B]">
                  Chọn chương trình và ghi rõ vai trò của chuyên gia trong hội đồng.
                </p>
                {isProgramsLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-14 animate-pulse rounded-xl bg-[#F5F5F0]"
                      />
                    ))}
                  </div>
                ) : programs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#D8D8D2] p-5 text-center text-sm text-[#6B6B6B]">
                    Chưa có chương trình để gán.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {programs.map((program) => {
                      const fieldIndex = fields.findIndex(
                        (field) => field.programId === program.id,
                      );
                      const isSelected = fieldIndex >= 0;
                      return (
                        <div
                          key={program.id}
                          className={cn(
                            "grid gap-3 rounded-xl border p-3 transition-colors sm:grid-cols-[minmax(0,1fr)_220px]",
                            isSelected
                              ? "border-[#4FC3F7]/60 bg-[#4FC3F7]/5"
                              : "border-[#E8E8E3] bg-white",
                          )}
                        >
                          <label className="flex min-w-0 cursor-pointer items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                toggleProgram(program.id, checked === true)
                              }
                              className="border-[#A8A8A2] data-checked:border-[#E94B3C] data-checked:bg-[#E94B3C]"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-[#2D2D2D]">
                                {program.name}
                              </span>
                              <span className="font-mono text-[11px] text-[#7A7A74]">
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
                                  className="h-9 rounded-lg border-[#D8D8D2] bg-white text-xs"
                                />
                              )}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </FormSection>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 border-t border-[#E8E8E3] bg-white/95 px-6 py-4 backdrop-blur-sm">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-11 rounded-xl border-[#D8D8D2] px-5"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-xl bg-[#E94B3C] px-6 font-semibold text-white hover:bg-[#D94134] active:scale-[0.98]"
            >
              {isSubmitting
                ? "Đang lưu..."
                : expert
                  ? "Lưu thay đổi"
                  : "Tạo chuyên gia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
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
    <section className="space-y-4 border-t border-[#ECECE7] pt-5 first:border-t-0 first:pt-0">
      <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-[#2D2D2D]">
        <Icon className="size-4 text-[#E94B3C]" />
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
        {required ? <span className="ml-1 text-[#E94B3C]">*</span> : null}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-[#C9362B]">{message}</p>;
}
