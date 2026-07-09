import type { ClassSession } from "@/lib/api/entities/class-session";
import type { ClassStudentRoster } from "@/lib/api/entities/class-student";

export type CurriculumClassContext = {
  classId: string;
  classCode: string;
  className: string;
  seatsTaken: number;
  maxCapacity: number;
  roster: ClassStudentRoster[];
  sessions: ClassSession[];
};
