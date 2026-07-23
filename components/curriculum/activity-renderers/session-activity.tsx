import { Calendar, ExternalLink, MapPin, Users } from "lucide-react";

import type { Activity } from "@/lib/api";
import type { ClassSession } from "@/lib/api/entities/class-session";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import { formatClassSessionSchedule } from "@/lib/classes/session-helpers";
import { ACTIVITY_TYPE_LABELS } from "@/lib/curriculum/constants";
import { cn } from "@/lib/utils";

type SessionActivityProps = {
  activity: Activity;
  nextSession?: ClassSession | null;
  className?: string;
};

export function SessionActivity({
  activity,
  nextSession = null,
  className,
}: SessionActivityProps) {
  const isLive = activity.activityType === "LiveOnline";

  // Schedule & location are owned by the class session (cohort), not the activity template.
  const startTime = nextSession?.startTime ?? null;
  const endTime = nextSession?.endTime ?? null;
  const location = nextSession?.location ?? null;
  const maxCapacity = nextSession?.maxCapacity ?? activity.maxCapacity;
  const hasSchedule = Boolean(nextSession);
  const schedule = startTime ? formatClassSessionSchedule(startTime, endTime) : null;

  return (
    <div className={cn("space-y-5", className)}>
      <p className="text-sm leading-relaxed text-learn-muted">
        {nextSession?.description || activity.description || "Chi tiết buổi học sẽ được cập nhật."}
      </p>

      <dl className="space-y-3 rounded-xl border border-learn-border bg-learn-surface-2 p-4">
        {nextSession ? (
          <div className="flex items-start gap-3 text-sm">
            <Calendar className="mt-0.5 size-4 shrink-0 text-learn-faint" aria-hidden />
            <div>
              <dt className="text-learn-muted">Buổi học lớp</dt>
              <dd className="font-medium text-learn-text-strong">
                {nextSession.title}
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

        {location ? (
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-learn-faint" aria-hidden />
            <div className="min-w-0">
              <dt className="text-learn-muted">{isLive ? "Liên kết tham gia" : "Địa điểm"}</dt>
              <dd className="font-medium text-learn-text-strong">
                {isLive && location.startsWith("http") ? (
                  <a
                    href={location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-learn-accent underline-offset-2 hover:underline"
                  >
                    Tham gia buổi học
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : (
                  location
                )}
              </dd>
            </div>
          </div>
        ) : null}

        {maxCapacity != null ? (
          <div className="flex items-start gap-3 text-sm">
            <Users className="mt-0.5 size-4 shrink-0 text-learn-faint" aria-hidden />
            <div>
              <dt className="text-learn-muted">Sức chứa</dt>
              <dd className="font-medium text-learn-text-strong">{maxCapacity} học viên</dd>
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
