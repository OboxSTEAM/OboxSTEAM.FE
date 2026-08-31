import { Badge } from "@/components/ui/badge";
import {
  ATTENDANCE_STATUS_LABELS,
  CLASS_SESSION_STATUS_LABELS,
} from "@/lib/classes/constants";
import type { ClassSessionKind, ClassSessionStatus } from "@/lib/api/entities/class-session";
import type { SessionAttendanceStatus } from "@/lib/api/entities/session-attendance";
import { cn } from "@/lib/utils";

const SESSION_KIND_LABELS: Record<ClassSessionKind, string> = {
  LiveOnline: "Buổi học",
  Offline: "Ngoại khóa",
  AssignmentWindow: "Kiểm tra",
};

export function SessionKindBadge({ kind }: { kind: ClassSessionKind }) {
  return (
    <Badge
      variant="secondary"
      className="rounded-md px-1.5 py-0 text-[10px] font-semibold"
    >
      {SESSION_KIND_LABELS[kind]}
    </Badge>
  );
}

export function StatusBadge({
  status,
  isCompleted,
}: {
  status: ClassSessionStatus;
  isCompleted?: boolean;
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
        status === "Cancelled" && "border-border text-muted-foreground line-through",
      )}
    >
      {CLASS_SESSION_STATUS_LABELS[status]}
    </Badge>
  );
}

export function AttendanceChip({
  status,
}: {
  status: SessionAttendanceStatus;
}) {
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
