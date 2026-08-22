"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  CalendarClock,
  Link2,
  MapPin,
  Video,
} from "lucide-react";

import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { getCourseById, getModuleById, getAssignments } from "@/lib/api";
import type { ActivityType } from "@/lib/api/entities/activity";
import type { AssignmentType } from "@/lib/api/entities/assignment";
import type { ClassSession } from "@/lib/api/entities/class-session";
import type { Module } from "@/lib/api/entities/module";
import {
  CLASS_SESSION_STATUS_LABELS,
} from "@/lib/classes/constants";
import {
  ACTIVITY_TYPE_LABELS,
  ASSIGNMENT_TYPE_LABELS,
} from "@/lib/curriculum/constants";
import { DEFAULT_LIVE_ACTIVITY_DURATION_MINUTES } from "@/lib/classes/lifecycle";
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
import {
  parseSessionCoordinateFields,
  SessionCoordinatesPicker,
} from "@/components/maps/session-coordinates-picker";

const INPUT_CLASS =
  "h-10 rounded-lg border-input bg-card text-sm text-foreground focus-visible:ring-ring/50";

const SELECT_TRIGGER_CLASS = "h-10 w-full rounded-lg";

/** Manager form copy — derived from activity/assignment, not free-picked. */
const SESSION_KIND_DERIVED_LABELS: Record<
  NonNullable<ClassSessionFormValues["sessionKind"]>,
  string
> = {
  Lesson: "Buổi học (Online)",
  FieldTrip: "Ngoại khóa (Offline)",
  AssignmentWindow: "Cửa sổ nộp bài",
};

const ACTIVITY_LINK_PREFIX = "activity:";
const ASSIGNMENT_LINK_PREFIX = "assignment:";

function sessionKindFromActivityType(
  activityType: ActivityType,
): NonNullable<ClassSessionFormValues["sessionKind"]> {
  return activityType === "Offline" ? "FieldTrip" : "Lesson";
}

function encodeCurriculumLink(
  kind: "activity" | "assignment",
  id: string,
): string {
  return kind === "activity"
    ? `${ACTIVITY_LINK_PREFIX}${id}`
    : `${ASSIGNMENT_LINK_PREFIX}${id}`;
}

function parseCurriculumLink(
  value: string | null | undefined,
): { kind: "activity" | "assignment"; id: string } | null {
  if (!value) return null;
  if (value.startsWith(ACTIVITY_LINK_PREFIX)) {
    const id = value.slice(ACTIVITY_LINK_PREFIX.length);
    return id ? { kind: "activity", id } : null;
  }
  if (value.startsWith(ASSIGNMENT_LINK_PREFIX)) {
    const id = value.slice(ASSIGNMENT_LINK_PREFIX.length);
    return id ? { kind: "assignment", id } : null;
  }
  return null;
}

/** "YYYY-MM-DDTHH:mm" + minutes, or "" when the input is unparseable. */
function addMinutes(localInput: string, minutes: number): string {
  const parsed = new Date(localInput);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setMinutes(parsed.getMinutes() + minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

export type ClassSessionFormSubmitPayload = {
  moduleId: string;
  activityId?: string | null;
  assignmentId?: string | null;
  sessionKind?: ClassSessionFormValues["sessionKind"];
  title: string;
  description?: string | null;
  startTime: string;
  /** Omit for activity sessions — BE derives End from DurationMinutes. */
  endTime?: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  meetingUrl?: string | null;
  requiresAttendance?: boolean;
  status?: ClassSessionFormValues["status"];
};

type SessionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ClassSession | null;
  /** Prefills start/end (start + duration) when creating from a calendar slot. */
  defaultStart?: Date | null;
  modules: Module[];
  isModulesLoading: boolean;
  isSubmitting: boolean;
  occupiedActivityIds?: Set<string>;
  occupiedAssignmentIds?: Set<string>;
  onSubmit: (values: ClassSessionFormSubmitPayload) => Promise<void>;
};

type ActivityOption = {
  id: string;
  name: string;
  courseName: string;
  activityType: ActivityType;
  durationMinutes: number | null;
};

type AssignmentOption = {
  id: string;
  title: string;
  assignmentType: AssignmentType;
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
    latitude:
      session?.latitude != null ? String(session.latitude) : "",
    longitude:
      session?.longitude != null ? String(session.longitude) : "",
    meetingUrl: session?.meetingUrl ?? "",
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
  occupiedActivityIds,
  occupiedAssignmentIds,
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
  const selectedActivityId = watch("activityId") ?? "";
  const selectedAssignmentId = watch("assignmentId") ?? "";
  const sessionKind = watch("sessionKind") ?? "Lesson";
  const isActivitySession = Boolean(selectedActivityId.trim());
  const isAssignmentSession = Boolean(selectedAssignmentId.trim());
  /** Soft preference only — both venue modes stay available. */
  const prefersPlace = sessionKind === "FieldTrip";
  const [extraVenueOpen, setExtraVenueOpen] = useState(false);
  const [activityOptions, setActivityOptions] = useState<ActivityOption[]>([]);
  const [assignmentOptions, setAssignmentOptions] = useState<AssignmentOption[]>(
    [],
  );
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const hasMeetingUrl = Boolean(getValues("meetingUrl")?.trim());
    const hasPlace = Boolean(
      getValues("location")?.trim() ||
        getValues("latitude")?.trim() ||
        getValues("longitude")?.trim(),
    );
    // Soft preference only: open the secondary venue when it already has data.
    setExtraVenueOpen(prefersPlace ? hasMeetingUrl : hasPlace);
  }, [open, sessionKind, prefersPlace, getValues]);

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
              .filter((activity) => activity.activityType !== "SelfPaced")
              .map((activity) => ({
                id: activity.id,
                name: activity.name,
                courseName: course.name,
                activityType: activity.activityType,
                durationMinutes: activity.durationMinutes ?? null,
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

  useEffect(() => {
    if (!open || !selectedModuleId) {
      setAssignmentOptions([]);
      return;
    }

    let cancelled = false;
    setIsAssignmentsLoading(true);

    void (async () => {
      try {
        const result = await getAssignments({
          moduleId: selectedModuleId,
          page: 1,
          pageSize: 100,
        });
        if (cancelled) return;
        const options: AssignmentOption[] = (result?.data?.items ?? []).map(
          (item) => ({
            id: item.id,
            title: item.title?.trim() || item.code || "Bài tập",
            assignmentType: item.assignmentType,
          }),
        );
        setAssignmentOptions(options);
        const current = getValues("assignmentId");
        if (current && !options.some((item) => item.id === current)) {
          setValue("assignmentId", "");
        }
      } catch {
        if (!cancelled) setAssignmentOptions([]);
      } finally {
        if (!cancelled) setIsAssignmentsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, selectedModuleId, getValues, setValue]);

  function applyActivityDuration(activity: ActivityOption | undefined, start: string) {
    if (!start) return;
    const minutes =
      activity?.durationMinutes && activity.durationMinutes > 0
        ? activity.durationMinutes
        : DEFAULT_LIVE_ACTIVITY_DURATION_MINUTES;
    setValue("endTime", addMinutes(start, minutes), { shouldValidate: true });
  }

  async function handleFormSubmit(values: ClassSessionFormValues) {
    const startTime = toApiDateTimeFromLocalInput(values.startTime);
    if (!startTime) return;

    const activityId = values.activityId?.trim() || null;
    const assignmentId = values.assignmentId?.trim() || null;
    const isAssignmentSession = Boolean(assignmentId);

    const payload: ClassSessionFormSubmitPayload = {
      moduleId: values.moduleId,
      activityId,
      assignmentId,
      sessionKind: values.sessionKind,
      title: values.title.trim(),
      description: values.description?.trim() || null,
      startTime,
      location: values.location?.trim() || null,
      ...parseSessionCoordinateFields(values.latitude, values.longitude),
      meetingUrl: values.meetingUrl?.trim() || null,
      requiresAttendance: values.requiresAttendance,
      status: values.status,
    };

    if (isAssignmentSession) {
      const endTime = toApiDateTimeFromLocalInput(values.endTime ?? "");
      if (!endTime) return;
      payload.endTime = endTime;
    }

    await onSubmit(payload);
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
              {session ? "Cập nhật buổi học" : "Tạo buổi học"}
            </DialogTitle>
            <DialogDescription>
              Gắn đúng một mục khung chương trình (hoạt động LiveOnline/Offline
              hoặc bài tập). Self-paced không xếp lịch. Không trùng mục đã có buổi active.
            </DialogDescription>
          </DialogScrollHeader>
          <DialogClose />

          <DialogScrollBody className="space-y-4">
            <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
              <CalendarClock className="size-4 text-primary" />
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

              {session ? (
                <FormField
                  id="status"
                  label="Trạng thái"
                  error={errors.status?.message}
                  className="sm:col-span-2"
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
              ) : (
                <div className="hidden sm:block" aria-hidden />
              )}

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
                                <span className="ml-2 font-mono text-[11px] text-muted-foreground">
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
                id="curriculumLink"
                label="Nội dung buổi học"
                required
                error={
                  errors.activityId?.message || errors.assignmentId?.message
                }
                className="sm:col-span-2"
              >
                <Controller
                  control={control}
                  name="activityId"
                  render={() => {
                    const hasModule = !!selectedModuleId;
                    const isLoading =
                      isActivitiesLoading || isAssignmentsLoading;
                    const linkValue = selectedActivityId
                      ? encodeCurriculumLink("activity", selectedActivityId)
                      : selectedAssignmentId
                        ? encodeCurriculumLink(
                            "assignment",
                            selectedAssignmentId,
                          )
                        : null;
                    const selectedActivity = activityOptions.find(
                      (item) => item.id === selectedActivityId,
                    );
                    const selectedAssignment = assignmentOptions.find(
                      (item) => item.id === selectedAssignmentId,
                    );
                    const triggerLabel = !hasModule
                      ? "Chọn module trước"
                      : isLoading
                        ? "Đang tải nội dung..."
                        : selectedActivity
                          ? `Hoạt động · ${selectedActivity.name}`
                          : selectedAssignment
                            ? `Bài tập · ${selectedAssignment.title}`
                            : "Chọn hoạt động hoặc bài tập";

                    return (
                      <Select
                        value={linkValue}
                        onValueChange={(value) => {
                          const parsed = parseCurriculumLink(value);
                          if (!parsed) {
                            setValue("activityId", "", { shouldValidate: true });
                            setValue("assignmentId", "", {
                              shouldValidate: true,
                            });
                            setValue("sessionKind", "Lesson", {
                              shouldValidate: true,
                            });
                            return;
                          }

                          if (parsed.kind === "activity") {
                            setValue("activityId", parsed.id, {
                              shouldValidate: true,
                            });
                            setValue("assignmentId", "", {
                              shouldValidate: true,
                            });
                            const activity = activityOptions.find(
                              (item) => item.id === parsed.id,
                            );
                            if (activity) {
                              setValue(
                                "sessionKind",
                                sessionKindFromActivityType(
                                  activity.activityType,
                                ),
                                { shouldValidate: true },
                              );
                              if (!getValues("title")?.trim()) {
                                setValue("title", activity.name);
                              }
                              applyActivityDuration(
                                activity,
                                getValues("startTime"),
                              );
                            }
                            return;
                          }

                          setValue("assignmentId", parsed.id, {
                            shouldValidate: true,
                          });
                          setValue("activityId", "", { shouldValidate: true });
                          setValue("sessionKind", "AssignmentWindow", {
                            shouldValidate: true,
                          });
                          const assignment = assignmentOptions.find(
                            (item) => item.id === parsed.id,
                          );
                          if (assignment && !getValues("title")?.trim()) {
                            setValue("title", assignment.title);
                          }
                        }}
                        disabled={!hasModule || isLoading}
                      >
                        <SelectTrigger
                          id="curriculumLink"
                          className={cn(
                            LIGHT_SELECT_TRIGGER,
                            SELECT_TRIGGER_CLASS,
                          )}
                        >
                          <span className="truncate">{triggerLabel}</span>
                        </SelectTrigger>
                        <SelectContent
                          align="start"
                          alignItemWithTrigger={false}
                          sideOffset={8}
                          className={LIGHT_SELECT_CONTENT}
                        >
                          <SelectGroup>
                            <SelectLabel>Hoạt động trên lớp</SelectLabel>
                            {activityOptions.length === 0 ? (
                              <SelectItem
                                value="__empty_activity"
                                disabled
                                className={LIGHT_SELECT_ITEM}
                              >
                                Chưa có hoạt động Live/Offline trong module
                              </SelectItem>
                            ) : (
                              activityOptions.map((activity) => {
                                const occupied =
                                  occupiedActivityIds?.has(activity.id) ??
                                  false;
                                return (
                                  <SelectItem
                                    key={activity.id}
                                    value={encodeCurriculumLink(
                                      "activity",
                                      activity.id,
                                    )}
                                    disabled={occupied}
                                    className={LIGHT_SELECT_ITEM}
                                  >
                                    {activity.name}
                                    <span className="ml-2 text-[11px] text-muted-foreground">
                                      {ACTIVITY_TYPE_LABELS[
                                        activity.activityType
                                      ]}{" "}
                                      · {activity.courseName}
                                      {occupied ? " · đã có buổi" : ""}
                                    </span>
                                  </SelectItem>
                                );
                              })
                            )}
                          </SelectGroup>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Cửa sổ nộp bài tập</SelectLabel>
                            {assignmentOptions.length === 0 ? (
                              <SelectItem
                                value="__empty_assignment"
                                disabled
                                className={LIGHT_SELECT_ITEM}
                              >
                                Chưa có bài tập trong module
                              </SelectItem>
                            ) : (
                              assignmentOptions.map((assignment) => {
                                const occupied =
                                  occupiedAssignmentIds?.has(assignment.id) ??
                                  false;
                                return (
                                  <SelectItem
                                    key={assignment.id}
                                    value={encodeCurriculumLink(
                                      "assignment",
                                      assignment.id,
                                    )}
                                    disabled={occupied}
                                    className={LIGHT_SELECT_ITEM}
                                  >
                                    {assignment.title}
                                    <span className="ml-2 text-[11px] text-muted-foreground">
                                      {
                                        ASSIGNMENT_TYPE_LABELS[
                                          assignment.assignmentType
                                        ]
                                      }
                                      {occupied ? " · đã có buổi" : ""}
                                    </span>
                                  </SelectItem>
                                );
                              })
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Chỉ chọn một mục: buổi học gắn hoạt động, hoặc cửa sổ thời gian
                  nộp bài tập. Thiếu mục cần thêm trên khung chương trình trước.
                </p>
              </FormField>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sessionKindDerived">Loại buổi</Label>
                <div
                  id="sessionKindDerived"
                  className={cn(
                    INPUT_CLASS,
                    "flex items-center px-3 text-sm",
                    isActivitySession || isAssignmentSession
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                  aria-live="polite"
                >
                  {isActivitySession || isAssignmentSession
                    ? SESSION_KIND_DERIVED_LABELS[sessionKind]
                    : "Chọn nội dung buổi học trước"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tự xác định theo nội dung: Online → buổi học, Offline → ngoại
                  khóa, bài tập → cửa sổ nộp bài.
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="startTime">
                  Thời gian
                  <span className="ml-1 text-primary">*</span>
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
                            if (isActivitySession) {
                              const activity = activityOptions.find(
                                (item) => item.id === selectedActivityId,
                              );
                              applyActivityDuration(activity, next);
                            }
                          }}
                        />
                      </div>
                    )}
                  />
                  <span className="shrink-0 text-sm text-muted-foreground">→</span>
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
                          disabled={isActivitySession || !isAssignmentSession}
                          onChange={
                            isAssignmentSession ? field.onChange : () => undefined
                          }
                        />
                      </div>
                    )}
                  />
                </div>
                {isActivitySession ? (
                  <p className="text-xs text-muted-foreground">
                    Buổi hoạt động: chỉ chọn giờ bắt đầu. Kết thúc = Start +
                    DurationMinutes (BE tính, không gửi EndTime).
                  </p>
                ) : isAssignmentSession ? (
                  <p className="text-xs text-muted-foreground">
                    Buổi bài tập: chọn cả thời điểm bắt đầu và kết thúc.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Chọn hoạt động hoặc bài tập để mở khung giờ phù hợp.
                  </p>
                )}
                {errors.startTime?.message || errors.endTime?.message ? (
                  <p className="text-xs font-medium text-primary">
                    {errors.startTime?.message ?? errors.endTime?.message}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  {prefersPlace ? (
                    <MapPin className="size-4 text-primary" aria-hidden />
                  ) : (
                    <Video className="size-4 text-primary" aria-hidden />
                  )}
                  <p className="font-heading text-sm font-bold text-foreground">
                    {prefersPlace ? "Địa điểm" : "Link buổi học"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {prefersPlace
                    ? "Field Trip ưu tiên tìm địa chỉ / tọa độ. Bạn vẫn có thể thêm link họp nếu cần."
                    : "Lesson ưu tiên link vào lớp. Bạn vẫn có thể thêm địa điểm nếu cần."}
                </p>

                {prefersPlace ? (
                  <SessionCoordinatesPicker
                    latitude={watch("latitude") ?? ""}
                    longitude={watch("longitude") ?? ""}
                    location={watch("location") ?? ""}
                    onLatitudeChange={(value) =>
                      setValue("latitude", value, { shouldValidate: true })
                    }
                    onLongitudeChange={(value) =>
                      setValue("longitude", value, { shouldValidate: true })
                    }
                    onLocationChange={(value) =>
                      setValue("location", value, { shouldValidate: true })
                    }
                    latitudeError={errors.latitude?.message}
                    longitudeError={errors.longitude?.message}
                  />
                ) : (
                  <FormField
                    id="meetingUrl"
                    label="Meeting URL"
                    error={errors.meetingUrl?.message}
                  >
                    <Input
                      id="meetingUrl"
                      placeholder="https://meet.google.com/..."
                      {...register("meetingUrl")}
                      className={INPUT_CLASS}
                    />
                  </FormField>
                )}

                <Collapsible
                  open={extraVenueOpen}
                  onOpenChange={setExtraVenueOpen}
                >
                  <CollapsibleTrigger
                    type="button"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >                    {prefersPlace ? (
                      <>
                        <Link2 className="size-3.5" />
                        {extraVenueOpen
                          ? "Ẩn link họp"
                          : "Thêm link họp (tuỳ chọn)"}
                      </>
                    ) : (
                      <>
                        <MapPin className="size-3.5" />
                        {extraVenueOpen
                          ? "Ẩn địa điểm"
                          : "Thêm địa điểm (tuỳ chọn)"}
                      </>
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    {prefersPlace ? (
                      <FormField
                        id="meetingUrlOptional"
                        label="Meeting URL"
                        error={errors.meetingUrl?.message}
                      >
                        <Input
                          id="meetingUrlOptional"
                          placeholder="https://meet.google.com/..."
                          {...register("meetingUrl")}
                          className={INPUT_CLASS}
                        />
                      </FormField>
                    ) : (
                      <SessionCoordinatesPicker
                        latitude={watch("latitude") ?? ""}
                        longitude={watch("longitude") ?? ""}
                        location={watch("location") ?? ""}
                        onLatitudeChange={(value) =>
                          setValue("latitude", value, { shouldValidate: true })
                        }
                        onLongitudeChange={(value) =>
                          setValue("longitude", value, { shouldValidate: true })
                        }
                        onLocationChange={(value) =>
                          setValue("location", value, { shouldValidate: true })
                        }
                        latitudeError={errors.latitude?.message}
                        longitudeError={errors.longitude?.message}
                      />
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="flex items-end pb-2">
                <Controller
                  control={control}
                  name="requiresAttendance"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                        className="border-input data-checked:border-primary data-checked:bg-primary"
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
                  className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </FormField>
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
                : session
                  ? "Lưu thay đổi"
                  : "Tạo buổi học"}
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
    <div className={cn("space-y-1.5", className)}>
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
