import { z } from "zod";

import { sessionAttendanceStatusSchema } from "@/lib/api/entities/session-attendance";

/**
 * Session purpose only. Delivery mode (online/offline) comes from the linked
 * activity's `activityType`, so it is intentionally not part of this enum.
 * Legacy `LiveOnline` rows are coerced to `Lesson` for backward compatibility.
 */
export const classSessionKindSchema = z.preprocess(
  (value) => (value === "LiveOnline" ? "Lesson" : value),
  z.enum(["Lesson", "FieldTrip", "AssignmentWindow", "MentorCheckIn"]),
);

export const classSessionStatusSchema = z.enum([
  "Scheduled",
  "InProgress",
  "Completed",
  "Cancelled",
]);

export const classSessionSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  moduleId: z.string().uuid(),
  activityId: z.string().uuid().nullable(),
  assignmentId: z.string().uuid().nullable(),
  sessionKind: classSessionKindSchema,
  title: z.string(),
  description: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().nullable(),
  maxCapacity: z.number().int().nullable(),
  requiresAttendance: z.boolean(),
  status: classSessionStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

/** Attendance roster row returned by `GET /api/classes/{classId}/sessions/with-students/{sessionId}`. */
export const classSessionStudentSchema = z.object({
  classSessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  studentCode: z.string().nullable(),
  studentName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  moduleEnrollmentId: z.string().uuid(),
  attendanceStatus: sessionAttendanceStatusSchema,
  checkedInAt: z.string().nullable(),
  recordedBy: z.string().uuid().nullable(),
});

export const classSessionWithStudentsSchema = classSessionSchema.extend({
  students: z
    .array(classSessionStudentSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type ClassSessionKind = z.infer<typeof classSessionKindSchema>;
export type ClassSessionStatus = z.infer<typeof classSessionStatusSchema>;
export type ClassSession = z.infer<typeof classSessionSchema>;
export type ClassSessionStudent = z.infer<typeof classSessionStudentSchema>;
export type ClassSessionWithStudents = z.infer<typeof classSessionWithStudentsSchema>;
