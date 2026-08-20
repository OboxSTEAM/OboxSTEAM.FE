"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { generateClassSessions } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  dotnetDayOfWeekSchema,
  type DotNetDayOfWeek,
} from "@/lib/validations/classes";

const DAY_OPTIONS: { value: DotNetDayOfWeek; label: string }[] = [
  { value: "Monday", label: "Thứ 2" },
  { value: "Tuesday", label: "Thứ 3" },
  { value: "Wednesday", label: "Thứ 4" },
  { value: "Thursday", label: "Thứ 5" },
  { value: "Friday", label: "Thứ 6" },
  { value: "Saturday", label: "Thứ 7" },
  { value: "Sunday", label: "Chủ nhật" },
];

const generateSessionsFormSchema = z
  .object({
    daysOfWeek: z.array(dotnetDayOfWeekSchema).min(1, "Chọn ít nhất một ngày."),
    sessionStartTime: z.string().min(1, "Nhập giờ bắt đầu."),
    sessionEndTime: z.string().min(1, "Nhập giờ kết thúc."),
  })
  .superRefine((value, ctx) => {
    const start = toUtcTimeString(value.sessionStartTime);
    const end = toUtcTimeString(value.sessionEndTime);
    if (!start || !end) return;
    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        path: ["sessionEndTime"],
        message: "Giờ kết thúc phải sau giờ bắt đầu.",
      });
    }
  });

type GenerateSessionsFormValues = z.infer<typeof generateSessionsFormSchema>;

type GenerateSessionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className?: string | null;
  onGenerated: () => void;
};

function toUtcTimeString(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  return null;
}

export function GenerateSessionsDialog({
  open,
  onOpenChange,
  classId,
  className: cohortName,
  onGenerated,
}: GenerateSessionsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GenerateSessionsFormValues>({
    resolver: zodResolver(generateSessionsFormSchema),
    defaultValues: {
      daysOfWeek: ["Saturday"],
      sessionStartTime: "09:00",
      sessionEndTime: "11:00",
    },
  });

  const selectedDays = watch("daysOfWeek");

  useEffect(() => {
    if (open) {
      reset({
        daysOfWeek: ["Saturday"],
        sessionStartTime: "09:00",
        sessionEndTime: "11:00",
      });
    }
  }, [open, reset]);

  function toggleDay(day: DotNetDayOfWeek, checked: boolean) {
    const current = selectedDays ?? [];
    if (checked) {
      setValue("daysOfWeek", [...new Set([...current, day])], {
        shouldValidate: true,
      });
      return;
    }
    setValue(
      "daysOfWeek",
      current.filter((item) => item !== day),
      { shouldValidate: true },
    );
  }

  async function onSubmit(values: GenerateSessionsFormValues) {
    const sessionStartTime = toUtcTimeString(values.sessionStartTime);
    const sessionEndTime = toUtcTimeString(values.sessionEndTime);
    if (!sessionStartTime || !sessionEndTime) return;

    setIsSubmitting(true);
    try {
      const result = await generateClassSessions(classId, {
        daysOfWeek: values.daysOfWeek,
        sessionStartTime,
        sessionEndTime,
      });
      const count = result?.data?.length ?? 0;
      showAppSuccess({
        title: "Đã tạo lịch buổi học",
        description: `${count} buổi được xếp theo khung chương trình (UTC).`,
      });
      onOpenChange(false);
      onGenerated();
    } catch (error) {
      showAppErrorFromUnknown(error, "classSessions.generate");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogScrollPopup className="max-w-lg">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={dialogScrollFormClassName}
        >
          <DialogScrollHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" aria-hidden />
              Tạo lịch tự động
            </DialogTitle>
            <DialogDescription>
              {cohortName?.trim()
                ? `Lớp “${cohortName.trim()}” — xếp buổi học theo thứ tự khung chương trình từ ngày bắt đầu lớp.`
                : "Xếp buổi học theo khung chương trình. Chỉ dùng khi lớp chưa có buổi nào."}
            </DialogDescription>
          </DialogScrollHeader>
          <DialogClose />

          <DialogScrollBody className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
              <p>• Bỏ qua hoạt động SelfPaced.</p>
              <p>• LiveOnline → Lesson · Offline → FieldTrip · Assignment → AssignmentWindow.</p>
              <p>• Lớp cần có mentor; toàn bộ lịch được tạo all-or-nothing.</p>
              <p>• Thời gian nhập theo UTC.</p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-foreground">
                Ngày trong tuần
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DAY_OPTIONS.map((day) => {
                  const checked = selectedDays?.includes(day.value) ?? false;
                  return (
                    <label
                      key={day.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) =>
                          toggleDay(day.value, next === true)
                        }
                      />
                      {day.label}
                    </label>
                  );
                })}
              </div>
              {errors.daysOfWeek?.message ? (
                <p className="text-xs font-medium text-primary">
                  {errors.daysOfWeek.message}
                </p>
              ) : null}
            </fieldset>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" aria-hidden />
                Khung giờ (UTC)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  step={60}
                  {...register("sessionStartTime")}
                  className="h-10 rounded-lg"
                />
                <span className="text-muted-foreground">→</span>
                <Input
                  type="time"
                  step={60}
                  {...register("sessionEndTime")}
                  className="h-10 rounded-lg"
                />
              </div>
              {(errors.sessionStartTime?.message ||
                errors.sessionEndTime?.message) && (
                <p className="text-xs font-medium text-primary">
                  {errors.sessionStartTime?.message ??
                    errors.sessionEndTime?.message}
                </p>
              )}
            </div>
          </DialogScrollBody>

          <DialogScrollFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? "Đang tạo..." : "Tạo lịch buổi học"}
            </Button>
          </DialogScrollFooter>
        </form>
      </DialogScrollPopup>
    </Dialog>
  );
}
