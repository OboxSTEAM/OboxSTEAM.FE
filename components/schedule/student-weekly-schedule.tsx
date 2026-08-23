"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  UserRound,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionLocationMap } from "@/components/maps/session-location-map";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLiveJoinState } from "@/hooks/use-live-join-state";
import {
  getActivityById,
  getClassSessionById,
  getMentorById,
  getMyProgramEnrollments,
} from "@/lib/api";
import {
  getWeeklySchedule,
  type ScheduleDay,
  type ScheduleSession,
  type WeeklySchedule,
} from "@/lib/api/schedules";
import { isStudentRole } from "@/lib/auth/roles";
import {
  ATTENDANCE_STATUS_LABELS,
  CLASS_SESSION_STATUS_LABELS,
} from "@/lib/classes/constants";
import {
  canRevealSessionJoinUrl,
  formatJoinCountdown,
} from "@/lib/classes/session-helpers";
import { ACTIVITY_TYPE_LABELS } from "@/lib/curriculum/constants";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { getProgramLearnHref } from "@/lib/programs/enrollments";
import {
  addDaysToDateOnly,
  formatDayColumnLabel,
  formatVietnamTimeRange,
  formatWeekRangeLabel,
  getVietnamMondayOf,
  isMondayDateOnly,
  isTodayDateOnly,
} from "@/lib/schedules/week";
import { cn } from "@/lib/utils";

const SESSION_KIND_LABELS = {
  LiveOnline: "Buổi học",
  Offline: "Ngoại khóa",
  AssignmentWindow: "Nộp bài",
} as const;

function SessionKindBadge({ kind }: { kind: ScheduleSession["sessionKind"] }) {
  return (
    <Badge
      variant="secondary"
      className="rounded-md px-1.5 py-0 text-[10px] font-semibold"
    >
      {SESSION_KIND_LABELS[kind]}
    </Badge>
  );
}

function StatusBadge({
  status,
  isCompleted,
}: {
  status: ScheduleSession["status"];
  isCompleted: boolean;
}) {
  const done = isCompleted || status === "Completed";
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-1.5 py-0 text-[10px] font-medium",
        done && "border-emerald-300 bg-emerald-50 text-emerald-800",
        status === "InProgress" &&
          "border-[#4FC3F7]/50 bg-[#4FC3F7]/15 text-[#0277BD]",
      )}
    >
      {CLASS_SESSION_STATUS_LABELS[status]}
    </Badge>
  );
}

function AttendanceChip({
  status,
}: {
  status: ScheduleSession["attendanceStatus"];
}) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        status === "Present" && "bg-[#7CB342] text-white shadow-sm",
        status === "Late" && "bg-amber-500 text-white shadow-sm",
        status === "Absent" && "bg-[#E94B3C] text-white shadow-sm",
        status === "Expected" && "bg-[#2D2D2D]/10 text-[#2D2D2D]",
        status === "Excused" && "bg-[#4FC3F7] text-white shadow-sm",
      )}
    >
      {ATTENDANCE_STATUS_LABELS[status]}
    </span>
  );
}

function SessionCard({
  session,
  compact,
  onOpen,
}: {
  session: ScheduleSession;
  compact?: boolean;
  onOpen: (session: ScheduleSession) => void;
}) {
  const timeRange = formatVietnamTimeRange(session.startTime, session.endTime);
  const done = session.isCompleted || session.status === "Completed";
  const live = session.status === "InProgress";
  const attendance = session.attendanceStatus;
  const isAbsent = attendance === "Absent";
  const isPresent = attendance === "Present";
  const isLate = attendance === "Late";

  return (
    <button
      type="button"
      onClick={() => onOpen(session)}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border text-left",
        "bg-white shadow-[0_1px_2px_rgba(45,45,45,0.06)]",
        "transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(45,45,45,0.1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
        "active:translate-y-0",
        isAbsent && "border-[#E94B3C] bg-[#FFF5F4] shadow-[0_0_0_1px_rgba(233,75,60,0.25)]",
        isPresent && "border-[#7CB342] bg-[#F4FAEC] shadow-[0_0_0_1px_rgba(124,179,66,0.25)]",
        isLate && "border-amber-500 bg-amber-50 shadow-[0_0_0_1px_rgba(245,158,11,0.25)]",
        !isAbsent &&
          !isPresent &&
          !isLate &&
          live &&
          "border-[#4FC3F7] bg-[#F0FAFE] shadow-[0_0_0_1px_rgba(79,195,247,0.35)]",
        !isAbsent &&
          !isPresent &&
          !isLate &&
          !live &&
          done &&
          "border-emerald-200/90 bg-emerald-50/50",
        !isAbsent &&
          !isPresent &&
          !isLate &&
          !live &&
          !done &&
          "border-[#E5E5E0]",
        compact ? "p-2.5 pl-3.5" : "p-3.5 pl-4",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          isAbsent && "bg-[#E94B3C]",
          isPresent && "bg-[#7CB342]",
          isLate && "bg-amber-500",
          !isAbsent && !isPresent && !isLate && live && "bg-[#4FC3F7]",
          !isAbsent &&
            !isPresent &&
            !isLate &&
            !live &&
            done &&
            "bg-emerald-400",
          !isAbsent &&
            !isPresent &&
            !isLate &&
            !live &&
            !done &&
            "bg-[#FDD835]",
        )}
      />

      <p
        className={cn(
          "font-mono font-bold tabular-nums tracking-tight text-[#2D2D2D]",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {timeRange}
      </p>
      <p
        className={cn(
          "mt-1 font-heading font-bold leading-snug text-[#2D2D2D]",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {session.className}
      </p>
      {session.classCode ? (
        <p className="mt-0.5 font-mono text-[10px] font-medium text-[#6B6B6B]">
          {session.classCode}
        </p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {attendance ? (
          <AttendanceChip status={attendance} />
        ) : (
          <StatusBadge status={session.status} isCompleted={session.isCompleted} />
        )}
        <SessionKindBadge kind={session.sessionKind} />
      </div>

      {session.meetingUrl ? (
        <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#0288D1]">
          <Video className="size-3 shrink-0" aria-hidden />
          Online
        </p>
      ) : session.location ? (
        <p className="mt-2 flex items-start gap-1 text-[10px] font-medium text-[#6B6B6B]">
          <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span className="line-clamp-2">{session.location}</span>
        </p>
      ) : null}
    </button>
  );
}

function DayColumn({
  day,
  onOpen,
  isFirst,
  isLast,
}: {
  day: ScheduleDay;
  onOpen: (session: ScheduleSession) => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const { weekday, dayMonth } = formatDayColumnLabel(day.date);
  const isToday = isTodayDateOnly(day.date);
  const sessionCount = day.sessions.length;
  const hasSessions = sessionCount > 0;

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col",
        !isLast && "border-r border-[#E5E5E0]",
        isToday ? "bg-[#FFF8F7]" : hasSessions ? "bg-white" : "bg-[#FAFAF5]/80",
      )}
    >
      <div
        className={cn(
          "border-b px-2 py-3 text-center xl:px-3",
          isToday
            ? "border-[#E94B3C]/25 bg-[#E94B3C] text-white"
            : "border-[#E5E5E0] bg-[#F5F5F0]",
          isFirst && "rounded-tl-2xl",
          isLast && "rounded-tr-2xl",
        )}
      >
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.14em]",
            isToday ? "text-white/90" : "text-[#6B6B6B]",
          )}
        >
          {weekday}
        </p>
        <p
          className={cn(
            "mt-0.5 font-heading text-base font-bold tabular-nums",
            isToday ? "text-white" : "text-[#2D2D2D]",
          )}
        >
          {dayMonth}
        </p>
        {isToday ? (
          <span className="mt-1 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            Hôm nay
          </span>
        ) : hasSessions ? (
          <span className="mt-1 inline-flex rounded-full bg-[#2D2D2D]/8 px-2 py-0.5 font-mono text-[9px] font-bold text-[#2D2D2D]">
            {sessionCount} buổi
          </span>
        ) : (
          <span className="mt-1 block h-[18px]" aria-hidden />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-2">
        {!hasSessions ? (
          <p className="px-1 py-8 text-center text-[11px] font-medium text-[#6B6B6B]/70">
            Không có buổi học
          </p>
        ) : (
          day.sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              compact
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DetailInfoRow({
  icon: Icon,
  label,
  value,
  isLoading,
  hint,
  hintMono = true,
  href,
}: {
  icon: typeof Clock3;
  label: string;
  value: string | null | undefined;
  isLoading?: boolean;
  hint?: string | null;
  hintMono?: boolean;
  href?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 first:pt-4 last:pb-4">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#2D2D2D] shadow-sm ring-1 ring-[#E5E5E0]">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
          {label}
        </p>
        {isLoading ? (
          <div className="mt-1.5 space-y-1.5">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
        ) : (
          <>
            {href?.trim() && value?.trim() ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 flex max-w-full items-center gap-1.5 text-sm font-semibold leading-snug text-[#0288D1] underline-offset-2 hover:underline"
              >
                <span className="min-w-0 truncate">{value.trim()}</span>
                <ExternalLink className="size-3.5 shrink-0 opacity-70" />
              </a>
            ) : (
              <p className="mt-0.5 text-sm font-semibold leading-snug text-[#2D2D2D]">
                {value?.trim() || "Chưa có thông tin"}
              </p>
            )}
            {hint?.trim() ? (
              <p
                className={cn(
                  "mt-1 text-[11px] leading-relaxed text-[#6B6B6B]",
                  hintMono && "font-mono",
                )}
              >
                {hint}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function learnHrefForSession(input: {
  programId: string;
  activityId?: string | null;
  assignmentId?: string | null;
}): string {
  const base = getProgramLearnHref(input.programId);
  if (input.assignmentId?.trim()) {
    return `${base}?assignmentId=${encodeURIComponent(input.assignmentId.trim())}`;
  }
  if (input.activityId?.trim()) {
    return `${base}?activityId=${encodeURIComponent(input.activityId.trim())}`;
  }
  return base;
}

function SessionDetailSheet({
  session,
  open,
  onOpenChange,
}: {
  session: ScheduleSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mentorId = session?.mentorId ?? null;
  const scheduleActivityId = session?.activityId ?? null;
  const classId = session?.classId ?? null;
  const sessionId = session?.id ?? null;
  const programId = session?.programId ?? null;
  const isAssignmentWindow = session?.sessionKind === "AssignmentWindow";

  const { data: mentor, isLoading: isMentorLoading } = useClientFetch({
    enabled: open && Boolean(mentorId),
    fetcher: async () => {
      if (!mentorId) return null;
      const result = await getMentorById(mentorId);
      return result?.data ?? null;
    },
    deps: [mentorId, open],
    onError: () => {
      /* Optional enrichment — keep sheet usable without mentor name. */
    },
  });

  /** Student-accessible session detail — has title, assignmentId, venue fields. */
  const { data: classSession, isLoading: isClassSessionLoading } =
    useClientFetch({
      enabled: open && Boolean(classId) && Boolean(sessionId),
      fetcher: async () => {
        if (!classId || !sessionId) return null;
        const result = await getClassSessionById(classId, sessionId);
        return result?.data ?? null;
      },
      deps: [classId, sessionId, open],
      onError: () => {
        /* Optional — still can open learn with activityId from schedule. */
      },
    });

  const resolvedActivityId =
    scheduleActivityId ?? classSession?.activityId ?? null;

  const {
    data: enrollmentId,
    isLoading: isEnrollmentLoading,
  } = useClientFetch({
    enabled:
      open &&
      Boolean(programId) &&
      Boolean(resolvedActivityId) &&
      !isAssignmentWindow,
    fetcher: async () => {
      if (!programId) return null;
      const result = await getMyProgramEnrollments({
        page: 1,
        pageSize: 50,
        sortBy: "enrolledAt",
        isDescending: true,
      });
      const match = result?.data?.items?.find(
        (item) =>
          item.programId === programId &&
          (item.status === "Active" || item.status === "Completed"),
      );
      return match?.id ?? null;
    },
    deps: [programId, resolvedActivityId, isAssignmentWindow, open],
    onError: () => {
      /* Venue falls back without activityType. */
    },
  });

  const { data: activity, isLoading: isActivityLoading } = useClientFetch({
    enabled:
      open &&
      Boolean(resolvedActivityId) &&
      Boolean(enrollmentId) &&
      !isAssignmentWindow,
    fetcher: async () => {
      if (!resolvedActivityId || !enrollmentId) return null;
      const result = await getActivityById(resolvedActivityId, {
        programEnrollmentId: enrollmentId,
      });
      return result?.data ?? null;
    },
    deps: [resolvedActivityId, enrollmentId, isAssignmentWindow, open],
    onError: () => {
      /* Optional enrichment. */
    },
  });

  const liveJoinInput = useMemo(() => {
    if (!session) return null;
    return {
      status: classSession?.status ?? session.status,
      startTime: classSession?.startTime ?? session.startTime,
      endTime: classSession?.endTime ?? session.endTime,
      meetingUrl:
        session.meetingUrl?.trim() || classSession?.meetingUrl?.trim() || null,
      location:
        session.location?.trim() || classSession?.location?.trim() || null,
    };
  }, [session, classSession]);

  const liveJoin = useLiveJoinState(open ? liveJoinInput : null);

  if (!session) return null;

  const resolvedAssignmentId = classSession?.assignmentId ?? null;
  const needsAssignmentId =
    isAssignmentWindow && !resolvedActivityId;
  const isLearnHrefReady =
    !needsAssignmentId || !isClassSessionLoading || Boolean(resolvedAssignmentId);

  const timeRange = formatVietnamTimeRange(session.startTime, session.endTime);
  const attendance = session.attendanceStatus;
  const isAbsent = attendance === "Absent";
  const isPresent = attendance === "Present";
  const isLate = attendance === "Late";
  const accentBar = isAbsent
    ? "bg-[#E94B3C]"
    : isPresent
      ? "bg-[#7CB342]"
      : isLate
        ? "bg-amber-500"
        : session.status === "InProgress"
          ? "bg-[#4FC3F7]"
          : "bg-[#FDD835]";

  const mentorName =
    mentor?.fullName?.trim() ||
    mentor?.code?.trim() ||
    (mentorId ? "Giảng viên lớp" : "Chưa gán giảng viên");
  const mentorHint = [mentor?.title?.trim(), mentor?.organization?.trim()]
    .filter(Boolean)
    .join(" · ");

  const contentTitle =
    activity?.name?.trim() ||
    classSession?.title?.trim() ||
    SESSION_KIND_LABELS[session.sessionKind];
  const contentHint = [
    activity?.activityType
      ? ACTIVITY_TYPE_LABELS[activity.activityType]
      : null,
    activity?.description?.trim() || classSession?.description?.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const learnHref = learnHrefForSession({
    programId: session.programId,
    activityId: resolvedActivityId,
    assignmentId: resolvedAssignmentId,
  });

  const location = liveJoinInput?.location ?? null;
  const latitude = classSession?.latitude ?? null;
  const longitude = classSession?.longitude ?? null;
  const hasCoordinates =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  /**
   * Prefer activityType from curriculum. While enrichment runs, show skeleton.
   * If enrichment never resolves (no enrollment / 403), fall back to sessionKind
   * so Meet/location from the schedule/session DTO still render.
   */
  const activityType = activity?.activityType ?? null;
  const isVenueLoading =
    !isAssignmentWindow &&
    Boolean(resolvedActivityId) &&
    (isClassSessionLoading ||
      isEnrollmentLoading ||
      (Boolean(enrollmentId) && isActivityLoading));
  const isOnlineSession =
    !isAssignmentWindow &&
    (activityType === "LiveOnline" ||
      (!isVenueLoading &&
        activityType == null &&
        session.sessionKind === "LiveOnline"));
  const isOfflineSession =
    !isAssignmentWindow &&
    (activityType === "Offline" ||
      (!isVenueLoading &&
        activityType == null &&
        session.sessionKind === "Offline"));

  const canRevealMeet =
    liveJoin != null && canRevealSessionJoinUrl(liveJoin.phase);
  const revealedMeetUrl = canRevealMeet ? liveJoin.joinUrl : null;
  const isMeetLocked = liveJoin?.phase === "locked";
  const isMeetCancelled = liveJoin?.phase === "cancelled";
  const isMeetEnded =
    liveJoin?.phase === "ended" ||
    (liveJoin?.phase === "recording" && !liveJoin.joinUrl);
  const canJoinMeet =
    revealedMeetUrl != null &&
    (liveJoin?.phase === "countdown" || liveJoin?.phase === "live");
  const canOpenRecording =
    revealedMeetUrl != null && liveJoin?.phase === "recording";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup
        side="right"
        className="flex w-[min(22rem,100vw)] flex-col sm:w-[min(26rem,100vw)]"
      >
        <div className={cn("h-1.5 shrink-0", accentBar)} aria-hidden />

        <SheetHeader className="relative shrink-0 gap-1 border-b border-[#E5E5E0] px-5 py-4 pr-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6B6B]">
            Chi tiết buổi học · {SESSION_KIND_LABELS[session.sessionKind]}
          </p>
          <SheetTitle className="text-left font-heading text-lg font-bold leading-snug text-[#2D2D2D]">
            {session.className}
          </SheetTitle>
          {session.classCode ? (
            <p className="font-mono text-[11px] font-medium tracking-wide text-[#6B6B6B]">
              {session.classCode}
            </p>
          ) : null}
          <SheetClose />
        </SheetHeader>

        <SheetBody className="flex flex-1 flex-col gap-5 px-5 py-5">
          <div className="flex flex-wrap gap-1.5">
            {attendance ? (
              <AttendanceChip status={attendance} />
            ) : (
              <StatusBadge
                status={session.status}
                isCompleted={session.isCompleted}
              />
            )}
            <SessionKindBadge kind={session.sessionKind} />
            {attendance ? (
              <StatusBadge
                status={session.status}
                isCompleted={session.isCompleted}
              />
            ) : null}
          </div>

          <div className="divide-y divide-[#E5E5E0] rounded-2xl border border-[#E5E5E0] bg-[#FAFAF5]">
            <DetailInfoRow
              icon={UserRound}
              label="Giảng viên"
              value={mentorName}
              hint={mentorHint || null}
              isLoading={Boolean(mentorId) && isMentorLoading}
            />
            <DetailInfoRow
              icon={BookOpen}
              label="Nội dung buổi học"
              value={contentTitle}
              hint={contentHint || null}
              hintMono={false}
              isLoading={isClassSessionLoading || isActivityLoading}
            />
            <DetailInfoRow
              icon={Clock3}
              label="Thời gian (VN)"
              value={timeRange}
            />
            {isVenueLoading ? (
              <DetailInfoRow
                icon={Video}
                label="Hình thức"
                value={null}
                isLoading
              />
            ) : null}
            {!isVenueLoading && isOnlineSession ? (
              <DetailInfoRow
                icon={Video}
                label="Link tham gia (Google Meet)"
                value={
                  isMeetCancelled
                    ? "Buổi học đã bị hủy"
                    : isMeetEnded
                      ? "Buổi học đã kết thúc"
                      : isMeetLocked
                        ? "Chưa mở"
                        : revealedMeetUrl
                          ? revealedMeetUrl.replace(/^https?:\/\//, "")
                          : "Online — chờ link"
                }
                href={revealedMeetUrl}
                hint={
                  isMeetCancelled || isMeetEnded
                    ? null
                    : isMeetLocked && liveJoin
                      ? `Link Meet mở 15 phút trước giờ bắt đầu · còn ${formatJoinCountdown(liveJoin.msUntilOpen)}`
                      : revealedMeetUrl
                        ? null
                        : "Buổi online đã lên lịch; link Meet sẽ cập nhật sau."
                }
                hintMono={false}
              />
            ) : null}
            {!isVenueLoading && isOfflineSession ? (
              <DetailInfoRow
                icon={MapPin}
                label="Địa điểm"
                value={location || "Chưa có địa điểm"}
              />
            ) : null}
          </div>

          {!isVenueLoading && isOfflineSession && hasCoordinates ? (
            <SessionLocationMap
              latitude={latitude as number}
              longitude={longitude as number}
              locationLabel={location}
              variant="learn"
              className="rounded-2xl"
            />
          ) : null}

          <div className="mt-auto flex flex-col gap-2.5 pt-2">
            {isOnlineSession && canJoinMeet ? (
              <a
                href={revealedMeetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-11 w-full gap-2 rounded-xl text-sm font-semibold",
                )}
              >
                <Video className="size-4" />
                Tham gia Google Meet
                <ExternalLink className="size-3.5 opacity-80" />
              </a>
            ) : null}
            {isOnlineSession && canOpenRecording ? (
              <a
                href={revealedMeetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 w-full gap-2 rounded-xl border-[#E5E5E0] text-sm font-semibold",
                )}
              >
                Xem ghi hình
                <ExternalLink className="size-3.5 opacity-80" />
              </a>
            ) : null}
            {isOnlineSession && isMeetLocked && liveJoin ? (
              <p className="rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-3.5 py-3 text-center text-xs text-[#6B6B6B]">
                Nút tham gia mở 15 phút trước giờ bắt đầu
                <span className="mt-1 block font-mono font-semibold tabular-nums text-[#2D2D2D]">
                  {formatJoinCountdown(liveJoin.msUntilOpen)}
                </span>
              </p>
            ) : null}
            {isLearnHrefReady ? (
              <Link
                href={learnHref}
                className={cn(
                  buttonVariants({
                    variant:
                      canJoinMeet || canOpenRecording ? "outline" : "default",
                  }),
                  "h-11 w-full rounded-xl text-sm font-semibold",
                )}
              >
                Mở chương trình học
              </Link>
            ) : (
              <Button
                type="button"
                variant={
                  canJoinMeet || canOpenRecording ? "outline" : "default"
                }
                className="h-11 w-full rounded-xl text-sm font-semibold"
                disabled
              >
                Đang tải liên kết học…
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full rounded-xl text-sm text-[#6B6B6B]"
              onClick={() => onOpenChange(false)}
            >
              Đóng
            </Button>
          </div>
        </SheetBody>
      </SheetPopup>
    </Sheet>
  );
}

function ScheduleSkeleton({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-7 gap-0 overflow-hidden rounded-2xl border border-border">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            "h-64 rounded-none",
            index > 0 && "border-l border-border",
          )}
        />
      ))}
    </div>
  );
}

export function StudentWeeklySchedule() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { profile, isAuthenticated, isHydrated, isLoading } = useCurrentUser();

  /** `null` = omit weekStart so BE uses current VN Monday. */
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] =
    useState<ScheduleSession | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobileDay, setMobileDay] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated || isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?returnUrl=%2Fschedule");
      return;
    }
    if (profile && !isStudentRole(profile.role)) {
      router.replace("/");
    }
  }, [isAuthenticated, isHydrated, isLoading, profile, router]);

  const canFetch =
    isHydrated && isAuthenticated && isStudentRole(profile?.role);

  const {
    data,
    isLoading: isScheduleLoading,
    markLoading,
    retry,
    hasError,
  } = useClientFetch({
    enabled: canFetch,
    fetcher: async (): Promise<WeeklySchedule> => {
      if (weekStart && !isMondayDateOnly(weekStart)) {
        throw new Error("Chọn ngày bắt đầu tuần (Thứ Hai)");
      }
      const result = await getWeeklySchedule({
        weekStart: weekStart ?? undefined,
      });
      return result.data;
    },
    deps: [weekStart],
    onError: (error) => showAppErrorFromUnknown(error, "schedule.weekly"),
  });

  const days = data?.days ?? [];
  const resolvedWeekStart = data?.weekStart ?? weekStart ?? getVietnamMondayOf();
  const resolvedWeekEnd =
    data?.weekEnd ?? addDaysToDateOnly(resolvedWeekStart, 6);
  const weekHasSessions = days.some((day) => day.sessions.length > 0);

  useEffect(() => {
    if (!days.length) return;
    const today = days.find((day) => isTodayDateOnly(day.date));
    setMobileDay((prev) => {
      if (prev && days.some((day) => day.date === prev)) return prev;
      return today?.date ?? days[0]?.date ?? null;
    });
  }, [days]);

  const activeMobileDay = useMemo(
    () => days.find((day) => day.date === mobileDay) ?? days[0] ?? null,
    [days, mobileDay],
  );

  function goPrevWeek() {
    markLoading();
    setWeekStart(addDaysToDateOnly(resolvedWeekStart, -7));
  }

  function goNextWeek() {
    markLoading();
    setWeekStart(addDaysToDateOnly(resolvedWeekStart, 7));
  }

  function goToday() {
    markLoading();
    setWeekStart(null);
  }

  function openSession(session: ScheduleSession) {
    setSelectedSession(session);
    setDetailOpen(true);
  }

  if (!isHydrated || isLoading || !canFetch) {
    return (
      <div className="mx-auto w-full max-w-[96rem] px-3 py-10 sm:px-5 lg:px-6">
        <ScheduleSkeleton mobile={Boolean(isMobile)} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[96rem] px-3 py-8 sm:px-5 sm:py-10 lg:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Học viên
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Lịch học
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Thời khóa biểu theo tuần của mọi lớp đang học — không gồm bài tự học.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-xl"
            onClick={goPrevWeek}
            aria-label="Tuần trước"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="min-w-[10.5rem] rounded-xl border border-border bg-card px-3 py-2 text-center">
            <p className="font-heading text-sm font-semibold text-foreground">
              {formatWeekRangeLabel(resolvedWeekStart, resolvedWeekEnd)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-xl"
            onClick={goNextWeek}
            aria-label="Tuần sau"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-9 rounded-xl px-3 text-sm font-semibold"
            onClick={goToday}
          >
            Hôm nay
          </Button>
        </div>
      </div>

      {isScheduleLoading ? (
        <ScheduleSkeleton mobile={Boolean(isMobile)} />
      ) : hasError ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <CalendarDays className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-heading text-lg font-semibold">
            Không tải được lịch học
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kiểm tra kết nối rồi thử lại — tuần đang xem vẫn được giữ.
          </p>
          <Button
            type="button"
            className="mt-4 rounded-xl"
            onClick={() => {
              markLoading();
              retry();
            }}
          >
            Thử lại
          </Button>
        </div>
      ) : !weekHasSessions ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <CalendarDays className="mx-auto size-9 text-muted-foreground" />
          <p className="mt-3 font-heading text-lg font-semibold text-foreground">
            Tuần này chưa có lịch
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Kiểm tra lớp đã enroll chưa, hoặc chuyển sang tuần khác.
          </p>
          <Link
            href="/courses"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mt-5 rounded-xl",
            )}
          >
            Xem khóa học của tôi
          </Link>
        </div>
      ) : isMobile ? (
        <Tabs
          value={activeMobileDay?.date ?? undefined}
          onValueChange={setMobileDay}
          className="gap-4"
        >
          <TabsList className="flex h-auto w-full gap-0 overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white p-0 shadow-sm">
            {days.map((day, index) => {
              const { weekday } = formatDayColumnLabel(day.date);
              const today = isTodayDateOnly(day.date);
              return (
                <TabsTrigger
                  key={day.date}
                  value={day.date}
                  className={cn(
                    "h-auto flex-1 rounded-none border-0 px-1 py-2.5 text-[11px] shadow-none after:hidden",
                    "data-active:bg-[#E94B3C] data-active:text-white data-active:shadow-none",
                    index > 0 && "border-l border-[#E5E5E0]",
                    today &&
                      "bg-[#FFF5F4] font-bold text-[#E94B3C] data-active:bg-[#E94B3C] data-active:text-white",
                  )}
                >
                  <span className="flex flex-col items-center gap-0.5">
                    <span className="font-bold uppercase tracking-wide">
                      {weekday}
                    </span>
                    {day.sessions.length > 0 ? (
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          "group-data-active:bg-white bg-[#E94B3C]",
                        )}
                        aria-label={`${day.sessions.length} buổi`}
                      />
                    ) : (
                      <span className="h-1.5" aria-hidden />
                    )}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          {days.map((day) => (
            <TabsContent key={day.date} value={day.date} className="mt-0">
              <div className="space-y-2">
                {day.sessions.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                    Không có buổi học
                  </p>
                ) : (
                  day.sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onOpen={openSession}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-7">
            {days.map((day, index) => (
              <DayColumn
                key={day.date}
                day={day}
                onOpen={openSession}
                isFirst={index === 0}
                isLast={index === days.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      <SessionDetailSheet
        session={selectedSession}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
