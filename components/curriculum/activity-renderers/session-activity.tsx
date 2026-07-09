import { Calendar, ExternalLink, MapPin, Users } from "lucide-react";

import type { Activity } from "@/lib/api";
import type { ClassSession } from "@/lib/api/entities/class-session";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import { formatClassSessionDateTime } from "@/lib/classes/session-helpers";
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
  const isLive =
    nextSession?.sessionKind === "LiveOnline" || activity.activityType === "LiveOnline";

  const startTime = nextSession?.startTime ?? activity.startTime;
  const endTime = nextSession?.endTime ?? activity.endTime;
  const location = nextSession?.location ?? activity.location;
  const maxCapacity = nextSession?.maxCapacity ?? activity.maxCapacity;
  const hasSchedule = Boolean(nextSession);

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
          <div>
            <dt className="text-learn-muted">Thời gian</dt>
            <dd className="font-medium text-learn-text-strong">
              {startTime ? (
                <>
                  {formatClassSessionDateTime(startTime)}
                  {endTime ? ` – ${formatClassSessionDateTime(endTime)}` : null}
                </>
              ) : (
                "Lịch sẽ được cập nhật"
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
