"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2, Users } from "lucide-react";

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
  type Class,
} from "@/lib/api";
import { OPEN_CLASSES_QUERY } from "@/lib/classes/constants";
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

function ClassOptionCard({
  classItem,
  isSelected,
  onSelect,
}: {
  classItem: Class;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const seatsLabel =
    classItem.maxCapacity > 0
      ? `${classItem.seatsTaken}/${classItem.maxCapacity} chỗ`
      : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-colors",
        isSelected
          ? "border-[#4FC3F7] bg-[#E8F7FD] ring-2 ring-[#4FC3F7]/30"
          : "border-[#E5E5E0] bg-white hover:border-[#D4D4CF] hover:bg-[#FAFAF5]",
      )}
      aria-pressed={isSelected}
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
        {seatsLabel ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E5E5E0] bg-white px-2.5 py-1 text-xs font-medium text-[#2D2D2D]">
            <Users className="size-3.5" aria-hidden />
            {seatsLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-[#6B6B6B]">
        <p className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden />
          {formatClassDateRange(classItem.startDate, classItem.endDate)}
        </p>
        {classItem.scheduleSummary ? (
          <p className="line-clamp-2">{classItem.scheduleSummary}</p>
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
      const result = await getClasses({
        ...OPEN_CLASSES_QUERY,
        programId,
      });
      return result?.data?.items ?? [];
    },
    deps: [open, programId],
    onError: (error) => showAppErrorFromUnknown(error, "generic"),
  });

  const classes = data ?? [];

  useEffect(() => {
    if (!open) {
      setSelectedClassId(null);
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || classes.length === 0) return;
    setSelectedClassId((current) => current ?? classes[0]?.id ?? null);
  }, [classes, open]);

  const handleConfirm = useCallback(async () => {
    if (!selectedClassId) return;

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
      showAppErrorFromUnknown(error, "generic");
    } finally {
      setIsSubmitting(false);
    }
  }, [onEnrolled, onOpenChange, programEnrollmentId, selectedClassId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[min(90dvh,44rem)] max-w-xl overflow-y-auto">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>Chọn lớp học</DialogTitle>
          <DialogDescription>
            {programName
              ? `Chọn lớp đang mở cho chương trình "${programName}" trước khi bắt đầu học.`
              : "Chọn lớp đang mở trước khi bắt đầu học. Bạn có thể đóng hộp thoại này nếu chưa quyết định."}
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
          ) : classes.length === 0 ? (
            <div className="rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-4 py-6 text-center">
              <p className="text-sm text-[#6B6B6B]">
                Chưa có lớp đang mở cho chương trình này. Vui lòng quay lại sau.
              </p>
            </div>
          ) : (
            classes.map((classItem) => (
              <ClassOptionCard
                key={classItem.id}
                classItem={classItem}
                isSelected={selectedClassId === classItem.id}
                onSelect={() => setSelectedClassId(classItem.id)}
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
            disabled={!selectedClassId || isSubmitting || classes.length === 0}
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
