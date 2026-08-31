"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock3,
  ExternalLink,
  MapPin,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";

import {
  AttendanceChip,
  SessionKindBadge,
  StatusBadge,
} from "@/components/schedule/shared";
import { SessionLocationMap } from "@/components/maps/session-location-map";
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
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useLiveJoinState } from "@/hooks/use-live-join-state";
import {
  getActivityById,
  getClassSessionById,
  getMentorById,
  getMyProgramEnrollments,
} from "@/lib/api";
import type { ClassSessionKind, ClassSessionStatus } from "@/lib/api/entities/class-session";
import type { SessionAttendanceStatus } from "@/lib/api/entities/session-attendance";
import {
  canRevealSessionJoinUrl,
  formatJoinCountdown,
} from "@/lib/classes/session-helpers";
import { ACTIVITY_TYPE_LABELS } from "@/lib/curriculum/constants";
import { getProgramLearnHref } from "@/lib/programs/enrollments";
import { formatVietnamTimeRange } from "@/lib/schedules/week";
import { cn } from "@/lib/utils";

const SESSION_KIND_LABELS: Record<ClassSessionKind, string> = {
  LiveOnline: "Buổi học",
  Offline: "Ngoại khóa",
  AssignmentWindow: "Kiểm tra",
};

export type ScheduleSessionDetailSource = {
  id: string;
  classId: string;
  classCode: string;
  className: string;
  programId?: string | null;
  mentorId?: string | null;
  activityId?: string | null;
  sessionKind: ClassSessionKind;
  startTime: string;
  endTime: string;
  location?: string | null;
  meetingUrl?: string | null;
  status: ClassSessionStatus;
  isCompleted?: boolean;
  attendanceStatus?: SessionAttendanceStatus | null;
};

export function buildMentorCurriculumHref(session: {
  classId: string;
  id: string;
  activityId?: string | null;
}): string {
  const params = new URLSearchParams({
    tab: "curriculum",
    sessionId: session.id,
  });
  if (session.activityId?.trim()) {
    params.set("activityId", session.activityId.trim());
  }
  return `/mentor/classes/${session.classId}?${params.toString()}`;
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

function DetailInfoRow({
  icon: Icon,
  label,
  value,
  isLoading,
  hint,
  hintMono = true,
  href,
}: {
  icon: LucideIcon;
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

type ScheduleSessionDetailSheetProps = {
  session: ScheduleSessionDetailSource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience?: "student" | "mentor";
};

export function ScheduleSessionDetailSheet({
  session,
  open,
  onOpenChange,
  audience = "student",
}: ScheduleSessionDetailSheetProps) {
  const isMentorView = audience === "mentor";
  const mentorId = session?.mentorId ?? null;
  const scheduleActivityId = session?.activityId ?? null;
  const classId = session?.classId ?? null;
  const sessionId = session?.id ?? null;
  const programId = session?.programId ?? null;
  const isAssignmentWindow = session?.sessionKind === "AssignmentWindow";
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    setIsMapExpanded(false);
  }, [open, sessionId]);

  const { data: mentor, isLoading: isMentorLoading } = useClientFetch({
    enabled: open && Boolean(mentorId) && !isMentorView,
    fetcher: async () => {
      if (!mentorId) return null;
      const result = await getMentorById(mentorId);
      return result?.data ?? null;
    },
    deps: [mentorId, open, isMentorView],
    onError: () => undefined,
  });

  const { data: classSession, isLoading: isClassSessionLoading } =
    useClientFetch({
      enabled: open && Boolean(classId) && Boolean(sessionId),
      fetcher: async () => {
        if (!classId || !sessionId) return null;
        const result = await getClassSessionById(classId, sessionId);
        return result?.data ?? null;
      },
      deps: [classId, sessionId, open],
      onError: () => undefined,
    });

  const resolvedActivityId =
    scheduleActivityId ?? classSession?.activityId ?? null;

  const { data: enrollmentId, isLoading: isEnrollmentLoading } = useClientFetch(
    {
      enabled:
        !isMentorView &&
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
      deps: [programId, resolvedActivityId, isAssignmentWindow, open, isMentorView],
      onError: () => undefined,
    },
  );

  const { data: activity, isLoading: isActivityLoading } = useClientFetch({
    enabled:
      !isMentorView &&
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
    deps: [resolvedActivityId, enrollmentId, isAssignmentWindow, open, isMentorView],
    onError: () => undefined,
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
  const needsAssignmentId = isAssignmentWindow && !resolvedActivityId;
  const isLearnHrefReady =
    isMentorView ||
    !needsAssignmentId ||
    !isClassSessionLoading ||
    Boolean(resolvedAssignmentId);

  const timeRange = formatVietnamTimeRange(session.startTime, session.endTime);
  const attendance = isMentorView ? null : session.attendanceStatus;

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

  const learnHref =
    programId != null
      ? learnHrefForSession({
          programId,
          activityId: resolvedActivityId,
          assignmentId: resolvedAssignmentId,
        })
      : "#";

  const curriculumHref = buildMentorCurriculumHref({
    classId: session.classId,
    id: session.id,
    activityId: resolvedActivityId,
  });

  const location = liveJoinInput?.location ?? null;
  const latitude = classSession?.latitude ?? null;
  const longitude = classSession?.longitude ?? null;
  const hasCoordinates =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const activityType = activity?.activityType ?? null;
  const isVenueLoading = isMentorView
    ? isClassSessionLoading && Boolean(resolvedActivityId)
    : !isAssignmentWindow &&
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
    !isMentorView &&
    revealedMeetUrl != null &&
    (liveJoin?.phase === "countdown" || liveJoin?.phase === "live");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup
        side="right"
        className="flex w-[min(22rem,100vw)] flex-col sm:w-[min(26rem,100vw)]"
      >
        <SheetHeader className="relative shrink-0 gap-1 border-b border-border px-5 py-4 pr-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Chi tiết buổi học · {SESSION_KIND_LABELS[session.sessionKind]}
          </p>
          <SheetTitle className="text-left font-heading text-lg font-bold leading-snug text-foreground">
            {session.className}
          </SheetTitle>
          {session.classCode ? (
            <p className="font-mono text-[11px] font-medium tracking-wide text-muted-foreground">
              {session.classCode}
            </p>
          ) : null}
          <SheetClose />
        </SheetHeader>

        <SheetBody
          className={cn(
            "flex flex-1 flex-col px-5 py-5",
            isMapExpanded ? "gap-3" : "gap-5",
          )}
        >
          <div className="flex shrink-0 flex-wrap gap-1.5">
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

          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
              isMapExpanded
                ? "grid-rows-[0fr] opacity-0"
                : "grid-rows-[1fr] opacity-100",
            )}
            aria-hidden={isMapExpanded}
          >
            <div
              className={cn(
                "min-h-0 overflow-hidden",
                isMapExpanded && "pointer-events-none",
              )}
            >
              <div className="divide-y divide-border rounded-2xl border border-border bg-muted/30">
                {!isMentorView ? (
                  <DetailInfoRow
                    icon={UserRound}
                    label="Giảng viên"
                    value={mentorName}
                    hint={mentorHint || null}
                    isLoading={Boolean(mentorId) && isMentorLoading}
                  />
                ) : null}
                <DetailInfoRow
                  icon={BookOpen}
                  label="Nội dung buổi học"
                  value={contentTitle}
                  hint={contentHint || null}
                  hintMono={false}
                  isLoading={
                    isMentorView
                      ? isClassSessionLoading
                      : isClassSessionLoading || isActivityLoading
                  }
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
            </div>
          </div>

          {!isVenueLoading && isOfflineSession && hasCoordinates ? (
            <SessionLocationMap
              latitude={latitude as number}
              longitude={longitude as number}
              locationLabel={location}
              density="compact"
              expanded={isMapExpanded}
              onExpandedChange={setIsMapExpanded}
              className={cn(
                "rounded-2xl",
                isMapExpanded && "min-h-0 flex-1",
              )}
            />
          ) : null}

          <div className="mt-auto flex shrink-0 flex-col gap-2.5 pt-2">
            {canJoinMeet ? (
              <a
                href={revealedMeetUrl!}
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
            {!isMentorView && isOnlineSession && isMeetLocked && liveJoin ? (
              <p className="rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-center text-xs text-muted-foreground">
                Nút tham gia mở 15 phút trước giờ bắt đầu
                <span className="mt-1 block font-mono font-semibold tabular-nums text-foreground">
                  {formatJoinCountdown(liveJoin.msUntilOpen)}
                </span>
              </p>
            ) : null}
            {isMentorView ? (
              <Link
                href={curriculumHref}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-11 w-full rounded-xl text-sm font-semibold",
                )}
                onClick={() => onOpenChange(false)}
              >
                Mở trong chương trình
              </Link>
            ) : isLearnHrefReady ? (
              <Link
                href={learnHref}
                className={cn(
                  buttonVariants({
                    variant: canJoinMeet ? "outline" : "default",
                  }),
                  "h-11 w-full rounded-xl text-sm font-semibold",
                )}
              >
                Mở chương trình học
              </Link>
            ) : (
              <Button
                type="button"
                variant={canJoinMeet ? "outline" : "default"}
                className="h-11 w-full rounded-xl text-sm font-semibold"
                disabled
              >
                Đang tải liên kết học…
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full rounded-xl text-sm text-muted-foreground"
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
