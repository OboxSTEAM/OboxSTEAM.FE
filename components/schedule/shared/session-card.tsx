import { formatVietnamTimeRange } from "@/lib/schedules/week";
import { cn } from "@/lib/utils";

import {
  AttendanceChip,
  SessionKindBadge,
  StatusBadge,
} from "./badges";
import { sessionKindVisual } from "./session-kind-visual";
import type { ScheduleDisplaySession } from "./types";

export function ScheduleSessionCard<T extends ScheduleDisplaySession>({
  session,
  compact,
  showTitle = false,
  onOpen,
}: {
  session: T;
  compact?: boolean;
  showTitle?: boolean;
  onOpen: (session: T) => void;
}) {
  const timeRange = formatVietnamTimeRange(session.startTime, session.endTime);
  const done = session.isCompleted || session.status === "Completed";
  const live = session.status === "InProgress";
  const attendance = session.attendanceStatus;
  const isAbsent = attendance === "Absent";
  const isPresent = attendance === "Present";
  const isLate = attendance === "Late";
  const { Icon, well, rail } = sessionKindVisual(session.sessionKind);

  return (
    <button
      type="button"
      onClick={() => onOpen(session)}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border text-left",
        "shadow-[0_1px_2px_rgba(45,45,45,0.06)]",
        "transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(45,45,45,0.08)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
        "active:translate-y-0",
        compact ? "p-2.5 pl-3.5" : "p-3 pl-4",
        isAbsent && "border-[#E94B3C]/40 bg-[#FFF5F4]",
        isPresent && "border-[#7CB342]/40 bg-[#F4FAEC]",
        isLate && "border-amber-400/70 bg-amber-50",
        !isAbsent && !isPresent && !isLate && live && "border-[#4FC3F7]/50 bg-[#F0FAFE]",
        !isAbsent &&
          !isPresent &&
          !isLate &&
          !live &&
          done &&
          "border-border bg-muted/40",
        !isAbsent &&
          !isPresent &&
          !isLate &&
          !live &&
          !done &&
          "border-border bg-card",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          isAbsent && "bg-[#E94B3C]",
          isPresent && "bg-[#7CB342]",
          isLate && "bg-amber-500",
          !isAbsent && !isPresent && !isLate && live && "bg-[#4FC3F7]",
          !isAbsent && !isPresent && !isLate && !live && rail,
        )}
      />
      <div className="flex gap-2.5">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl",
            compact ? "size-8" : "size-9",
            well,
            live && "ring-2 ring-[#4FC3F7]/35",
          )}
          aria-hidden
        >
          <Icon className={compact ? "size-3.5" : "size-4"} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-mono font-bold tabular-nums tracking-tight text-foreground",
              compact ? "text-[11px]" : "text-xs",
            )}
          >
            {timeRange}
          </p>
          <p
            className={cn(
              "mt-0.5 font-heading font-bold leading-snug text-foreground",
              compact ? "line-clamp-2 text-xs" : "text-sm",
            )}
          >
            {session.className}
          </p>
          {session.classCode ? (
            <p className="mt-0.5 font-mono text-[10px] font-medium text-muted-foreground">
              {session.classCode}
            </p>
          ) : null}
          {showTitle && session.title?.trim() ? (
            <p
              className={cn(
                "mt-1 line-clamp-2 text-muted-foreground",
                compact ? "text-[10px]" : "text-xs",
              )}
            >
              {session.title.trim()}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {attendance ? (
          <AttendanceChip status={attendance} />
        ) : (
          <StatusBadge status={session.status} isCompleted={session.isCompleted} />
        )}
        <SessionKindBadge kind={session.sessionKind} />
      </div>

      {session.meetingUrl ? (
        <p className="mt-2 text-[10px] font-semibold text-[#0288D1]">Online</p>
      ) : session.location ? (
        <p className="mt-2 line-clamp-2 text-[10px] font-medium text-muted-foreground">
          {session.location}
        </p>
      ) : null}
    </button>
  );
}
