"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ExternalLink } from "lucide-react";

import { SessionCalendar } from "@/components/manager/classes/session-calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { getClasses, getClassSessions } from "@/lib/api";
import { CLASS_SESSIONS_QUERY } from "@/lib/classes/constants";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { cn } from "@/lib/utils";

type ManagerSidebarScheduleProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed?: boolean;
};

export function ManagerSidebarSchedule({
  open,
  onOpenChange,
  collapsed = false,
}: ManagerSidebarScheduleProps) {
  const [classId, setClassId] = useState("");

  const { data: classesData, isLoading: isClassesLoading } = useClientFetch({
    enabled: open,
    fetcher: () =>
      getClasses({
        sortBy: "name",
        page: 1,
        pageSize: 100,
      }),
    deps: [open],
    onError: (error) => showAppErrorFromUnknown(error, "classes.list"),
  });

  const classes = classesData?.data?.items ?? [];
  const selectedClass = classes.find((item) => item.id === classId);

  const { data: sessionsData, isLoading: isSessionsLoading } = useClientFetch({
    enabled: open && !!classId,
    fetcher: () => getClassSessions(classId, { ...CLASS_SESSIONS_QUERY }),
    deps: [open, classId],
    onError: (error) => showAppErrorFromUnknown(error, "classSessions.list"),
  });

  const sessions = sessionsData?.data?.items ?? [];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <SidebarMenuButton
            tooltip="Lịch dạy"
            className="w-full rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          />
        }
      >
        <CalendarDays className="size-4 shrink-0" />
        {!collapsed ? <span>Lịch dạy</span> : null}
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={10}
        className="w-[min(92vw,28rem)] gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <p className="font-heading text-sm font-semibold text-foreground">
              Lịch dạy nhanh
            </p>
          </div>
          {classId ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/manager/sessions?classId=${classId}`} />
              }
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            >
              Hub lịch
              <ExternalLink className="size-3" />
            </Button>
          ) : null}
        </div>

        <div className="space-y-2 border-b border-border px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Chọn lớp
          </p>
          <Select
            value={classId || null}
            onValueChange={(value) => setClassId(value ?? "")}
            disabled={isClassesLoading}
          >
            <SelectTrigger className={cn(LIGHT_SELECT_TRIGGER, "w-full")}>
              <span className="truncate">
                {isClassesLoading
                  ? "Đang tải lớp…"
                  : selectedClass
                    ? `${selectedClass.name}${selectedClass.code ? ` (${selectedClass.code})` : ""}`
                    : "Chọn lớp học"}
              </span>
            </SelectTrigger>
            <SelectContent
              align="start"
              alignItemWithTrigger={false}
              className={cn(LIGHT_SELECT_CONTENT, "max-h-64")}
            >
              {classes.map((classItem) => (
                <SelectItem
                  key={classItem.id}
                  value={classItem.id}
                  className={LIGHT_SELECT_ITEM}
                >
                  {classItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-[min(70vh,28rem)] overflow-auto">
          {!classId ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Chọn một lớp để xem lịch nhanh.
            </p>
          ) : isSessionsLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ) : (
            <SessionCalendar sessions={sessions} mode="drawer" />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
