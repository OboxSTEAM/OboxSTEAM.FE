import { Badge } from "@/components/ui/badge";
import type { ClassStatus } from "@/lib/api/entities/class";
import type { ClassSessionStatus } from "@/lib/api/entities/class-session";
import type { SessionAttendanceStatus } from "@/lib/api/entities/session-attendance";
import {
  ATTENDANCE_STATUS_LABELS,
  CLASS_SESSION_STATUS_LABELS,
  CLASS_STATUS_LABELS,
} from "@/lib/classes/constants";
import { cn } from "@/lib/utils";

const CLASS_STATUS_STYLES: Record<ClassStatus, string> = {
  Draft: "bg-[#4FC3F7]/15 text-[#0d6e9c] border-[#4FC3F7]/25",
  Open: "bg-[#7CB342]/15 text-[#3d5c22] border-[#7CB342]/20",
  InProgress: "bg-[#FDD835]/20 text-[#8A7200] border-[#FDD835]/35",
  Completed: "bg-[#7E57C2]/12 text-[#51308a] border-[#7E57C2]/20",
  Cancelled: "bg-[#E94B3C]/10 text-[#a82a1e] border-[#E94B3C]/15",
};

const SESSION_STATUS_STYLES: Record<ClassSessionStatus, string> = {
  Scheduled: "bg-[#4FC3F7]/15 text-[#0d6e9c] border-[#4FC3F7]/25",
  InProgress: "bg-[#FDD835]/20 text-[#8A7200] border-[#FDD835]/35",
  Completed: "bg-[#7CB342]/15 text-[#3d5c22] border-[#7CB342]/20",
  Cancelled: "bg-[#E94B3C]/10 text-[#a82a1e] border-[#E94B3C]/15",
};

const ATTENDANCE_STATUS_STYLES: Record<SessionAttendanceStatus, string> = {
  Expected: "bg-[#F5F5F0] text-[#6B6B6B] border-[#E5E5E0]",
  Present: "bg-[#7CB342]/15 text-[#3d5c22] border-[#7CB342]/20",
  Absent: "bg-[#E94B3C]/10 text-[#a82a1e] border-[#E94B3C]/15",
  Excused: "bg-[#4FC3F7]/15 text-[#0d6e9c] border-[#4FC3F7]/25",
  Late: "bg-[#FDD835]/20 text-[#8A7200] border-[#FDD835]/35",
};

function StatusPill({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export function ClassStatusBadge({ status }: { status: ClassStatus }) {
  return (
    <StatusPill
      label={CLASS_STATUS_LABELS[status]}
      className={CLASS_STATUS_STYLES[status]}
    />
  );
}

export function ClassSessionStatusBadge({
  status,
}: {
  status: ClassSessionStatus;
}) {
  return (
    <StatusPill
      label={CLASS_SESSION_STATUS_LABELS[status]}
      className={SESSION_STATUS_STYLES[status]}
    />
  );
}

export function AttendanceStatusBadge({
  status,
}: {
  status: SessionAttendanceStatus;
}) {
  return (
    <StatusPill
      label={ATTENDANCE_STATUS_LABELS[status]}
      className={ATTENDANCE_STATUS_STYLES[status]}
    />
  );
}
