"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink } from "lucide-react";

import { SessionCalendar } from "@/components/manager/classes/session-calendar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { getClassSessions } from "@/lib/api";
import { CLASS_SESSIONS_QUERY } from "@/lib/classes/constants";
import { showAppErrorFromUnknown } from "@/lib/errors";

type ClassCalendarDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string | null;
  className?: string | null;
  /** Deep-link into class detail schedule tab when provided. */
  detailHref?: string | null;
};

export function ClassCalendarDrawer({
  open,
  onOpenChange,
  classId,
  className: cohortName,
  detailHref,
}: ClassCalendarDrawerProps) {
  const { data, isLoading } = useClientFetch({
    enabled: open && !!classId,
    fetcher: async () => {
      if (!classId) return null;
      return getClassSessions(classId, { ...CLASS_SESSIONS_QUERY });
    },
    deps: [open, classId],
    onError: (error) => showAppErrorFromUnknown(error, "classSessions.list"),
  });

  const sessions = data?.data?.items ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup
        side="right"
        className="w-full max-w-none sm:w-[min(100vw,42rem)] lg:w-[min(100vw,56rem)] xl:w-[min(100vw,64rem)]"
      >
        <SheetHeader className="shrink-0 gap-2 pr-12 sm:px-5 sm:py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <SheetTitle className="flex items-center gap-2">
                <CalendarDays className="size-4 shrink-0 text-primary" />
                Lịch lớp này
              </SheetTitle>
              <p className="truncate text-sm text-muted-foreground">
                {cohortName?.trim() || "Xem nhanh lịch buổi học (chỉ đọc)"}
              </p>
            </div>
            {detailHref ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={detailHref} />}
                className="h-8 shrink-0 gap-1.5 rounded-lg text-xs"
                onClick={() => onOpenChange(false)}
              >
                Mở chi tiết lịch
                <ExternalLink className="size-3" />
              </Button>
            ) : null}
          </div>
          <SheetClose />
        </SheetHeader>
        <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          {!classId ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Chưa chọn lớp.
            </p>
          ) : isLoading ? (
            <div className="space-y-3 p-4 sm:p-5">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-[min(28rem,55vh)] w-full rounded-lg" />
            </div>
          ) : (
            <SessionCalendar
              sessions={sessions}
              mode="drawer"
              className="min-h-0 flex-1"
            />
          )}
        </SheetBody>
      </SheetPopup>
    </Sheet>
  );
}
