import {
  Ban,
  Check,
  Clock3,
  ShieldCheck,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import type { SessionAttendanceStatus } from "@/lib/api/entities/session-attendance";
import {
  ATTENDANCE_STATUS_LABELS,
  CLASS_SESSION_STATUS_LABELS,
} from "@/lib/classes/constants";
import { effectiveSessionStatus } from "@/lib/classes/session-helpers";
import { formatVietnamTimeRange } from "@/lib/schedules/week";
import { cn } from "@/lib/utils";

import { sessionKindVisual } from "./session-kind-visual";
import type { ScheduleDisplaySession } from "./types";

/**
 * Header-band session card: the band carries kind (hue + icon) and time;
 * the body holds class, place, and a single status line.
 */
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
  const visual = sessionKindVisual(session.sessionKind);
  const { Icon } = visual;
  const phase = resolvePhase(session);
  const isLive = phase === "live";
  const isCancelled = phase === "cancelled";
  const isMuted = phase === "past" || isCancelled;
  const place =
    session.sessionKind === "Offline"
      ? session.location?.trim() || visual.label
      : visual.label;
  const title = showTitle ? session.title?.trim() : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(session)}
      className={cn(
        "group w-full overflow-hidden rounded-xl border text-left",
        "shadow-[0_1px_2px_rgba(45,45,45,0.06)]",
        "transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(45,45,45,0.08)]",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
        "active:translate-y-0",
        isCancelled && "border-dashed border-border bg-muted/40",
        isLive && cn("bg-card", visual.liveBorder),
        phase === "past" && "border-border bg-muted/40",
        phase === "upcoming" && "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5",
          compact ? "px-2.5 py-1" : "px-3 py-1.5",
          isCancelled
            ? "bg-muted text-muted-foreground"
            : isLive
              ? visual.bandLive
              : visual.band,
        )}
      >
        <Icon className="size-3 shrink-0" strokeWidth={2.4} aria-hidden />
        <span
          className={cn(
            "font-mono font-bold tabular-nums tracking-tight",
            compact ? "text-[11px]" : "text-xs",
          )}
        >
          {timeRange}
        </span>
      </div>

      <div className={compact ? "px-2.5 pt-1.5 pb-2.5" : "px-3 pt-2 pb-3"}>
        <p
          className={cn(
            "font-heading font-bold leading-snug",
            compact ? "line-clamp-2 text-xs" : "text-sm",
            isMuted ? "text-foreground/75" : "text-foreground",
            isCancelled && "line-through decoration-muted-foreground/60",
          )}
        >
          {session.className}
        </p>
        {title ? (
          <p
            className={cn(
              "mt-0.5 line-clamp-2 text-muted-foreground",
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            {title}
          </p>
        ) : null}
        <p className="mt-1 truncate text-[10px] text-muted-foreground">{place}</p>
        {session.classCode ? (
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/70">
            {session.classCode}
          </p>
        ) : null}
        {session.hasAcceptedExpert ? (
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#7E57C2] dark:text-[#B39DDB]">
            <UserRound className="size-2.5" strokeWidth={2.6} aria-hidden />
            Chuyên gia
          </p>
        ) : null}
        <SessionStatusLine
          session={session}
          phase={phase}
          liveDotClassName={visual.dot}
          liveTextClassName={visual.ink}
        />
      </div>
    </button>
  );
}

function SessionStatusLine({
  session,
  phase,
  liveDotClassName,
  liveTextClassName,
}: {
  session: ScheduleDisplaySession;
  phase: SessionPhase;
  liveDotClassName: string;
  liveTextClassName: string;
}) {
  if (phase === "live") {
    return (
      <p
        className={cn(
          "mt-2 flex items-center gap-1.5 text-[10px] font-semibold",
          liveTextClassName,
        )}
      >
        <span className="relative flex size-2 shrink-0" aria-hidden>
          <span
            className={cn(
              "absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping",
              liveDotClassName,
            )}
          />
          <span className={cn("relative size-2 rounded-full", liveDotClassName)} />
        </span>
        {CLASS_SESSION_STATUS_LABELS.InProgress}
      </p>
    );
  }

  const status = resolveStatusGlyph(session, phase);
  if (!status) return null;
  const { Icon, label, iconClassName } = status;

  return (
    <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-foreground/70">
      <Icon
        className={cn("size-3 shrink-0", iconClassName)}
        strokeWidth={2.6}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </p>
  );
}

const ATTENDANCE_GLYPHS: Record<
  Exclude<SessionAttendanceStatus, "Expected">,
  { Icon: LucideIcon; iconClassName: string }
> = {
  Present: { Icon: Check, iconClassName: "text-[#7CB342]" },
  Late: { Icon: Clock3, iconClassName: "text-amber-500" },
  Absent: { Icon: X, iconClassName: "text-[#E94B3C]" },
  Excused: { Icon: ShieldCheck, iconClassName: "text-[#0288D1]" },
};

function resolvePhase(session: ScheduleDisplaySession): SessionPhase {
  if (session.status === "Cancelled") return "cancelled";
  if (session.isCompleted) return "past";
  const status = effectiveSessionStatus(session);
  if (status === "Completed") return "past";
  if (status === "InProgress") return "live";
  return "upcoming";
}

/** Attendance once the session is over; lifecycle otherwise. Upcoming shows nothing. */
function resolveStatusGlyph(
  session: ScheduleDisplaySession,
  phase: Exclude<SessionPhase, "live">,
): { Icon: LucideIcon; label: string; iconClassName: string } | null {
  if (phase === "cancelled") {
    return {
      Icon: Ban,
      label: CLASS_SESSION_STATUS_LABELS.Cancelled,
      iconClassName: "text-muted-foreground",
    };
  }
  if (phase !== "past") return null;

  const attendance = session.attendanceStatus;
  if (attendance && attendance !== "Expected") {
    return { ...ATTENDANCE_GLYPHS[attendance], label: ATTENDANCE_STATUS_LABELS[attendance] };
  }
  if (attendance === "Expected") {
    return {
      Icon: Clock3,
      label: ATTENDANCE_STATUS_LABELS.Expected,
      iconClassName: "text-muted-foreground",
    };
  }
  return {
    Icon: Check,
    label: CLASS_SESSION_STATUS_LABELS.Completed,
    iconClassName: "text-muted-foreground",
  };
}

type SessionPhase = "upcoming" | "live" | "past" | "cancelled";
