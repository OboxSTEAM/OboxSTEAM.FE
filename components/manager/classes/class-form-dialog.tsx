"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { CalendarRange, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SkillMultiSelect } from "@/components/skills/skill-multi-select";
import type { Class } from "@/lib/api/entities/class";
import type { Program } from "@/lib/api/entities/program";
import {
  fromApiDateTimeToLocalInput,
  toApiDateTimeFromLocalInput,
} from "@/lib/curriculum/datetime";
import {
  buildClassFormSchema,
  type ClassFormValues,
} from "@/lib/validations/classes";
import { CLASS_CREATE_LEAD_DAYS, classStatusRequiresStartDateLeadTime, getMinClassStartLocalInput } from "@/lib/classes/lifecycle";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "h-11 rounded-xl border-input bg-card text-sm text-foreground focus-visible:ring-ring/50";

export type ClassFormSubmitPayload = {
  code: string;
  name: string;
  programId: string;
  startDate: string;
  endDate: string;
  maxCapacity?: number;
  minHoursBeforeAssignmentJoin?: number;
  scheduleSummary?: string | null;
  requiredSkillIds?: string[] | null;
};

type ClassFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem: Class | null;
  programs: Program[];
  isProgramsLoading: boolean;
  isSubmitting: boolean;
  defaultProgramId?: string;
  onSubmit: (values: ClassFormSubmitPayload) => Promise<void>;
};

function toDefaultValues(
  classItem: Class | null,
  defaultProgramId?: string,
): ClassFormValues {
  return {
    code: classItem?.code ?? "",
    name: classItem?.name ?? "",
    programId: classItem?.programId ?? defaultProgramId ?? "",
    startDate: fromApiDateTimeToLocalInput(classItem?.startDate),
    endDate: fromApiDateTimeToLocalInput(classItem?.endDate),
    maxCapacity:
      classItem?.maxCapacity != null ? String(classItem.maxCapacity) : "",
    minHoursBeforeAssignmentJoin:
      classItem?.minHoursBeforeAssignmentJoin != null
        ? String(classItem.minHoursBeforeAssignmentJoin)
        : "",
    scheduleSummary: classItem?.scheduleSummary ?? "",
    requiredSkillIds: classItem?.requiredSkills?.map((skill) => skill.id) ?? [],
  };
}

export function ClassFormDialog({
  open,
  onOpenChange,
  classItem,
  programs,
  isProgramsLoading,
  isSubmitting,
  defaultProgramId,
  onSubmit,
}: ClassFormDialogProps) {
  const isCreate = !classItem;
  /** BE enforces lead time on Create and on Update while Draft / ReadyForMentor / Open. */
  const requiresLeadTime =
    isCreate || classStatusRequiresStartDateLeadTime(classItem?.status);
  const formSchema = useMemo(
    () => buildClassFormSchema({ requireCreateLeadTime: requiresLeadTime }),
    [requiresLeadTime],
  );
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(classItem, defaultProgramId),
  });

  useEffect(() => {
    if (open) reset(toDefaultValues(classItem, defaultProgramId));
  }, [classItem, defaultProgramId, open, reset]);

  async function handleFormSubmit(values: ClassFormValues) {
    const startDate = toApiDateTimeFromLocalInput(values.startDate);
    const endDate = toApiDateTimeFromLocalInput(values.endDate);
    if (!startDate || !endDate) return;

    await onSubmit({
      code: values.code.trim(),
      name: values.name.trim(),
      programId: values.programId,
      startDate,
      endDate,
      maxCapacity: values.maxCapacity?.trim()
        ? Number(values.maxCapacity)
        : undefined,
      minHoursBeforeAssignmentJoin: values.minHoursBeforeAssignmentJoin?.trim()
        ? Number(values.minHoursBeforeAssignmentJoin)
        : undefined,
      scheduleSummary: values.scheduleSummary?.trim()
        ? values.scheduleSummary.trim()
        : null,
      requiredSkillIds: values.requiredSkillIds ?? [],
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogScrollPopup className="max-w-2xl">
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className={dialogScrollFormClassName}
        >
          <DialogScrollHeader>
            <DialogTitle>
              {classItem ? "Cập nhật lớp học" : "Tạo lớp học mới"}
            </DialogTitle>
            <DialogDescription>
              {classItem
                ? classStatusRequiresStartDateLeadTime(classItem.status)
                  ? `Cập nhật thông tin lớp. Ngày bắt đầu phải cách hôm nay ít nhất ${CLASS_CREATE_LEAD_DAYS} ngày khi lớp còn Bản nháp / Chờ mentor / Đang tuyển sinh.`
                  : "Cập nhật thông tin lớp. Mentor được gán qua duyệt yêu cầu tại trang chi tiết (lớp Chờ mentor)."
                : `Thứ tự: tạo lớp Bản nháp → xếp lịch → sẵn sàng tìm mentor → mentor xin nhận → mở tuyển sinh → học viên ghi danh → bắt đầu lớp. Ngày bắt đầu ≥ hôm nay + ${CLASS_CREATE_LEAD_DAYS} ngày.`}
            </DialogDescription>
          </DialogScrollHeader>
          <DialogClose />

          <DialogScrollBody className="space-y-6">
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                <Users className="size-4 text-primary" />
                Thông tin lớp
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="code"
                  label="Mã lớp"
                  required
                  error={errors.code?.message}
                >
                  <Input
                    id="code"
                    placeholder="CLS-STEAM-01"
                    {...register("code")}
                    className={cn(INPUT_CLASS, "font-mono")}
                  />
                </FormField>
                <FormField
                  id="name"
                  label="Tên lớp"
                  required
                  error={errors.name?.message}
                >
                  <Input
                    id="name"
                    placeholder="Lớp STEAM sáng tạo A"
                    {...register("name")}
                    className={INPUT_CLASS}
                  />
                </FormField>
                <FormField
                  id="programId"
                  label="Chương trình"
                  required
                  error={errors.programId?.message}
                  className="sm:col-span-2"
                >
                  <Controller
                    control={control}
                    name="programId"
                    render={({ field }) => {
                      const selectedProgram = programs.find(
                        (item) => item.id === field.value,
                      );
                      return (
                        <Select
                          value={field.value || null}
                          onValueChange={(value) => field.onChange(value ?? "")}
                          disabled={isProgramsLoading || !!defaultProgramId}
                        >
                          <SelectTrigger
                            id="programId"
                            className={cn(
                              LIGHT_SELECT_TRIGGER,
                              "h-11 w-full rounded-xl",
                            )}
                          >
                            <span className="truncate">
                              {isProgramsLoading
                                ? "Đang tải chương trình..."
                                : selectedProgram
                                  ? `${selectedProgram.name} (${selectedProgram.code})`
                                  : "Chọn chương trình"}
                            </span>
                          </SelectTrigger>
                          <SelectContent className={LIGHT_SELECT_CONTENT}>
                            {programs.map((program) => (
                              <SelectItem
                                key={program.id}
                                value={program.id}
                                className={LIGHT_SELECT_ITEM}
                              >
                                {program.name}
                                <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                                  {program.code}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  />
                </FormField>
                <FormField
                  id="maxCapacity"
                  label="Sĩ số tối đa"
                  error={errors.maxCapacity?.message}
                >
                  <Input
                    id="maxCapacity"
                    type="number"
                    min={1}
                    placeholder="20"
                    {...register("maxCapacity")}
                    className={cn(INPUT_CLASS, "font-mono")}
                  />
                </FormField>
                <FormField
                  id="minHoursBeforeAssignmentJoin"
                  label="Giờ tối thiểu trước khi vào bài tập"
                  error={errors.minHoursBeforeAssignmentJoin?.message}
                >
                  <Input
                    id="minHoursBeforeAssignmentJoin"
                    type="number"
                    min={0}
                    placeholder="0"
                    {...register("minHoursBeforeAssignmentJoin")}
                    className={cn(INPUT_CLASS, "font-mono")}
                  />
                </FormField>
              </div>
            </section>

            <section className="space-y-3 border-t border-border pt-5">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                  <Sparkles className="size-4 text-primary" />
                  Kỹ năng yêu cầu
                </h3>
                <p className="text-xs text-muted-foreground">
                  Khớp mentor có kỹ năng phù hợp khi tuyển lớp.
                </p>
              </div>
              <Controller
                control={control}
                name="requiredSkillIds"
                render={({ field }) => (
                  <SkillMultiSelect
                    value={field.value ?? []}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    enabled={open}
                    knownSkills={classItem?.requiredSkills ?? []}
                  />
                )}
              />
              {errors.requiredSkillIds?.message ? (
                <p className="text-xs text-destructive">
                  {errors.requiredSkillIds.message}
                </p>
              ) : null}
            </section>

            <section className="space-y-4 border-t border-border pt-5">
              <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                <CalendarRange className="size-4 text-primary" />
                Lịch học
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="startDate"
                  label="Bắt đầu"
                  required
                  error={errors.startDate?.message}
                >
                  <Input
                    id="startDate"
                    type="datetime-local"
                    min={requiresLeadTime ? getMinClassStartLocalInput() : undefined}
                    {...register("startDate")}
                    className={INPUT_CLASS}
                  />
                  {isCreate ? (
                    <p className="text-xs text-muted-foreground">
                      Phải cách hôm nay ít nhất {CLASS_CREATE_LEAD_DAYS} ngày.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Đổi ngày có thể bị từ chối nếu buổi học hiện có nằm ngoài khoảng mới.
                    </p>
                  )}
                </FormField>
                <FormField
                  id="endDate"
                  label="Kết thúc"
                  required
                  error={errors.endDate?.message}
                >
                  <Input
                    id="endDate"
                    type="datetime-local"
                    {...register("endDate")}
                    className={INPUT_CLASS}
                  />
                </FormField>
                <FormField
                  id="scheduleSummary"
                  label="Tóm tắt lịch"
                  error={errors.scheduleSummary?.message}
                  className="sm:col-span-2"
                >
                  <Input
                    id="scheduleSummary"
                    placeholder="T2–T5, 18:00–20:00"
                    {...register("scheduleSummary")}
                    className={INPUT_CLASS}
                  />
                </FormField>
              </div>
            </section>
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
                : classItem
                  ? "Lưu thay đổi"
                  : "Tạo lớp"}
            </Button>
          </DialogScrollFooter>
        </form>
      </DialogScrollPopup>
    </Dialog>
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
      {error ? (
        <p className="text-xs font-medium text-primary">{error}</p>
      ) : null}
    </div>
  );
}
