"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getClassSessions,
  updateClassSession,
  type AssignmentDetail,
  type ClassSession,
} from "@/lib/api";
import {
  fromApiDateTimeToLocalInput,
  parseApiDateTime,
  toApiDateTimeFromLocalInput,
} from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  ASSIGNMENT_WINDOW_MIN_HOURS,
  assignmentWindowFormSchema,
  type AssignmentWindowFormValues,
} from "@/lib/validations";

type MentorAssignmentScheduleCardProps = {
  classId: string;
  assignment: AssignmentDetail;
  /** Class end date — BE caps window edits at 23:59:59 (VN) on this day. */
  classEndDate?: string | null;
};

/**
 * Mentor edits the class `AssignmentWindow` session linked to an assignment.
 * Sessions are created by Manager (manual or generate); mentors can only move
 * the open / close times.
 */
export function MentorAssignmentScheduleCard({
  classId,
  assignment,
  classEndDate,
}: MentorAssignmentScheduleCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const endTimeMax = toEndOfDayLocalInput(classEndDate);

  const {
    data: session,
    isLoading,
    hasError,
    retry,
    mutate,
  } = useClientFetch<ClassSession | null>({
    fetcher: () => findAssignmentWindowSession(classId, assignment.id),
    deps: [classId, assignment.id],
    onError: (error) => showAppErrorFromUnknown(error, "classSessions.list"),
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<AssignmentWindowFormValues>({
    resolver: zodResolver(assignmentWindowFormSchema),
    defaultValues: toFormValues(session),
  });

  useEffect(() => {
    reset(toFormValues(session));
  }, [session, reset]);

  const startTimeValue = watch("startTime");

  async function onSubmit(values: AssignmentWindowFormValues) {
    if (!session) return;
    const startTime = toApiDateTimeFromLocalInput(values.startTime);
    const endTime = toApiDateTimeFromLocalInput(values.endTime);
    if (!startTime || !endTime) return;

    setIsSubmitting(true);
    try {
      const result = await updateClassSession(classId, session.id, {
        startTime,
        endTime,
      });
      showAppSuccess({
        title: "Đã cập nhật lịch mở bài",
        description: `Học viên sẽ làm “${assignment.title?.trim() || "bài tập"}” theo khung thời gian mới.`,
      });
      if (result?.data) mutate(result.data);
    } catch (error) {
      showAppErrorFromUnknown(error, "assignments.schedule");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-2">
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            Mở bài cho học viên
          </h3>
          <p className="text-xs text-muted-foreground">
            Khung thời gian lấy từ buổi &quot;Nộp bài tập&quot; của lớp. Học viên
            làm bài trong khoảng mở → đóng; thời điểm đóng là hạn nộp. Khung
            phải dài ít nhất {ASSIGNMENT_WINDOW_MIN_HOURS} giờ, đóng ở tương lai
            và không quá 23:59 ngày kết thúc lớp.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ) : hasError && !session ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <span>Không tải được lịch buổi nộp bài của lớp.</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={retry}
            className="h-7 rounded-md px-2.5 text-xs"
          >
            Thử lại
          </Button>
        </div>
      ) : !session ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Lớp chưa có buổi &quot;Nộp bài tập&quot; cho bài này — học viên sẽ bị
          khóa. Liên hệ quản lý để tạo lịch (thêm buổi hoặc tạo lịch tự động).
        </p>
      ) : (
        <>
          {session.status === "Cancelled" ? (
            <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
              Buổi nộp bài này đã bị hủy.
            </p>
          ) : null}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-3 sm:grid-cols-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor={`window-start-${session.id}`}>Mở từ</Label>
              <Controller
                control={control}
                name="startTime"
                render={({ field }) => (
                  <DateTimePicker
                    id={`window-start-${session.id}`}
                    ariaLabel="Mở từ"
                    placeholder="Chọn ngày mở"
                    value={field.value ?? ""}
                    disabled={isSubmitting}
                    onChange={field.onChange}
                    className="h-10 rounded-lg"
                  />
                )}
              />
              {errors.startTime?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.startTime.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`window-end-${session.id}`}>
                Đóng lúc (hạn nộp)
              </Label>
              <Controller
                control={control}
                name="endTime"
                render={({ field }) => (
                  <DateTimePicker
                    id={`window-end-${session.id}`}
                    ariaLabel="Đóng lúc"
                    placeholder="Chọn ngày đóng"
                    value={field.value ?? ""}
                    min={startTimeValue || undefined}
                    max={endTimeMax}
                    minExclusive
                    referenceDate={startTimeValue || undefined}
                    referenceLabel="Mở từ"
                    disabled={isSubmitting}
                    onChange={field.onChange}
                    className="h-10 rounded-lg"
                  />
                )}
              />
              {errors.endTime?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.endTime.message}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="h-9 rounded-lg px-4 font-semibold"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu lịch mở bài"}
              </Button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}

const SESSION_PAGE_SIZE = 20;

async function findAssignmentWindowSession(
  classId: string,
  assignmentId: string,
): Promise<ClassSession | null> {
  const result = await getClassSessions(classId, {
    assignmentId,
    sessionKind: "AssignmentWindow",
    sortBy: "startTime",
    isDescending: false,
    page: 1,
    pageSize: SESSION_PAGE_SIZE,
  });
  const matches = (result?.data?.items ?? []).filter(
    (item) => item.assignmentId === assignmentId,
  );
  return pickActiveSession(matches);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** `datetime-local` bound at 23:59 on the class end date (as shown in the UI). */
function toEndOfDayLocalInput(value: string | null | undefined): string | undefined {
  const d = parseApiDateTime(value);
  if (!d) return undefined;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
}

/** Prefer a non-cancelled window; fall back to the earliest match. */
function pickActiveSession(sessions: ClassSession[]): ClassSession | null {
  if (sessions.length === 0) return null;
  const sorted = [...sessions].sort(
    (a, b) =>
      (parseApiDateTime(a.startTime)?.getTime() ?? 0) -
      (parseApiDateTime(b.startTime)?.getTime() ?? 0),
  );
  return sorted.find((item) => item.status !== "Cancelled") ?? sorted[0];
}

function toFormValues(
  session: ClassSession | null | undefined,
): AssignmentWindowFormValues {
  return {
    startTime: fromApiDateTimeToLocalInput(session?.startTime),
    endTime: fromApiDateTimeToLocalInput(session?.endTime),
  };
}
