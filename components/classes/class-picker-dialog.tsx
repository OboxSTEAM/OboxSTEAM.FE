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
  getMySchedule,
  getProgramOpenClasses,
  type OpenEnrollmentClass,
  type StudentScheduleInterval,
} from "@/lib/api";
import { ApiRequestError } from "@/lib/api/errors";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import { findBusyConflictLabel } from "@/lib/classes/schedule-conflict";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  clearPreferredClassId,
  getPreferredClassId,
} from "@/lib/programs/preferred-class";
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
  item: OpenEnrollmentClass;
  conflictLabel: string | null;
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
  return /is not open for enrollment|maximum capacity|no available seats/i.test(
    message,
  );
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

function SessionPreviewList({
  sessions,
}: {
  sessions: OpenEnrollmentClass["sessions"];
}) {
  const upcoming = sessions.slice(0, 4);
  if (upcoming.length === 0) {
    return (
      <p className="text-xs text-[#6B6B6B]">Chưa có buổi học trên lịch lớp.</p>
    );
  }

  return (
    <ul className="space-y-1">
      {upcoming.map((session) => (
        <li
          key={session.sessionId}
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
  const { item, conflictLabel, isDisabled, disabledReason } = option;
  const seatsLabel = `${item.seatsTaken}/${item.maxCapacity} chỗ`;

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
            {item.code?.trim() || item.classId.slice(0, 8)}
            {item.isPreferred ? " · Ưu tiên" : ""}
          </p>
          <p className="font-heading mt-1 text-base font-semibold text-[#2D2D2D]">
            {item.name?.trim() || "Lớp tuyển sinh"}
          </p>
          {item.mentorName?.trim() ? (
            <p className="mt-1 text-xs text-[#6B6B6B]">
              Mentor · {item.mentorName.trim()}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="rounded-full border border-[#7CB342]/35 bg-[#F1F8E9] px-2.5 py-1 text-[11px] font-semibold text-[#558B2F]">
            Đang tuyển
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E0] bg-white px-2.5 py-1 text-xs font-medium text-[#2D2D2D]">
            <Users className="size-3.5" aria-hidden />
            {seatsLabel}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-sm text-[#6B6B6B]">
        <p className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden />
          {formatClassDateRange(item.startDate, item.endDate)}
        </p>
        <SessionPreviewList sessions={item.sessions} />
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
  const [preferredMissingToastShown, setPreferredMissingToastShown] =
    useState(false);

  const preferredClassId = open ? getPreferredClassId(programId) : null;

  const { data, isLoading, hasError, retry } = useClientFetch({
    enabled: open,
    fetcher: async () => {
      const [openClassesResult, scheduleResult] = await Promise.all([
        getProgramOpenClasses(programId, { preferredClassId }),
        getMySchedule().catch(() => null),
      ]);

      const classes = openClassesResult?.data ?? [];
      const busy: StudentScheduleInterval[] = scheduleResult?.data ?? [];

      return classes.map((item): ClassPickerOption => {
        const conflictLabel = findBusyConflictLabel(item.sessions, busy, {
          excludeClassId: item.classId,
        });
        const noSeats = item.seatsRemaining <= 0;
        let disabledReason: string | null = null;
        if (noSeats) {
          disabledReason = "Lớp đã hết ghế.";
        } else if (conflictLabel) {
          disabledReason = conflictLabel;
        }

        return {
          item,
          conflictLabel,
          isDisabled: noSeats || conflictLabel != null,
          disabledReason,
        };
      });
    },
    deps: [open, programId, preferredClassId],
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
      setPreferredMissingToastShown(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || isLoading || hasError) return;
    if (!preferredClassId || preferredMissingToastShown) return;

    const preferredStillAvailable = options.some(
      (option) =>
        option.item.classId === preferredClassId && !option.isDisabled,
    );
    if (!preferredStillAvailable) {
      setPreferredMissingToastShown(true);
      showAppSuccess({
        title: "Lớp bạn xem trước đã hết chỗ",
        description: "Hãy chọn một lớp khác còn ghế trong danh sách.",
      });
      clearPreferredClassId(programId);
    }
  }, [
    hasError,
    isLoading,
    open,
    options,
    preferredClassId,
    preferredMissingToastShown,
    programId,
  ]);

  useEffect(() => {
    if (!open) return;
    setSelectedClassId((current) => {
      if (
        current &&
        selectableOptions.some((option) => option.item.classId === current)
      ) {
        return current;
      }
      const preferred = selectableOptions.find(
        (option) => option.item.isPreferred || option.item.classId === preferredClassId,
      );
      return preferred?.item.classId ?? selectableOptions[0]?.item.classId ?? null;
    });
  }, [open, preferredClassId, selectableOptions]);

  const selectedOption = options.find(
    (option) => option.item.classId === selectedClassId,
  );
  const canConfirm =
    selectedOption != null &&
    !selectedOption.isDisabled &&
    !isSubmitting &&
    options.length > 0;

  const handleConfirm = useCallback(async () => {
    if (!selectedClassId || !selectedOption || selectedOption.isDisabled) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createClassEnrollment({
        programEnrollmentId,
        classId: selectedClassId,
      });

      clearPreferredClassId(programId);
      showAppSuccess({
        title: "Đã chọn lớp học",
        description: "Bạn có thể bắt đầu học cùng lớp ngay bây giờ.",
      });

      onEnrolled?.(selectedClassId);
      onOpenChange(false);
    } catch (error) {
      showAppErrorFromUnknown(error, "classEnrollments.create");
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
    programId,
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
              ? `Chỉ lớp Standard đang tuyển (Open) còn ghế của "${programName}". Máy chủ sẽ kiểm tra lại sĩ số khi bạn xác nhận.`
              : "Chỉ lớp Standard đang tuyển còn ghế. Máy chủ sẽ kiểm tra lại sĩ số khi bạn xác nhận."}
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
                Chưa có lớp đang mở còn ghế cho chương trình này. Vui lòng quay lại
                sau.
              </p>
            </div>
          ) : (
            options.map((option) => (
              <ClassOptionCard
                key={option.item.classId}
                option={option}
                isSelected={selectedClassId === option.item.classId}
                onSelect={() => {
                  if (option.isDisabled) return;
                  setSelectedClassId(option.item.classId);
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
