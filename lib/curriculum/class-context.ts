import type { ClassSession } from "@/lib/api/entities/class-session";
import type { ClassStudentRoster } from "@/lib/api/entities/class-student";
import type {
  ClassMentorSummary,
  Mentor,
} from "@/lib/api/entities/mentor";

export type CurriculumClassContext = {
  classId: string;
  classCode: string;
  className: string;
  seatsTaken: number;
  maxCapacity: number;
  mentor: Mentor | null;
  roster: ClassStudentRoster[];
  sessions: ClassSession[];
};

/** Map embedded class.mentor summary into a Mentor stub for nav display. */
export function mentorFromClassSummary(
  summary: ClassMentorSummary,
): Mentor {
  return {
    id: summary.id,
    code: null,
    fullName: summary.fullName,
    email: null,
    phone: null,
    avatarUrl: summary.avatarUrl,
    role: "Mentor",
    status: "Active",
    maxConcurrentClasses: null,
    effectiveMaxConcurrentClasses: 0,
    assignedClassCount: 0,
    pendingRequestCount: 0,
    concurrentUsage: 0,
    title: summary.title,
    organization: summary.organization,
    bio: summary.bio,
    achievements: summary.achievements,
    linkedInUrl: summary.linkedInUrl,
    skills: [],
  };
}
