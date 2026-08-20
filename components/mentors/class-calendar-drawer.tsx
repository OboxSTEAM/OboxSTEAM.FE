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
      <SheetPopup side="right" className="w-[min(100vw,32rem)] sm:max-w-lg">
        <SheetHeader className="pr-12">
          <SheetTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            Lịch lớp này
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {cohortName?.trim() || "Xem nhanh lịch buổi học (chỉ đọc)"}
          </p>
          {detailHref ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={detailHref} />}
              className="mt-1 h-8 w-fit gap-1.5 rounded-lg text-xs"
              onClick={() => onOpenChange(false)}
            >
              Mở chi tiết lịch
              <ExternalLink className="size-3" />
            </Button>
          ) : null}
          <SheetClose />
        </SheetHeader>
        <SheetBody className="p-0">
          {!classId ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Chưa chọn lớp.
            </p>
          ) : isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ) : (
            <SessionCalendar sessions={sessions} mode="drawer" />
          )}
        </SheetBody>
      </SheetPopup>
    </Sheet>
  );
}
