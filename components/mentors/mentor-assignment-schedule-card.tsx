"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { ClassDateRange } from "@/components/classes/class-date-range";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";
import { updateAssignment, type AssignmentDetail } from "@/lib/api";
import {
  fromApiDateTimeToLocalInput,
  toApiDateTimeFromLocalInput,
} from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

type ScheduleFormValues = {
  availableFrom: string;
  availableUntil: string;
  dueDate: string;
};

type MentorAssignmentScheduleCardProps = {
  assignment: AssignmentDetail;
  onUpdated?: (assignment: AssignmentDetail) => void;
};

export function MentorAssignmentScheduleCard({
  assignment,
  onUpdated,
}: MentorAssignmentScheduleCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, handleSubmit, reset, watch } = useForm<ScheduleFormValues>({
    defaultValues: {
      availableFrom: fromApiDateTimeToLocalInput(assignment.availableFrom),
      availableUntil: fromApiDateTimeToLocalInput(assignment.availableUntil),
      dueDate: fromApiDateTimeToLocalInput(assignment.dueDate),
    },
  });

  const availableFromValue = watch("availableFrom");
  const availableUntilValue = watch("availableUntil");

  useEffect(() => {
    reset({
      availableFrom: fromApiDateTimeToLocalInput(assignment.availableFrom),
      availableUntil: fromApiDateTimeToLocalInput(assignment.availableUntil),
      dueDate: fromApiDateTimeToLocalInput(assignment.dueDate),
    });
  }, [
    assignment.id,
    assignment.availableFrom,
    assignment.availableUntil,
    assignment.dueDate,
    reset,
  ]);

  async function onSubmit(values: ScheduleFormValues) {
    setIsSubmitting(true);
    try {
      const result = await updateAssignment(assignment.id, {
        availableFrom: toApiDateTimeFromLocalInput(values.availableFrom),
        availableUntil: toApiDateTimeFromLocalInput(values.availableUntil),
        dueDate: toApiDateTimeFromLocalInput(values.dueDate),
      });
      showAppSuccess({
        title: "Đã cập nhật lịch mở bài",
        description: `Học viên sẽ làm “${assignment.title?.trim() || "bài tập"}” theo khung thời gian mới.`,
      });
      if (result?.data) onUpdated?.(result.data);
    } catch (error) {
      showAppErrorFromUnknown(error, "assignments.schedule");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasSchedule =
    Boolean(assignment.availableFrom) ||
    Boolean(assignment.availableUntil) ||
    Boolean(assignment.dueDate);

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-2">
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            Mở bài cho học viên
          </h3>
          <p className="text-xs text-muted-foreground">
            Thiết lập khung thời gian mở / đóng và hạn nộp. Manager chỉ tạo khung
            bài tập; mentor quyết định khi nào học viên được làm.
          </p>
        </div>
      </div>

      {hasSchedule ? (
        <div className="mb-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Lịch hiện tại</p>
          {assignment.availableFrom || assignment.availableUntil ? (
            <p className="flex flex-wrap items-center gap-1">
              <span>Mở:</span>
              <ClassDateRange
                startDate={assignment.availableFrom}
                endDate={assignment.availableUntil}
                layout="inline"
                className="text-foreground"
              />
            </p>
          ) : null}
          {assignment.dueDate ? (
            <p className="mt-0.5 flex flex-wrap items-center gap-1">
              <span>Hạn nộp:</span>
              <ClassDateRange
                startDate={assignment.dueDate}
                layout="inline"
                className="text-foreground"
              />
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mb-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Chưa mở bài — học viên có thể bị khóa cho đến khi bạn đặt lịch.
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-3 sm:grid-cols-2"
      >
        <div className="space-y-1.5">
          <Label htmlFor={`avail-from-${assignment.id}`}>Mở từ</Label>
          <Controller
            control={control}
            name="availableFrom"
            render={({ field }) => (
              <DateTimePicker
                id={`avail-from-${assignment.id}`}
                ariaLabel="Mở từ"
                placeholder="Chọn ngày mở"
                value={field.value ?? ""}
                max={availableUntilValue || undefined}
                allowClear
                disabled={isSubmitting}
                onChange={field.onChange}
                className="h-10 rounded-lg"
              />
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`avail-until-${assignment.id}`}>Đóng lúc</Label>
          <Controller
            control={control}
            name="availableUntil"
            render={({ field }) => (
              <DateTimePicker
                id={`avail-until-${assignment.id}`}
                ariaLabel="Đóng lúc"
                placeholder="Chọn ngày đóng"
                value={field.value ?? ""}
                min={availableFromValue || undefined}
                minExclusive
                referenceDate={availableFromValue || undefined}
                referenceLabel="Mở từ"
                allowClear
                disabled={isSubmitting}
                onChange={field.onChange}
                className="h-10 rounded-lg"
              />
            )}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`due-${assignment.id}`}>Hạn nộp</Label>
          <Controller
            control={control}
            name="dueDate"
            render={({ field }) => (
              <DateTimePicker
                id={`due-${assignment.id}`}
                ariaLabel="Hạn nộp"
                placeholder="Chọn hạn nộp"
                value={field.value ?? ""}
                min={availableFromValue || undefined}
                referenceDate={availableFromValue || undefined}
                referenceLabel="Mở từ"
                allowClear
                disabled={isSubmitting}
                onChange={field.onChange}
                className="h-10 rounded-lg"
              />
            )}
          />
        </div>
        <div className="flex justify-end sm:col-span-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-9 rounded-lg px-4 font-semibold"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu lịch mở bài"}
          </Button>
        </div>
      </form>
    </section>
  );
}
