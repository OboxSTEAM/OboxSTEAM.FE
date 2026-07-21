"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { CalendarClock } from "lucide-react";

import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { getCourseById, getModuleById } from "@/lib/api";
import type { ActivityType } from "@/lib/api/entities/activity";
import type { ClassSession } from "@/lib/api/entities/class-session";
import type { Module } from "@/lib/api/entities/module";
import {
  CLASS_SESSION_KIND_LABELS,
  CLASS_SESSION_STATUS_LABELS,
} from "@/lib/classes/constants";
import { ACTIVITY_TYPE_LABELS } from "@/lib/curriculum/constants";
import {
  fromApiDateTimeToLocalInput,
  toApiDateTimeFromLocalInput,
} from "@/lib/curriculum/datetime";
import {
  classSessionFormSchema,
  type ClassSessionFormValues,
} from "@/lib/validations/classes";
import { cn } from "@/lib/utils";

import { DateTimePicker } from "./date-time-picker";

const INPUT_CLASS =
  "h-10 rounded-lg border-[#DDDDD8] bg-white text-sm text-[#2D2D2D] focus-visible:ring-[#4FC3F7]/50";

const SELECT_TRIGGER_CLASS = "h-10 w-full rounded-lg";

/** "YYYY-MM-DDTHH:mm" (+1h) or "" when the input is unparseable. */
function addOneHour(localInput: string): string {
  const parsed = new Date(localInput);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setHours(parsed.getHours() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

/** Auto-fill end time only when empty or not after the new start. */
function shouldSyncEnd(start: string, end: string | undefined | null): boolean {
  if (!start) return false;
  if (!end) return true;
  return new Date(end).getTime() <= new Date(start).getTime();
}

export type ClassSessionFormSubmitPayload = {
  moduleId: string;
  activityId?: string | null;
  assignmentId?: string | null;
  sessionKind?: ClassSessionFormValues["sessionKind"];
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  location?: string | null;
  maxCapacity?: number | null;
  requiresAttendance?: boolean;
  status?: ClassSessionFormValues["status"];
};

type SessionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ClassSession | null;
  /** Prefills start/end (start + 1h) when creating from a calendar slot. */
  defaultStart?: Date | null;
  modules: Module[];
  isModulesLoading: boolean;
  isSubmitting: boolean;
  onSubmit: (values: ClassSessionFormSubmitPayload) => Promise<void>;
};

type ActivityOption = {
  id: string;
  name: string;
  courseName: string;
  activityType: ActivityType;
};

function dateToLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toDefaultValues(
  session: ClassSession | null,
  defaultStart?: Date | null,
): ClassSessionFormValues {
  const slotStart =
    !session && defaultStart ? dateToLocalInput(defaultStart) : "";
  const slotEnd =
    !session && defaultStart
      ? dateToLocalInput(new Date(defaultStart.getTime() + 60 * 60 * 1000))
      : "";

  return {
    moduleId: session?.moduleId ?? "",
    activityId: session?.activityId ?? "",
    assignmentId: session?.assignmentId ?? "",
    sessionKind: session?.sessionKind ?? "Lesson",
    title: session?.title ?? "",
    description: session?.description ?? "",
    startTime: session ? fromApiDateTimeToLocalInput(session.startTime) : slotStart,
    endTime: session ? fromApiDateTimeToLocalInput(session.endTime) : slotEnd,
    location: session?.location ?? "",
    maxCapacity:
      session?.maxCapacity != null ? String(session.maxCapacity) : "",
    requiresAttendance: session?.requiresAttendance ?? true,
    status: session?.status,
  };
}

export function SessionFormDialog({
  open,
  onOpenChange,
  session,
  defaultStart,
  modules,
  isModulesLoading,
  isSubmitting,
  onSubmit,
}: SessionFormDialogProps) {
  const {
    control,
    register,
    reset,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassSessionFormValues>({
    resolver: zodResolver(classSessionFormSchema),
    defaultValues: toDefaultValues(session, defaultStart),
  });

  useEffect(() => {
    if (open) reset(toDefaultValues(session, defaultStart));
  }, [open, reset, session, defaultStart]);

  const selectedModuleId = watch("moduleId");
  const [activityOptions, setActivityOptions] = useState<ActivityOption[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);

  // Load activities for the chosen module the same way the curriculum builder
  // does (module → course → activities are hydrated per course), so the picker
  // matches what "Khung chương trình" shows.
  useEffect(() => {
    if (!open || !selectedModuleId) {
      setActivityOptions([]);
      return;
    }

    let cancelled = false;
    setIsActivitiesLoading(true);

    void (async () => {
      try {
        const moduleResult = await getModuleById(selectedModuleId);
        const courses = moduleResult?.data?.courses ?? [];
        const courseResults = await Promise.all(
          courses.map((course) =>
            getCourseById(course.id).catch(() => null),
          ),
        );
        if (cancelled) return;

        const options: ActivityOption[] = courseResults.flatMap(
          (result, index) => {
            const course = result?.data ?? courses[index];
            const activities =
              result?.data?.activities ?? courses[index].activities ?? [];
            return activities
              // Only scheduled activities (online/offline) need a class session;
              // self-paced ones have no meeting time.
              .filter((activity) => activity.activityType !== "SelfPaced")
              .map((activity) => ({
                id: activity.id,
                name: activity.name,
                courseName: course.name,
                activityType: activity.activityType,
              }));
          },
        );

        setActivityOptions(options);

        // Drop a stale selection only after the real list has loaded.
        const current = getValues("activityId");
        if (current && !options.some((item) => item.id === current)) {
          setValue("activityId", "");
        }
      } catch {
        if (!cancelled) setActivityOptions([]);
      } finally {
        if (!cancelled) setIsActivitiesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, selectedModuleId, getValues, setValue]);

  async function handleFormSubmit(values: ClassSessionFormValues) {
    const startTime = toApiDateTimeFromLocalInput(values.startTime);
    const endTime = toApiDateTimeFromLocalInput(values.endTime);
    if (!startTime || !endTime) return;

    await onSubmit({
      moduleId: values.moduleId,
      activityId: values.activityId?.trim() || null,
      assignmentId: values.assignmentId?.trim() || null,
      sessionKind: values.sessionKind,
      title: values.title.trim(),
      description: values.description?.trim() || null,
      startTime,
      endTime,
      location: values.location?.trim() || null,
      maxCapacity: values.maxCapacity?.trim()
        ? Number(values.maxCapacity)
        : null,
      requiresAttendance: values.requiresAttendance,
      status: values.status,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto p-0">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader className="border-b border-[#E8E8E3] px-6 py-5 pr-14">
            <DialogTitle>
              {session ? "Cập nhật buổi học" : "Tạo buổi học"}
            </DialogTitle>
            <DialogDescription>
              Lên lịch buổi học cho lớp cohort theo module chương trình.
            </DialogDescription>
          </DialogHeader>
          <DialogClose />

          <div className="space-y-4 px-6 py-5">
            <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-[#2D2D2D]">
              <CalendarClock className="size-4 text-[#E94B3C]" />
              Thông tin buổi học
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                id="title"
                label="Tiêu đề"
                required
                error={errors.title?.message}
                className="sm:col-span-2"
              >
                <Input
                  id="title"
                  placeholder="Buổi 1 — Giới thiệu STEAM"
                  {...register("title")}
                  className={INPUT_CLASS}
                />
              </FormField>

              <FormField
                id="moduleId"
                label="Module"
                required
                error={errors.moduleId?.message}
                className="sm:col-span-2"
              >
                <Controller
                  control={control}
                  name="moduleId"
                  render={({ field }) => {
                    const selectedModule = modules.find(
                      (item) => item.id === field.value,
                    );
                    return (
                      <Select
                        value={field.value || null}
                        onValueChange={(value) => field.onChange(value ?? "")}
                        disabled={isModulesLoading}
                      >
                        <SelectTrigger
                          id="moduleId"
                          className={cn(LIGHT_SELECT_TRIGGER, SELECT_TRIGGER_CLASS)}
                        >
                          <span className="truncate">
                            {isModulesLoading
                              ? "Đang tải module..."
                              : selectedModule
                                ? `${selectedModule.name}${selectedModule.code ? ` (${selectedModule.code})` : ""}`
                                : "Chọn module"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className={LIGHT_SELECT_CONTENT}>
                          {modules.map((module) => (
                            <SelectItem
                              key={module.id}
                              value={module.id}
                              className={LIGHT_SELECT_ITEM}
                            >
                              {module.name}
                              {module.code ? (
                                <span className="ml-2 font-mono text-[11px] text-[#7A7A74]">
                                  {module.code}
                                </span>
                              ) : null}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
              </FormField>

              <FormField
                id="activityId"
                label="Hoạt động"
                error={errors.activityId?.message}
                className="sm:col-span-2"
              >
                <Controller
                  control={control}
                  name="activityId"
                  render={({ field }) => {
                    const selectedActivity = activityOptions.find(
                      (item) => item.id === field.value,
                    );
                    const hasModule = !!selectedModuleId;
                    const isEmpty = activityOptions.length === 0;
                    return (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? "" : (value ?? ""))
                        }
                        disabled={!hasModule || isActivitiesLoading || isEmpty}
                      >
                        <SelectTrigger
                          id="activityId"
                          className={cn(LIGHT_SELECT_TRIGGER, SELECT_TRIGGER_CLASS)}
                        >
                          <span className="truncate">
                            {!hasModule
                              ? "Chọn module trước"
                              : isActivitiesLoading
                                ? "Đang tải hoạt động..."
                              : isEmpty
                                ? "Không có hoạt động online/offline"
                                : selectedActivity
                                    ? selectedActivity.name
                                    : "Không gắn hoạt động"}
                          </span>
                        </SelectTrigger>
                        <SelectContent
                          align="start"
                          alignItemWithTrigger={false}
                          sideOffset={8}
                          className={LIGHT_SELECT_CONTENT}
                        >
                          <SelectItem value="none" className={LIGHT_SELECT_ITEM}>
                            Không gắn hoạt động
                          </SelectItem>
                          {activityOptions.map((activity) => (
                            <SelectItem
                              key={activity.id}
                              value={activity.id}
                              className={LIGHT_SELECT_ITEM}
                            >
                              {activity.name}
                              <span className="ml-2 text-[11px] text-[#7A7A74]">
                                {ACTIVITY_TYPE_LABELS[activity.activityType]} ·{" "}
                                {activity.courseName}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                <p className="text-xs text-[#9A9A94]">
                  Gắn hoạt động để buổi học (giờ, link/địa điểm) hiển thị đúng
                  trong bài học của học viên.
                </p>
              </FormField>

              <FormField
                id="sessionKind"
                label="Loại buổi"
                error={errors.sessionKind?.message}
              >
                <Controller
                  control={control}
                  name="sessionKind"
                  render={({ field }) => (
                    <Select
                      value={field.value || "Lesson"}
                      onValueChange={(value) =>
                        field.onChange(value ?? "Lesson")
                      }
                    >
                      <SelectTrigger
                        id="sessionKind"
                        className={cn(LIGHT_SELECT_TRIGGER, SELECT_TRIGGER_CLASS)}
                      >
                        <span className="truncate">
                          {CLASS_SESSION_KIND_LABELS[
                            (field.value ||
                              "Lesson") as keyof typeof CLASS_SESSION_KIND_LABELS
                          ] ?? "Chọn loại"}
                        </span>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        alignItemWithTrigger={false}
                        sideOffset={8}
                        className={LIGHT_SELECT_CONTENT}
                      >
                        {Object.entries(CLASS_SESSION_KIND_LABELS).map(
                          ([value, label]) => (
                            <SelectItem
                              key={value}
                              value={value}
                              className={LIGHT_SELECT_ITEM}
                            >
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              {session ? (
                <FormField
                  id="status"
                  label="Trạng thái"
                  error={errors.status?.message}
                >
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select
                        value={field.value || "Scheduled"}
                        onValueChange={(value) =>
                          field.onChange(value ?? "Scheduled")
                        }
                      >
                        <SelectTrigger
                          id="status"
                          className={cn(LIGHT_SELECT_TRIGGER, SELECT_TRIGGER_CLASS)}
                        >
                          <span className="truncate">
                            {CLASS_SESSION_STATUS_LABELS[
                              (field.value ||
                                "Scheduled") as keyof typeof CLASS_SESSION_STATUS_LABELS
                            ] ?? "Trạng thái"}
                          </span>
                        </SelectTrigger>
                        <SelectContent
                          align="start"
                          alignItemWithTrigger={false}
                          sideOffset={8}
                          className={LIGHT_SELECT_CONTENT}
                        >
                          {Object.entries(CLASS_SESSION_STATUS_LABELS).map(
                            ([value, label]) => (
                              <SelectItem
                                key={value}
                                value={value}
                                className={LIGHT_SELECT_ITEM}
                              >
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              ) : null}

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="startTime">
                  Thời gian
                  <span className="ml-1 text-[#E94B3C]">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name="startTime"
                    render={({ field }) => (
                      <div className="min-w-0 flex-1">
                        <DateTimePicker
                          id="startTime"
                          ariaLabel="Bắt đầu"
                          placeholder="Bắt đầu"
                          value={field.value ?? ""}
                          invalid={!!errors.startTime}
                          onChange={(next) => {
                            field.onChange(next);
                            const end = getValues("endTime");
                            if (shouldSyncEnd(next, end)) {
                              setValue("endTime", addOneHour(next), {
                                shouldValidate: true,
                              });
                            }
                          }}
                        />
                      </div>
                    )}
                  />
                  <span className="shrink-0 text-sm text-[#9A9A94]">→</span>
                  <Controller
                    control={control}
                    name="endTime"
                    render={({ field }) => (
                      <div className="min-w-0 flex-1">
                        <DateTimePicker
                          id="endTime"
                          ariaLabel="Kết thúc"
                          placeholder="Kết thúc"
                          value={field.value ?? ""}
                          invalid={!!errors.endTime}
                          onChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>
                {errors.startTime?.message || errors.endTime?.message ? (
                  <p className="text-xs font-medium text-[#C9362B]">
                    {errors.startTime?.message ?? errors.endTime?.message}
                  </p>
                ) : null}
              </div>

              <FormField
                id="location"
                label="Địa điểm / link"
                error={errors.location?.message}
                className="sm:col-span-2"
              >
                <Input
                  id="location"
                  placeholder="Phòng lab A hoặc https://meet.google.com/..."
                  {...register("location")}
                  className={INPUT_CLASS}
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
                  placeholder="Theo sĩ số lớp"
                  {...register("maxCapacity")}
                  className={cn(INPUT_CLASS, "font-mono")}
                />
              </FormField>

              <div className="flex items-end pb-2">
                <Controller
                  control={control}
                  name="requiresAttendance"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#2D2D2D]">
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                        className="border-[#A8A8A2] data-checked:border-[#E94B3C] data-checked:bg-[#E94B3C]"
                      />
                      Yêu cầu điểm danh
                    </label>
                  )}
                />
              </div>

              <FormField
                id="description"
                label="Mô tả"
                error={errors.description?.message}
                className="sm:col-span-2"
              >
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Ghi chú nội dung buổi học..."
                  {...register("description")}
                  className="w-full resize-none rounded-xl border border-[#DDDDD8] bg-white px-3.5 py-3 text-sm text-[#2D2D2D] outline-none transition-colors placeholder:text-[#9A9A94] focus:border-[#4FC3F7] focus:ring-2 focus:ring-[#4FC3F7]/30"
                />
              </FormField>
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
                : session
                  ? "Lưu thay đổi"
                  : "Tạo buổi học"}
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
    <div className={cn("space-y-1.5", className)}>
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
