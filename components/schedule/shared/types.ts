import type { ClassSessionKind, ClassSessionStatus } from "@/lib/api/entities/class-session";
import type { SessionAttendanceStatus } from "@/lib/api/entities/session-attendance";

export type ScheduleViewMode = "week" | "month";

export type ScheduleDisplaySession = {
  id: string;
  className: string;
  classCode?: string | null;
  title?: string | null;
  sessionKind: ClassSessionKind;
  startTime: string;
  endTime: string;
  location?: string | null;
  meetingUrl?: string | null;
  status: ClassSessionStatus;
  isCompleted?: boolean;
  attendanceStatus?: SessionAttendanceStatus | null;
};

export type ScheduleDayData<T extends ScheduleDisplaySession = ScheduleDisplaySession> =
  {
    date: string;
    sessions: T[];
  };
