"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  MapPin,
  Video,
  type LucideIcon,
} from "lucide-react";

import { StudentSessionCheckinPanel } from "@/components/curriculum/student-session-checkin-panel";
import { SessionLocationMap } from "@/components/maps/session-location-map";
import type { Activity, SessionAttendanceStatus } from "@/lib/api";
import type { ClassSession } from "@/lib/api/entities/class-session";
import {
  ATTENDANCE_STATUS_LABELS,
  CLASS_SESSION_KIND_LABELS,
  MENTOR_COMPLETE_ELIGIBLE_ATTENDANCE_STATUSES,
} from "@/lib/classes/constants";
import {
  canGenerateSessionCheckinQr,
  formatClassSessionSchedule,
  formatJoinCountdown,
  getJoinCountdownParts,
  getLiveJoinState,
  type ClassSessionSchedule,
  type LiveJoinState,
} from "@/lib/classes/session-helpers";
import { ACTIVITY_TYPE_LABELS } from "@/lib/curriculum/constants";
import { cn } from "@/lib/utils";

type SessionActivityProps = {
  activity: Activity;
  nextSession?: ClassSession | null;
  isAlreadyComplete?: boolean;
  myAttendanceStatus?: SessionAttendanceStatus | null;
  onAttendanceChange?: (status: SessionAttendanceStatus) => void;
  className?: string;
};

type SessionLayoutShared = {
  activity: Activity;
  nextSession: ClassSession | null;
  description: string;
  schedule: ClassSessionSchedule | null;
  hasSchedule: boolean;
  isAlreadyComplete: boolean;
  myAttendanceStatus: SessionAttendanceStatus | null;
  onAttendanceChange?: (status: SessionAttendanceStatus) => void;
};

function useLiveJoinState(session: ClassSession | null): LiveJoinState | null {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  if (!session) return null;
  return getLiveJoinState(session, now);
}

function ModeChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone: "online" | "offline";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        tone === "online"
          ? "bg-learn-accent/15 text-learn-accent"
          : "bg-[#E8A87C]/20 text-[#8B5E3C]",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

function JoinCountdownHero({
  ms,
  title,
  hint,
  tone,
}: {
  ms: number;
  title: string;
  hint: string;
  tone: "locked" | "soon";
}) {
  const parts = getJoinCountdownParts(ms);
  const units = [
    ...(parts.days > 0 ? [{ label: "Ngày", value: parts.days }] : []),
    { label: "Giờ", value: parts.hours },
    { label: "Phút", value: parts.minutes },
    { label: "Giây", value: parts.seconds },
  ];
  const isSoon = tone === "soon";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border px-4 py-5 sm:px-5",
        isSoon
          ? "border-learn-accent/40 bg-learn-accent/10"
          : "border-learn-accent/25 bg-learn-surface",
      )}
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-learn-muted">
        {title}
      </p>
      <div
        className="mt-4 flex items-stretch justify-center gap-2 sm:gap-3"
        aria-live="polite"
        aria-atomic="true"
        aria-label={formatJoinCountdown(ms)}
      >
        {units.map((unit, index) => (
          <div key={unit.label} className="flex items-stretch gap-2 sm:gap-3">
            {index > 0 ? (
              <span
                className="hidden self-center font-heading text-2xl font-extrabold text-learn-faint sm:inline"
                aria-hidden
              >
                :
              </span>
            ) : null}
            <div className="min-w-[4.25rem] flex-1 sm:min-w-[5rem]">
              <div
                className={cn(
                  "rounded-2xl border px-2 py-3 text-center sm:px-3 sm:py-4",
                  isSoon
                    ? "border-learn-accent/30 bg-learn-surface shadow-[0_8px_24px_rgba(79,195,247,0.18)]"
                    : "border-learn-border bg-learn-surface-2",
                )}
              >
                <p className="font-heading text-3xl font-extrabold tabular-nums leading-none tracking-tight text-learn-text-strong sm:text-4xl">
                  {String(unit.value).padStart(2, "0")}
                </p>
              </div>
              <p className="mt-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-learn-muted">
                {unit.label}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-learn-muted">{hint}</p>
    </div>
  );
}

function LiveJoinButton({ session }: { session: ClassSession }) {
  const join = useLiveJoinState(session);
  if (!join) return null;

  if (join.phase === "cancelled") {
    return (
      <p className="rounded-xl border border-learn-border bg-learn-surface-2 px-4 py-3 text-sm text-learn-muted">
        Buổi học đã bị hủy.
      </p>
    );
  }

  if (join.phase === "locked") {
    return (
      <JoinCountdownHero
        ms={join.msUntilOpen}
        title="Cửa vào lớp chưa mở"
        hint="Nút Vào lớp học sẽ mở 15 phút trước giờ bắt đầu."
        tone="locked"
      />
    );
  }

  if (join.phase === "countdown") {
    return (
      <div className="space-y-3">
        <JoinCountdownHero
          ms={join.msUntilStart}
          title="Sắp vào lớp"
          hint="Bạn có thể tham gia từ bây giờ. Buổi học bắt đầu sau vài phút."
          tone="soon"
        />
        <a
          href={join.joinUrl ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!join.joinUrl}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-semibold",
            join.joinUrl
              ? "bg-learn-accent text-white hover:opacity-90"
              : "pointer-events-none bg-learn-surface-2 text-learn-muted",
          )}
        >
          <Video className="size-5" aria-hidden />
          Vào lớp học
          {join.joinUrl ? <ExternalLink className="size-4" aria-hidden /> : null}
        </a>
      </div>
    );
  }

  if (join.phase === "live") {
    if (!join.joinUrl) {
      return (
        <p className="rounded-xl border border-dashed border-learn-border bg-learn-surface-2 px-4 py-3 text-sm text-learn-muted">
          Link buổi học chưa được cập nhật.
        </p>
      );
    }

    return (
      <a
        href={join.joinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-learn-accent px-4 py-3.5 text-base font-semibold text-white hover:opacity-90"
      >
        <Video className="size-4" aria-hidden />
        Đang diễn ra · Vào lớp học
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    );
  }

  if (join.phase === "recording" && join.joinUrl) {
    return (
      <a
        href={join.joinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-learn-border bg-learn-surface px-4 py-3 text-sm font-semibold text-learn-text-strong hover:bg-learn-surface-2"
      >
        Xem ghi hình
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    );
  }

  return (
    <p className="rounded-xl border border-learn-border bg-learn-surface-2 px-4 py-3 text-sm text-learn-muted">
      Buổi học đã kết thúc.
    </p>
  );
}

/** Same 15-minute open window + countdown clock as online, for field / offline. */
function OfflineSessionWindow({
  join,
  requireQrCheckin,
}: {
  join: LiveJoinState;
  requireQrCheckin: boolean;
}) {
  if (join.phase === "cancelled") {
    return (
      <p className="rounded-xl border border-learn-border bg-learn-surface-2 px-4 py-3 text-sm text-learn-muted">
        Buổi học đã bị hủy.
      </p>
    );
  }

  if (join.phase === "locked") {
    return (
      <JoinCountdownHero
        ms={join.msUntilOpen}
        title="Cửa check-in chưa mở"
        hint={
          requireQrCheckin
            ? "Form check-in QR sẽ mở 15 phút trước giờ bắt đầu."
            : "Thời gian đến lớp / điểm danh mở 15 phút trước giờ bắt đầu."
        }
        tone="locked"
      />
    );
  }

  if (join.phase === "countdown") {
    return (
      <JoinCountdownHero
        ms={join.msUntilStart}
        title="Sắp đến giờ"
        hint={
          requireQrCheckin
            ? "Bạn có thể check-in từ bây giờ. Buổi học bắt đầu sau vài phút."
            : "Hãy có mặt đúng địa điểm. Buổi học bắt đầu sau vài phút."
        }
        tone="soon"
      />
    );
  }

  if (join.phase === "live") {
    return (
      <p className="rounded-xl border border-[#E8A87C]/35 bg-[#E8A87C]/12 px-4 py-3 text-sm font-semibold text-[#8B5E3C]">
        Buổi học đang diễn ra — đến đúng địa điểm
        {requireQrCheckin ? " và hoàn tất check-in" : ""}.
      </p>
    );
  }

  return (
    <p className="rounded-xl border border-learn-border bg-learn-surface-2 px-4 py-3 text-sm text-learn-muted">
      Buổi học đã kết thúc.
    </p>
  );
}

function isAttendanceCheckedIn(
  status: SessionAttendanceStatus | null | undefined,
): boolean {
  return status === "Present" || status === "Late" || status === "Excused";
}

function CompletionOrMentorNote({
  isAlreadyComplete,
  hasSchedule,
  myAttendanceStatus,
  mode,
}: {
  isAlreadyComplete: boolean;
  hasSchedule: boolean;
  myAttendanceStatus: SessionAttendanceStatus | null;
  mode: "online" | "offline";
}) {
  const isAttendanceEligible =
    myAttendanceStatus != null &&
    MENTOR_COMPLETE_ELIGIBLE_ATTENDANCE_STATUSES.has(myAttendanceStatus);

  if (isAlreadyComplete) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-learn-success/30 bg-learn-success/10 px-4 py-3">
        <CheckCircle2
          className="mt-0.5 size-4 shrink-0 text-learn-success"
          aria-hidden
        />
        <div>
          <p className="text-sm font-semibold text-learn-success">
            Đã hoàn thành buổi học
          </p>
          <p className="mt-0.5 text-xs text-learn-muted">
            Mentor đã xác nhận điểm danh và đánh dấu hoạt động Done.
          </p>
        </div>
      </div>
    );
  }

  if (!hasSchedule) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-learn-border bg-learn-surface-2 px-4 py-3">
      <ClipboardCheck
        className="mt-0.5 size-4 shrink-0 text-learn-faint"
        aria-hidden
      />
      <div>
        <p className="text-sm font-medium text-learn-text-strong">
          {mode === "online"
            ? "Mentor điểm danh trên roster"
            : "Mentor hoàn thành sau check-in / điểm danh"}
        </p>
        <p className="mt-0.5 text-xs text-learn-muted">
          {mode === "online"
            ? "Tham gia đúng giờ qua link. Khi mentor ghi Có mặt / Đi muộn / Có phép và hoàn thành hoạt động, tiến độ của bạn sẽ được cập nhật."
            : "Đến đúng địa điểm và check-in nếu được yêu cầu. Khi mentor điểm danh và hoàn thành hoạt động, tiến độ của bạn sẽ được cập nhật."}
        </p>
        {myAttendanceStatus ? (
          <p className="mt-2 text-xs font-medium text-learn-text-strong">
            Điểm danh hiện tại:{" "}
            <span
              className={cn(
                isAttendanceEligible ? "text-learn-success" : "text-learn-muted",
              )}
            >
              {ATTENDANCE_STATUS_LABELS[myAttendanceStatus]}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ScheduleTimeline({ schedule }: { schedule: ClassSessionSchedule }) {
  if (schedule.spansMultipleDays && schedule.end) {
    return (
      <div className="rounded-xl border border-learn-border bg-learn-surface px-4 py-3.5">
        <ol className="relative space-y-4">
          <span
            aria-hidden
            className="absolute bottom-2.5 left-[5px] top-2.5 w-px bg-learn-border-strong"
          />
          <li className="relative flex items-baseline gap-3 pl-6">
            <span
              aria-hidden
              className="absolute left-0 top-1.5 size-2.5 rounded-full border-2 border-[#E8A87C] bg-learn-surface"
            />
            <span className="w-16 shrink-0 whitespace-nowrap text-[11px] font-medium uppercase tracking-wide text-learn-faint">
              Bắt đầu
            </span>
            <span className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="text-[15px] font-semibold leading-none tabular-nums text-learn-text-strong">
                {schedule.start.time}
              </span>
              <span className="text-xs text-learn-muted">{schedule.start.date}</span>
            </span>
          </li>
          <li className="relative flex items-baseline gap-3 pl-6">
            <span
              aria-hidden
              className="absolute left-0 top-1.5 size-2.5 rounded-full border-2 border-learn-border-strong bg-learn-surface"
            />
            <span className="w-16 shrink-0 whitespace-nowrap text-[11px] font-medium uppercase tracking-wide text-learn-faint">
              Kết thúc
            </span>
            <span className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="text-[15px] font-semibold leading-none tabular-nums text-learn-text-strong">
                {schedule.end.time}
              </span>
              <span className="text-xs text-learn-muted">{schedule.end.date}</span>
            </span>
          </li>
        </ol>
        <span className="mt-3.5 inline-flex rounded-full border border-learn-border bg-learn-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-learn-muted">
          {schedule.relative}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-learn-border bg-learn-surface px-4 py-3.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <span className="text-[15px] font-semibold leading-none tabular-nums text-learn-text-strong">
          {schedule.start.time}
          {schedule.end ? ` – ${schedule.end.time}` : null}
        </span>
        <span className="text-xs text-learn-muted">{schedule.start.date}</span>
        <span className="inline-flex rounded-full border border-learn-border bg-learn-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-learn-muted">
          {schedule.relative}
        </span>
      </div>
    </div>
  );
}

function CompactOnlineScheduleStrip({
  nextSession,
  schedule,
}: {
  nextSession: ClassSession;
  schedule: ClassSessionSchedule | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-learn-accent/20 bg-learn-accent/5 px-4 py-3">
      <Calendar className="size-4 shrink-0 text-learn-accent" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-learn-text-strong">
          {nextSession.title || "Buổi học online"}
        </p>
        <p className="mt-0.5 text-xs text-learn-muted">
          {CLASS_SESSION_KIND_LABELS[nextSession.sessionKind]}
          {schedule
            ? ` · ${schedule.start.time}${schedule.end ? ` – ${schedule.end.time}` : ""} · ${schedule.start.date}`
            : null}
          {schedule ? ` · ${schedule.relative}` : null}
        </p>
      </div>
    </div>
  );
}

function NoScheduleNotice({ mode }: { mode: "online" | "offline" }) {
  return (
    <p className="rounded-lg border border-dashed border-learn-border bg-learn-surface-2 px-3 py-2 text-sm text-learn-muted">
      {mode === "online"
        ? "Link và lịch buổi online chưa được công bố. Vui lòng quay lại sau."
        : "Lịch và địa điểm buổi học trực tiếp chưa được công bố. Vui lòng quay lại sau."}
    </p>
  );
}

function SessionFooter({ activity }: { activity: Activity }) {
  return (
    <p className="text-xs text-learn-faint">
      Loại hoạt động: {ACTIVITY_TYPE_LABELS[activity.activityType]}
    </p>
  );
}

function OnlineSessionLayout({
  activity,
  nextSession,
  description,
  schedule,
  hasSchedule,
  isAlreadyComplete,
  myAttendanceStatus,
}: SessionLayoutShared) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <ModeChip icon={Video} label="Buổi học online" tone="online" />
        <p className="text-sm leading-relaxed text-learn-muted">{description}</p>
      </div>

      {nextSession ? (
        <div className="space-y-3 rounded-2xl border border-learn-accent/25 bg-gradient-to-b from-learn-accent/8 to-transparent p-4 sm:p-5">
          <LiveJoinButton session={nextSession} />
          <CompactOnlineScheduleStrip
            nextSession={nextSession}
            schedule={schedule}
          />
        </div>
      ) : null}

      <CompletionOrMentorNote
        isAlreadyComplete={isAlreadyComplete}
        hasSchedule={hasSchedule}
        myAttendanceStatus={myAttendanceStatus}
        mode="online"
      />

      {!hasSchedule ? <NoScheduleNotice mode="online" /> : null}

      {nextSession?.requiresAttendance ? (
        <p className="text-sm text-learn-muted">
          • Mentor sẽ điểm danh trên roster khi bạn tham gia buổi online
        </p>
      ) : null}

      <SessionFooter activity={activity} />
    </div>
  );
}

function OfflineSessionLayout({
  activity,
  nextSession,
  description,
  schedule,
  hasSchedule,
  isAlreadyComplete,
  myAttendanceStatus,
  onAttendanceChange,
}: SessionLayoutShared) {
  const location = nextSession?.location ?? null;
  const hasCoordinates =
    nextSession?.latitude != null && nextSession?.longitude != null;
  const canCheckin =
    nextSession != null && canGenerateSessionCheckinQr(nextSession);
  const joinState = useLiveJoinState(nextSession);
  const showCheckinPanel =
    canCheckin &&
    (isAttendanceCheckedIn(myAttendanceStatus) ||
      joinState?.phase === "countdown" ||
      joinState?.phase === "live");

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <ModeChip icon={MapPin} label="Buổi học trực tiếp" tone="offline" />
        <p className="text-sm leading-relaxed text-learn-muted">{description}</p>
      </div>

      {hasSchedule && nextSession && joinState ? (
        <div className="space-y-3 rounded-2xl border border-[#E8A87C]/35 bg-gradient-to-b from-[#E8A87C]/10 to-transparent p-4 sm:p-5">
          <OfflineSessionWindow
            join={joinState}
            requireQrCheckin={Boolean(activity.requireQrCheckin) || canCheckin}
          />

          <div className="overflow-hidden rounded-2xl border border-[#E8A87C]/35 bg-[#E8A87C]/8">
            <div className="space-y-3 border-b border-[#E8A87C]/25 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8A87C]/25 text-[#8B5E3C]">
                  <MapPin className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B5E3C]">
                    Địa điểm
                  </p>
                  <p className="mt-1 font-heading text-base font-bold leading-snug text-learn-text-strong">
                    {location?.trim() || "Địa điểm sẽ được cập nhật"}
                  </p>
                  <p className="mt-1 text-xs text-learn-muted">
                    {nextSession.title || "Buổi học trực tiếp"}
                    <span className="text-learn-faint">
                      {" "}
                      · {CLASS_SESSION_KIND_LABELS[nextSession.sessionKind]}
                    </span>
                  </p>
                </div>
              </div>

              {schedule ? (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-learn-muted">
                    Giờ đến lớp
                  </p>
                  <ScheduleTimeline schedule={schedule} />
                </div>
              ) : null}
            </div>

            {hasCoordinates ? (
              <SessionLocationMap
                latitude={nextSession.latitude as number}
                longitude={nextSession.longitude as number}
                locationLabel={location}
                variant="learn"
                className="rounded-none border-0 border-t border-[#E8A87C]/25"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {showCheckinPanel && nextSession ? (
        <StudentSessionCheckinPanel
          sessionId={nextSession.id}
          requireQrCheckin={activity.requireQrCheckin}
          initialStatus={myAttendanceStatus}
          onCheckedIn={onAttendanceChange}
        />
      ) : null}

      <CompletionOrMentorNote
        isAlreadyComplete={isAlreadyComplete}
        hasSchedule={hasSchedule}
        myAttendanceStatus={myAttendanceStatus}
        mode="offline"
      />

      {!hasSchedule ? <NoScheduleNotice mode="offline" /> : null}

      {nextSession?.requiresAttendance ? (
        <p className="text-sm text-learn-muted">
          • Yêu cầu điểm danh / check-in tại buổi học trực tiếp
        </p>
      ) : null}

      {activity.requireQrCheckin || activity.requireMediaEvidence ? (
        <ul className="space-y-2 text-sm text-learn-muted">
          {activity.requireQrCheckin ? (
            <li>• Yêu cầu check-in QR tại lớp</li>
          ) : null}
          {activity.requireMediaEvidence ? (
            <li>• Yêu cầu nộp minh chứng ảnh/video</li>
          ) : null}
        </ul>
      ) : null}

      <SessionFooter activity={activity} />
    </div>
  );
}

export function SessionActivity({
  activity,
  nextSession = null,
  isAlreadyComplete = false,
  myAttendanceStatus = null,
  onAttendanceChange,
  className,
}: SessionActivityProps) {
  const isLive = activity.activityType === "LiveOnline";
  const startTime = nextSession?.startTime ?? null;
  const endTime = nextSession?.endTime ?? null;
  const hasSchedule = Boolean(nextSession);
  const schedule = startTime
    ? formatClassSessionSchedule(startTime, endTime)
    : null;
  const description =
    nextSession?.description ||
    activity.description ||
    "Chi tiết buổi học sẽ được cập nhật.";

  const shared: SessionLayoutShared = {
    activity,
    nextSession,
    description,
    schedule,
    hasSchedule,
    isAlreadyComplete,
    myAttendanceStatus,
    onAttendanceChange,
  };

  return (
    <div className={cn(className)}>
      {isLive ? (
        <OnlineSessionLayout {...shared} />
      ) : (
        <OfflineSessionLayout {...shared} />
      )}
    </div>
  );
}
