"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { CalendarRange, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { Class } from "@/lib/api/entities/class";
import type { Program } from "@/lib/api/entities/program";
import {
  fromApiDateTimeToLocalInput,
  toApiDateTimeFromLocalInput,
} from "@/lib/curriculum/datetime";
import {
  classFormSchema,
  type ClassFormValues,
} from "@/lib/validations/classes";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "h-11 rounded-xl border-[#DDDDD8] bg-white text-sm text-[#2D2D2D] focus-visible:ring-[#4FC3F7]/50";

export type ClassFormSubmitPayload = {
  code: string;
  name: string;
  programId: string;
  startDate: string;
  endDate: string;
  maxCapacity?: number;
  minHoursBeforeAssignmentJoin?: number;
  scheduleSummary?: string | null;
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
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
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
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto p-0">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader className="border-b border-[#E8E8E3] px-6 py-5 pr-14">
            <DialogTitle>
              {classItem ? "Cập nhật lớp học" : "Tạo lớp học mới"}
            </DialogTitle>
            <DialogDescription>
              Lớp được tạo ở trạng thái Bản nháp. Mentor hiện tại của lớp được
              giữ nguyên khi cập nhật.
            </DialogDescription>
          </DialogHeader>
          <DialogClose />

          <div className="space-y-6 px-6 py-6">
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-[#2D2D2D]">
                <Users className="size-4 text-[#E94B3C]" />
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
                                <span className="ml-2 font-mono text-[11px] text-[#7A7A74]">
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

            <section className="space-y-4 border-t border-[#ECECE7] pt-5">
              <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-[#2D2D2D]">
                <CalendarRange className="size-4 text-[#E94B3C]" />
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
                    {...register("startDate")}
                    className={INPUT_CLASS}
                  />
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
                : classItem
                  ? "Lưu thay đổi"
                  : "Tạo lớp"}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
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
        {required ? <span className="ml-1 text-[#E94B3C]">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-[#C9362B]">{error}</p>
      ) : null}
    </div>
  );
}
