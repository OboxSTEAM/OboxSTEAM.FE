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
  Draft:
    "bg-[#4FC3F7]/15 text-[#0d6e9c] dark:bg-[#4FC3F7]/20 dark:text-[#7dd3fc] border-[#4FC3F7]/25 dark:border-[#4FC3F7]/40",
  ReadyForMentor:
    "bg-[#26A69A]/15 text-[#00695c] dark:bg-[#26A69A]/20 dark:text-[#5eead4] border-[#26A69A]/25 dark:border-[#26A69A]/40",
  Open: "bg-[#7CB342]/15 text-[#3d5c22] dark:bg-[#7CB342]/20 dark:text-[#b8e086] border-[#7CB342]/20 dark:border-[#7CB342]/35",
  InProgress:
    "bg-[#FDD835]/20 text-[#8A7200] dark:bg-[#FDD835]/20 dark:text-[#fde047] border-[#FDD835]/35 dark:border-[#FDD835]/45",
  Completed:
    "bg-[#7E57C2]/12 text-[#51308a] dark:bg-[#7E57C2]/20 dark:text-[#c4b5fd] border-[#7E57C2]/20 dark:border-[#7E57C2]/35",
  Cancelled:
    "bg-primary/10 text-[#a82a1e] dark:bg-primary/20 dark:text-[#fca5a5] border-primary/15 dark:border-primary/30",
};

const SESSION_STATUS_STYLES: Record<ClassSessionStatus, string> = {
  Scheduled:
    "bg-[#4FC3F7]/15 text-[#0d6e9c] dark:bg-[#4FC3F7]/20 dark:text-[#7dd3fc] border-[#4FC3F7]/25 dark:border-[#4FC3F7]/40",
  InProgress:
    "bg-[#FDD835]/20 text-[#8A7200] dark:bg-[#FDD835]/20 dark:text-[#fde047] border-[#FDD835]/35 dark:border-[#FDD835]/45",
  Completed:
    "bg-[#7CB342]/15 text-[#3d5c22] dark:bg-[#7CB342]/20 dark:text-[#b8e086] border-[#7CB342]/20 dark:border-[#7CB342]/35",
  Cancelled:
    "bg-primary/10 text-[#a82a1e] dark:bg-primary/20 dark:text-[#fca5a5] border-primary/15 dark:border-primary/30",
};

const ATTENDANCE_STATUS_STYLES: Record<SessionAttendanceStatus, string> = {
  Expected: "bg-muted text-muted-foreground border-border",
  Present:
    "bg-[#7CB342]/15 text-[#3d5c22] dark:bg-[#7CB342]/20 dark:text-[#b8e086] border-[#7CB342]/20 dark:border-[#7CB342]/35",
  Absent:
    "bg-primary/10 text-[#a82a1e] dark:bg-primary/20 dark:text-[#fca5a5] border-primary/15 dark:border-primary/30",
  Excused:
    "bg-[#4FC3F7]/15 text-[#0d6e9c] dark:bg-[#4FC3F7]/20 dark:text-[#7dd3fc] border-[#4FC3F7]/25 dark:border-[#4FC3F7]/40",
  Late: "bg-[#FDD835]/20 text-[#8A7200] dark:bg-[#FDD835]/20 dark:text-[#fde047] border-[#FDD835]/35 dark:border-[#FDD835]/45",
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
