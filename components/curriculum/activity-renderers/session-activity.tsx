import { Calendar, ExternalLink, MapPin, Users } from "lucide-react";

import type { Activity } from "@/lib/api";
import { ACTIVITY_TYPE_LABELS } from "@/lib/curriculum/constants";
import { cn } from "@/lib/utils";

type SessionActivityProps = {
  activity: Activity;
  className?: string;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SessionActivity({ activity, className }: SessionActivityProps) {
  const isLive = activity.activityType === "LiveOnline";

  return (
    <div className={cn("space-y-5", className)}>
      <p className="text-sm leading-relaxed text-[#6B6B6B]">
        {activity.description || "Chi tiết buổi học sẽ được cập nhật."}
      </p>

      <dl className="space-y-3 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] p-4">
        <div className="flex items-start gap-3 text-sm">
          <Calendar className="mt-0.5 size-4 shrink-0 text-[#6B6B6B]" aria-hidden />
          <div>
            <dt className="text-[#6B6B6B]">Thời gian</dt>
            <dd className="font-medium text-[#2D2D2D]">
              {formatDateTime(activity.startTime)}
              {activity.endTime ? ` – ${formatDateTime(activity.endTime)}` : null}
            </dd>
          </div>
        </div>

        {activity.location ? (
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-[#6B6B6B]" aria-hidden />
            <div className="min-w-0">
              <dt className="text-[#6B6B6B]">{isLive ? "Liên kết tham gia" : "Địa điểm"}</dt>
              <dd className="font-medium text-[#2D2D2D]">
                {isLive && activity.location.startsWith("http") ? (
                  <a
                    href={activity.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#4FC3F7] underline-offset-2 hover:underline"
                  >
                    Tham gia buổi học
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : (
                  activity.location
                )}
              </dd>
            </div>
          </div>
        ) : null}

        {activity.maxCapacity != null ? (
          <div className="flex items-start gap-3 text-sm">
            <Users className="mt-0.5 size-4 shrink-0 text-[#6B6B6B]" aria-hidden />
            <div>
              <dt className="text-[#6B6B6B]">Sức chứa</dt>
              <dd className="font-medium text-[#2D2D2D]">{activity.maxCapacity} học viên</dd>
            </div>
          </div>
        ) : null}
      </dl>

      {!isLive ? (
        <ul className="space-y-2 text-sm text-[#6B6B6B]">
          {activity.requireQrCheckin ? <li>• Yêu cầu check-in QR tại lớp</li> : null}
          {activity.requireMediaEvidence ? <li>• Yêu cầu nộp minh chứng ảnh/video</li> : null}
        </ul>
      ) : null}

      <p className="text-xs text-[#6B6B6B]">
        Loại hoạt động: {ACTIVITY_TYPE_LABELS[activity.activityType]}
      </p>
    </div>
  );
}
