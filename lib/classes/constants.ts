import type { ClassSessionKind } from "@/lib/api/entities/class-session";

export const CLASS_SESSION_KIND_LABELS: Record<ClassSessionKind, string> = {
  Lesson: "Buổi học",
  LiveOnline: "Trực tuyến",
  FieldTrip: "Thực địa",
  AssignmentWindow: "Bài tập",
  MentorCheckin: "Gặp mentor",
};

export const OPEN_CLASSES_QUERY = {
  page: 1,
  pageSize: 50,
  status: "Open" as const,
};

export const CLASS_SESSIONS_QUERY = {
  page: 1,
  pageSize: 200,
  sortBy: "startTime" as const,
  isDescending: false,
};
