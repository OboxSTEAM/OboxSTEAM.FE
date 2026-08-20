import { z } from "zod";

import { sessionAttendanceStatusSchema } from "@/lib/api/entities/session-attendance";

/**
 * Session purpose only. Delivery mode (online/offline) comes from the linked
 * activity's `activityType`, so it is intentionally not part of this enum.
 * Legacy `LiveOnline` / `MentorCheckIn` rows are coerced to `Lesson`.
 */
export const classSessionKindSchema = z.preprocess(
  (value) =>
    value === "LiveOnline" || value === "MentorCheckIn" ? "Lesson" : value,
  z.enum(["Lesson", "FieldTrip", "AssignmentWindow"]),
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
  title: z.string().nullable(),
  description: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().nullable(),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .nullish()
    .transform((value) => value ?? null),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .nullable()
    .nullish()
    .transform((value) => value ?? null),
  meetingUrl: z
    .string()
    .nullable()
    .nullish()
    .transform((value) => value ?? null),
  requiresAttendance: z.boolean(),
  requiresMentorCheckIn: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
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
