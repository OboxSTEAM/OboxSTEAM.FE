"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";

import { SeatHoldCountdown } from "@/components/payment/seat-hold-countdown";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProgramOpenClasses } from "@/hooks/use-program-open-classes";
import {
  getMySchedule,
  type OpenEnrollmentClass,
  type StudentScheduleInterval,
} from "@/lib/api";
import { isStudentRole } from "@/lib/auth/roles";
import { findBusyConflictLabel } from "@/lib/classes/schedule-conflict";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

import { useProgramSelectedClass } from "./program-selected-class-context";

type ProgramOpenClassesPreviewProps = {
  programId: string;
  /** Notifies parent when open seats availability changes (for pay gate). */
  onAvailabilityChange?: (hasOpenSeats: boolean, isLoading: boolean) => void;
  className?: string;
};

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

function OpenClassCard({
  item,
  isSelected,
  isSelecting,
  hasValidHold,
  conflictLabel,
  onSelect,
}: {
  item: OpenEnrollmentClass;
  isSelected: boolean;
  isSelecting: boolean;
  hasValidHold: boolean;
  conflictLabel: string | null;
  onSelect: () => void;
}) {
  const noSeats = item.seatsRemaining <= 0;
  const isDisabled = noSeats || isSelecting || conflictLabel != null;
  const scheduleLabel =
    item.scheduleSummary?.trim() ||
    formatClassDateRange(item.startDate, item.endDate);

  const statusChip = conflictLabel
    ? {
        label: "Trùng lịch",
        Icon: AlertTriangle,
        className: "bg-[#FFF0EE] text-[#a82a1e]",
      }
    : noSeats
      ? {
          label: "Hết ghế",
          Icon: AlertTriangle,
          className: "bg-[#F5F5F0] text-[#6B6B6B]",
        }
      : isSelected
        ? {
            label: hasValidHold ? "Đang giữ ghế" : "Đã chọn",
            Icon: Clock,
            className: "bg-[#E8F7FD] text-[#0277BD]",
          }
        : null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E5E5E0] bg-white p-4 sm:p-5",
        isSelected &&
          !conflictLabel &&
          "ring-2 ring-[#4FC3F7]/35 ring-offset-2 ring-offset-[#FAFAF5]",
        isSelected &&
          conflictLabel &&
          "ring-2 ring-[#E94B3C]/25 ring-offset-2 ring-offset-[#FAFAF5]",
        !isDisabled && !isSelected && "hover:border-[#D4D4CF]",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
        <div className="shrink-0 sm:w-24 sm:border-r sm:border-[#E5E5E0] sm:pr-5">
          <p
            className={cn(
              "font-mono text-2xl font-bold tabular-nums tracking-tight leading-none",
              noSeats ? "text-[#6B6B6B]" : "text-[#2D2D2D]",
            )}
          >
            {item.seatsRemaining}
          </p>
          <p
            className={cn(
              "mt-1.5 text-xs font-semibold leading-snug",
              noSeats ? "text-[#6B6B6B]" : "text-[#2D2D2D]",
            )}
          >
            {noSeats ? "Hết ghế" : "ghế còn trống"}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            className={cn(
              "w-full text-left",
              isDisabled && "cursor-not-allowed opacity-70",
            )}
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={onSelect}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {statusChip ? (
                <Badge
                  className={cn(
                    "gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    statusChip.className,
                  )}
                >
                  <statusChip.Icon
                    className="size-3"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  {statusChip.label}
                </Badge>
              ) : null}
              <span className="inline-flex items-center rounded-md border border-[#E5E5E0] bg-[#FAFAF5] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#6B6B6B]">
                {item.seatsTaken}/{item.maxCapacity} đã đăng ký
              </span>
            </div>

            <p className="mt-1.5 font-mono text-[11px] font-semibold tracking-wide text-[#6B6B6B] uppercase">
              {item.code?.trim() || item.classId.slice(0, 8)}
            </p>
            <p className="mt-1 font-heading text-base font-bold text-[#2D2D2D]">
              {item.name?.trim() || "Lớp tuyển sinh"}
            </p>
            <p className="mt-1 text-sm text-[#6B6B6B]">
              {item.mentorName?.trim()
                ? `Mentor · ${item.mentorName.trim()}`
                : "Chưa gán mentor"}
              <span className="text-[#E5E5E0]"> · </span>
              {scheduleLabel}
            </p>
            <p className="mt-1 text-xs text-[#6B6B6B]">
              {formatClassDateRange(item.startDate, item.endDate)}
            </p>
          </button>

          {conflictLabel ? (
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#a82a1e]">
              <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
              {conflictLabel}
            </p>
          ) : isSelecting ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#0288D1]">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Đang giữ ghế…
            </p>
          ) : null}

          <div className="mt-2.5 flex items-center justify-end">
            <Link
              href="/schedule"
              className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#0288D1] hover:underline"
            >
              Xem lịch học
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Pre-pay recruiting class list — select-class holds seat immediately. */
export function ProgramOpenClassesPreview({
  programId,
  onAvailabilityChange,
  className,
}: ProgramOpenClassesPreviewProps) {
  const { classes, isLoading, hasError, hasOpenSeats, refresh } =
    useProgramOpenClasses(programId);
  const {
    selectedClassId,
    holdExpiresAt,
    hasValidHold,
    isHoldExpired,
    selectingClassId,
    selectClass,
  } = useProgramSelectedClass();
  const { isAuthenticated, isHydrated, profile } = useCurrentUser();
  const isStudent =
    isHydrated && isAuthenticated && isStudentRole(profile?.role);

  const [busyIntervals, setBusyIntervals] = useState<StudentScheduleInterval[]>(
    [],
  );

  useEffect(() => {
    onAvailabilityChange?.(hasOpenSeats, isLoading);
  }, [hasOpenSeats, isLoading, onAvailabilityChange]);

  useEffect(() => {
    if (!isStudent) {
      setBusyIntervals([]);
      return;
    }
    let cancelled = false;
    void getMySchedule()
      .then((result) => {
        if (!cancelled) setBusyIntervals(result?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setBusyIntervals([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isStudent]);

  const conflictByClassId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const item of classes) {
      map.set(
        item.classId,
        findBusyConflictLabel(item.sessions, busyIntervals, {
          excludeClassId: item.classId,
        }),
      );
    }
    return map;
  }, [busyIntervals, classes]);

  async function handleSelect(classId: string) {
    if (selectingClassId) return;
    if (hasValidHold && selectedClassId === classId) return;

    const item = classes.find((entry) => entry.classId === classId);
    if (!item || item.seatsRemaining <= 0) return;

    const conflict = conflictByClassId.get(classId);
    if (conflict) {
      showAppErrorFromUnknown(new Error(conflict), "programs.selectClass");
      return;
    }

    try {
      await selectClass(classId);
      await refresh(classId);
    } catch {
      await refresh(selectedClassId);
    }
  }

  return (
    <section
      className={cn("space-y-3", className)}
      aria-label="Lớp đang tuyển sinh"
    >
      <div>
        <h3 className="font-heading text-base font-semibold text-[#2D2D2D]">
          Lớp đang tuyển sinh
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[#6B6B6B]">
          Bấm chọn lớp để giữ ghế ngay (5 phút). Kiểm tra{" "}
          <Link
            href="/schedule"
            className="font-semibold text-[#0288D1] hover:underline"
          >
            lịch học
          </Link>{" "}
          trước khi quyết định. Ghế/link hết hạn sau 5 phút — chọn lại nếu cần.
        </p>
        {hasValidHold && holdExpiresAt ? (
          <SeatHoldCountdown holdExpiresAt={holdExpiresAt} className="mt-2" />
        ) : isHoldExpired ? (
          <p className="mt-2 text-xs font-medium text-[#a82a1e]">
            Ghế đã hết hạn — chọn lại lớp để giữ ghế mới.
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-28 w-full rounded-xl bg-[#E5E5E0]" />
          <Skeleton className="h-28 w-full rounded-xl bg-[#E5E5E0]" />
        </div>
      ) : hasError ? (
        <div className="rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-4 py-5 text-center">
          <p className="text-sm text-[#6B6B6B]">
            Không tải được danh sách lớp. Thử lại sau.
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-[#0288D1] underline-offset-2 hover:underline"
            onClick={() => void refresh()}
          >
            Tải lại
          </button>
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-xl border border-[#E94B3C]/25 bg-[#FFF0EE] px-4 py-5">
          <p className="text-sm font-medium text-[#a82a1e]">
            Hiện tại chưa có lớp đang mở, đăng ký tạm khóa
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {classes.map((item) => (
            <li key={item.classId}>
              <OpenClassCard
                item={item}
                isSelected={selectedClassId === item.classId}
                isSelecting={selectingClassId === item.classId}
                hasValidHold={
                  hasValidHold && selectedClassId === item.classId
                }
                conflictLabel={conflictByClassId.get(item.classId) ?? null}
                onSelect={() => void handleSelect(item.classId)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
