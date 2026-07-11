import type { ClassSession } from "@/lib/api/entities/class-session";
import type { ClassStudentRoster } from "@/lib/api/entities/class-student";
import type { UserProfile } from "@/lib/api/entities/user";

export type CurriculumClassContext = {
  classId: string;
  classCode: string;
  className: string;
  seatsTaken: number;
  maxCapacity: number;
  mentor: UserProfile | null;
  roster: ClassStudentRoster[];
  sessions: ClassSession[];
};
