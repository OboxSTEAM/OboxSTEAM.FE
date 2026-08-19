"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  MapPin,
  Video,
} from "lucide-react";

import type { Activity, SessionAttendanceStatus } from "@/lib/api";
import type { ClassSession } from "@/lib/api/entities/class-session";
import {
  ATTENDANCE_STATUS_LABELS,
  CLASS_SESSION_KIND_LABELS,
  MENTOR_COMPLETE_ELIGIBLE_ATTENDANCE_STATUSES,
} from "@/lib/classes/constants";
import {
  formatClassSessionSchedule,
  formatJoinCountdown,
  getJoinCountdownParts,
  getLiveJoinState,
  type LiveJoinState,
} from "@/lib/classes/session-helpers";
import { ACTIVITY_TYPE_LABELS } from "@/lib/curriculum/constants";
import { cn } from "@/lib/utils";

type SessionActivityProps = {
  activity: Activity;
  nextSession?: ClassSession | null;
  isAlreadyComplete?: boolean;
  myAttendanceStatus?: SessionAttendanceStatus | null;
  className?: string;
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

export function SessionActivity({
  activity,
  nextSession = null,
  isAlreadyComplete = false,
  myAttendanceStatus = null,
  className,
}: SessionActivityProps) {
  const isLive = activity.activityType === "LiveOnline";
  const startTime = nextSession?.startTime ?? null;
  const endTime = nextSession?.endTime ?? null;
  const location = nextSession?.location ?? null;
  const hasSchedule = Boolean(nextSession);
  const schedule = startTime ? formatClassSessionSchedule(startTime, endTime) : null;
  const isAttendanceEligible =
    myAttendanceStatus != null &&
    MENTOR_COMPLETE_ELIGIBLE_ATTENDANCE_STATUSES.has(myAttendanceStatus);

  return (
    <div className={cn("space-y-5", className)}>
      <p className="text-sm leading-relaxed text-learn-muted">
        {nextSession?.description || activity.description || "Chi tiết buổi học sẽ được cập nhật."}
      </p>

      {isLive && nextSession ? <LiveJoinButton session={nextSession} /> : null}

      {isAlreadyComplete ? (
        <div className="flex items-start gap-3 rounded-xl border border-learn-success/30 bg-learn-success/10 px-4 py-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-learn-success" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-learn-success">Đã hoàn thành buổi học</p>
            <p className="mt-0.5 text-xs text-learn-muted">
              Mentor đã xác nhận điểm danh và đánh dấu hoạt động Done.
            </p>
          </div>
        </div>
      ) : hasSchedule ? (
        <div className="flex items-start gap-3 rounded-xl border border-learn-border bg-learn-surface-2 px-4 py-3">
          <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-learn-faint" aria-hidden />
          <div>
            <p className="text-sm font-medium text-learn-text-strong">
              Mentor sẽ hoàn thành sau điểm danh
            </p>
            <p className="mt-0.5 text-xs text-learn-muted">
              Tham dự buổi học. Khi mentor điểm danh (Có mặt / Đi muộn / Có phép) và hoàn thành
              hoạt động, tiến độ của bạn sẽ được cập nhật.
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
      ) : null}

      <dl className="space-y-3 rounded-xl border border-learn-border bg-learn-surface-2 p-4">
        {nextSession ? (
          <div className="flex items-start gap-3 text-sm">
            <Calendar className="mt-0.5 size-4 shrink-0 text-learn-faint" aria-hidden />
            <div>
              <dt className="text-learn-muted">Buổi học lớp</dt>
              <dd className="font-medium text-learn-text-strong">
                {nextSession.title || "Buổi học"}
                <span className="mt-1 block text-xs font-normal text-learn-muted">
                  {CLASS_SESSION_KIND_LABELS[nextSession.sessionKind]}
                </span>
              </dd>
            </div>
          </div>
        ) : null}

        <div className="flex items-start gap-3 text-sm">
          <Calendar className="mt-0.5 size-4 shrink-0 text-learn-faint" aria-hidden />
          <div className="min-w-0">
            <dt className="text-learn-muted">Thời gian</dt>
            <dd className="mt-1.5">
              {!schedule ? (
                <span className="font-medium text-learn-text-strong">Lịch sẽ được cập nhật</span>
              ) : schedule.spansMultipleDays && schedule.end ? (
                <div className="rounded-xl border border-learn-border bg-learn-surface px-4 py-3.5">
                  <ol className="relative space-y-4">
                    <span
                      aria-hidden
                      className="absolute left-[5px] top-2.5 bottom-2.5 w-px bg-learn-border-strong"
                    />
                    <li className="relative flex items-baseline gap-3 pl-6">
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 size-2.5 rounded-full border-2 border-learn-accent bg-learn-surface"
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
              ) : (
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
              )}
            </dd>
          </div>
        </div>

        {!isLive && location ? (
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-learn-faint" aria-hidden />
            <div className="min-w-0">
              <dt className="text-learn-muted">Địa điểm</dt>
              <dd className="font-medium text-learn-text-strong">{location}</dd>
            </div>
          </div>
        ) : null}

        {nextSession?.requiresAttendance ? (
          <div className="text-sm text-learn-muted">• Yêu cầu điểm danh trong buổi học</div>
        ) : null}
      </dl>

      {!hasSchedule ? (
        <p className="rounded-lg border border-dashed border-learn-border bg-learn-surface-2 px-3 py-2 text-sm text-learn-muted">
          Lịch lớp chưa được công bố. Vui lòng quay lại sau.
        </p>
      ) : null}

      {!isLive ? (
        <ul className="space-y-2 text-sm text-learn-muted">
          {activity.requireQrCheckin ? <li>• Yêu cầu check-in QR tại lớp</li> : null}
          {activity.requireMediaEvidence ? <li>• Yêu cầu nộp minh chứng ảnh/video</li> : null}
        </ul>
      ) : null}

      <p className="text-xs text-learn-faint">
        Loại hoạt động: {ACTIVITY_TYPE_LABELS[activity.activityType]}
      </p>
    </div>
  );
}
