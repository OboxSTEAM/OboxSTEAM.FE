"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Loader2, Users } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  createClassEnrollment,
  getClasses,
  getClassWithSessions,
  getMySchedule,
  type Class,
  type ClassSession,
  type ClassWithSessions,
  type StudentScheduleInterval,
} from "@/lib/api";
import { ApiRequestError } from "@/lib/api/errors";
import {
  CLASS_SESSION_KIND_LABELS,
  CLASS_STATUS_LABELS,
  OPEN_CLASSES_QUERY,
  isStudentJoinableClass,
} from "@/lib/classes/constants";
import {
  findScheduleConflict,
  pickUpcomingSessions,
} from "@/lib/classes/schedule-conflict";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type ClassPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  programEnrollmentId: string;
  programName?: string;
  onEnrolled?: (classId: string) => void;
};

type ClassPickerOption = {
  classItem: Class;
  withSessions: ClassWithSessions | null;
  upcoming: ClassSession[];
  conflictLabel: string | null;
  /** True when not Open or schedule conflicts — cannot enroll. */
  isDisabled: boolean;
  disabledReason: string | null;
};

function isClassClosedForEnrollmentError(error: unknown): boolean {
  let message = "";
  if (error instanceof ApiRequestError) {
    const body = error.body as {
      error?: { message?: string };
      message?: string;
    } | null;
    message = body?.error?.message ?? body?.message ?? error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }
  return /is not open for enrollment/i.test(message);
}

function formatClassDateRange(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  try {
    return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`;
  } catch {
    return `${startDate} – ${endDate}`;
  }
}

function ClassOptionSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-[#E5E5E0] p-4">
      <Skeleton className="h-4 w-2/3 bg-[#E5E5E0]" />
      <Skeleton className="h-3 w-full bg-[#E5E5E0]" />
      <Skeleton className="h-3 w-1/2 bg-[#E5E5E0]" />
    </div>
  );
}

function SessionPreviewList({ sessions }: { sessions: ClassSession[] }) {
  if (sessions.length === 0) {
    return (
      <p className="text-xs text-[#6B6B6B]">
        Chưa có buổi học thật trên lịch lớp.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {sessions.map((session) => (
        <li
          key={session.id}
          className="flex items-start justify-between gap-2 text-xs text-[#6B6B6B]"
        >
          <span className="min-w-0 truncate font-medium text-[#2D2D2D]">
            {session.title?.trim() ||
              CLASS_SESSION_KIND_LABELS[session.sessionKind]}
          </span>
          <span className="shrink-0 tabular-nums">
            {formatApiDateTimeDisplay(session.startTime) || "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ClassOptionCard({
  option,
  isSelected,
  onSelect,
}: {
  option: ClassPickerOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { classItem, upcoming, conflictLabel, isDisabled, disabledReason } =
    option;
  const seatsLabel =
    classItem.maxCapacity > 0
      ? `${classItem.seatsTaken}/${classItem.maxCapacity} chỗ`
      : null;
  const statusLabel = CLASS_STATUS_LABELS[classItem.status];
  const isOpen = isStudentJoinableClass(classItem.status);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-colors",
        isDisabled && "cursor-not-allowed opacity-60",
        isSelected && !isDisabled
          ? "border-[#4FC3F7] bg-[#E8F7FD] ring-2 ring-[#4FC3F7]/30"
          : "border-[#E5E5E0] bg-white hover:border-[#D4D4CF] hover:bg-[#FAFAF5]",
        isDisabled && isSelected && "ring-0",
      )}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-semibold tracking-wide text-[#6B6B6B] uppercase">
            {classItem.code}
          </p>
          <p className="font-heading mt-1 text-base font-semibold text-[#2D2D2D]">
            {classItem.name}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              isOpen
                ? "border-[#7CB342]/35 bg-[#F1F8E9] text-[#558B2F]"
                : "border-[#E5E5E0] bg-[#FAFAF5] text-[#6B6B6B]",
            )}
          >
            {statusLabel}
          </span>
          {seatsLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E0] bg-white px-2.5 py-1 text-xs font-medium text-[#2D2D2D]">
              <Users className="size-3.5" aria-hidden />
              {seatsLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-2 text-sm text-[#6B6B6B]">
        <p className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden />
          {formatClassDateRange(classItem.startDate, classItem.endDate)}
        </p>
        <SessionPreviewList sessions={upcoming} />
        {conflictLabel ? (
          <p className="inline-flex items-start gap-1.5 rounded-lg border border-[#E94B3C]/25 bg-[#FFF0EE] px-2.5 py-1.5 text-xs font-medium text-[#a82a1e]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {conflictLabel}
          </p>
        ) : null}
        {!conflictLabel && disabledReason ? (
          <p className="inline-flex items-start gap-1.5 rounded-lg border border-[#E5E5E0] bg-[#FAFAF5] px-2.5 py-1.5 text-xs font-medium text-[#6B6B6B]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {disabledReason}
          </p>
        ) : null}
      </div>
    </button>
  );
}

export function ClassPickerDialog({
  open,
  onOpenChange,
  programId,
  programEnrollmentId,
  programName,
  onEnrolled,
}: ClassPickerDialogProps) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, hasError, retry } = useClientFetch({
    enabled: open,
    fetcher: async () => {
      const [classesResult, scheduleResult] = await Promise.all([
        getClasses(
          {
            ...OPEN_CLASSES_QUERY,
            programId,
          },
          { includeSeatsTaken: true },
        ),
        getMySchedule().catch(() => null),
      ]);

      const classes = (classesResult?.data?.items ?? []).filter((classItem) =>
        isStudentJoinableClass(classItem.status),
      );      const busy: StudentScheduleInterval[] = scheduleResult?.data ?? [];

      const withSessionsList = await Promise.all(
        classes.map(async (classItem) => {
          try {
            const result = await getClassWithSessions(classItem.id);
            return result?.data ?? null;
          } catch {
            return null;
          }
        }),
      );

      return classes.map((classItem, index): ClassPickerOption => {
        const withSessions = withSessionsList[index];
        const sessions = withSessions?.sessions ?? [];
        const conflict = findScheduleConflict(sessions, busy, {
          excludeClassId: classItem.id,
        });
        const isOpen = isStudentJoinableClass(classItem.status);
        const conflictLabel = conflict?.label ?? null;
        let disabledReason: string | null = null;
        if (!isOpen) {
          disabledReason = `Lớp ${CLASS_STATUS_LABELS[classItem.status].toLowerCase()} — chỉ lớp đang tuyển sinh mới nhận ghi danh.`;
        } else if (conflictLabel) {
          disabledReason = conflictLabel;
        }

        return {
          classItem,
          withSessions,
          upcoming: pickUpcomingSessions(sessions),
          conflictLabel,
          isDisabled: !isOpen || conflict != null,
          disabledReason,
        };
      });
    },
    deps: [open, programId],
    onError: (error) => showAppErrorFromUnknown(error, "classes.list"),
  });

  const options = data ?? [];
  const selectableOptions = useMemo(
    () => options.filter((option) => !option.isDisabled),
    [options],
  );

  useEffect(() => {
    if (!open) {
      setSelectedClassId(null);
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelectedClassId((current) => {
      if (
        current &&
        selectableOptions.some((option) => option.classItem.id === current)
      ) {
        return current;
      }
      return selectableOptions[0]?.classItem.id ?? null;
    });
  }, [open, selectableOptions]);

  const selectedOption = options.find(
    (option) => option.classItem.id === selectedClassId,
  );
  const canConfirm =
    selectedOption != null &&
    isStudentJoinableClass(selectedOption.classItem.status) &&
    !selectedOption.isDisabled &&
    !isSubmitting &&
    options.length > 0;

  const handleConfirm = useCallback(async () => {
    if (
      !selectedClassId ||
      !selectedOption ||
      selectedOption.isDisabled ||
      !isStudentJoinableClass(selectedOption.classItem.status)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createClassEnrollment({
        programEnrollmentId,
        classId: selectedClassId,
      });

      showAppSuccess({
        title: "Đã chọn lớp học",
        description: "Bạn có thể bắt đầu học cùng lớp ngay bây giờ.",
      });

      onEnrolled?.(selectedClassId);
      onOpenChange(false);
    } catch (error) {
      showAppErrorFromUnknown(error, "classEnrollments.create");
      // Class may have moved Open → InProgress, or student hit active-class cap (409).
      if (
        isClassClosedForEnrollmentError(error) ||
        (error instanceof ApiRequestError && error.status === 409)
      ) {
        setSelectedClassId(null);
        retry();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    onEnrolled,
    onOpenChange,
    programEnrollmentId,
    retry,
    selectedClassId,
    selectedOption,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[min(90dvh,44rem)] max-w-xl overflow-y-auto">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>Chọn lớp học</DialogTitle>
          <DialogDescription>
            {programName
              ? `Chỉ lớp đang tuyển sinh (Open) của chương trình "${programName}" mới ghi danh được. Lớp đã bắt đầu học (InProgress) không nhận thêm học viên.`
              : "Chỉ lớp đang tuyển sinh (Open) mới ghi danh được. Lớp đã bắt đầu học không nhận thêm học viên."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {isLoading ? (
            <>
              <ClassOptionSkeleton />
              <ClassOptionSkeleton />
            </>
          ) : hasError ? (
            <div className="rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-4 py-6 text-center">
              <p className="text-sm text-[#6B6B6B]">
                Không tải được danh sách lớp. Vui lòng thử lại.
              </p>
              <Button type="button" variant="outline" className="mt-4" onClick={retry}>
                Thử lại
              </Button>
            </div>
          ) : options.length === 0 ? (
            <div className="rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-4 py-6 text-center">
              <p className="text-sm text-[#6B6B6B]">
                Chưa có lớp đang mở cho chương trình này. Vui lòng quay lại sau.
              </p>
            </div>
          ) : (
            options.map((option) => (
              <ClassOptionCard
                key={option.classItem.id}
                option={option}
                isSelected={selectedClassId === option.classItem.id}
                onSelect={() => {
                  if (option.isDisabled) return;
                  setSelectedClassId(option.classItem.id);
                }}
              />
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Để sau
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!canConfirm}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Đang xác nhận…
              </>
            ) : (
              "Xác nhận lớp"
            )}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
