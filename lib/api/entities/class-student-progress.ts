import { z } from "zod";

import { activityTypeSchema } from "@/lib/api/entities/activity";
import { activityProgressStatusSchema } from "@/lib/api/entities/activity-progress-record";
import { assignmentTypeSchema } from "@/lib/api/entities/assignment";
import { assignmentSubmissionStatusSchema } from "@/lib/api/entities/assignment-submission";
import {
  classCurriculumAssignmentNavStatusSchema,
} from "@/lib/api/entities/class-curriculum-progress";
import { classSessionStatusSchema } from "@/lib/api/entities/class-session";
import { sessionAttendanceStatusSchema } from "@/lib/api/entities/session-attendance";

const optionalNullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

const ASSIGNMENT_NAV_STATUSES = new Set<string>([
  "available",
  "submitted",
  "completed",
]);

function coerceAssignmentNavStatus(value: unknown) {
  if (typeof value === "string" && ASSIGNMENT_NAV_STATUSES.has(value)) {
    return value as z.infer<typeof classCurriculumAssignmentNavStatusSchema>;
  }
  return "available" as const;
}

export const activityCompletionSourceSchema = z.enum([
  "Manual",
  "Video",
  "Reading",
  "Mentor",
]);

/** Row in `GET /api/classes/{classId}/activities/{activityId}/student-progress`. */
export const classActivityStudentProgressItemSchema = z.object({
  studentId: z.string().uuid(),
  studentCode: optionalNullableString,
  studentName: optionalNullableString,
  email: optionalNullableString,
  avatarUrl: optionalNullableString,
  activityStatus: activityProgressStatusSchema,
  completedAt: optionalNullableString,
  lastAccessedAt: optionalNullableString,
  completionSource: activityCompletionSourceSchema
    .nullish()
    .transform((value) => value ?? null),
  attendanceStatus: sessionAttendanceStatusSchema
    .nullish()
    .transform((value) => value ?? null),
  checkedInAt: optionalNullableString,
  participationMinutes: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? null),
});

/** Matches `ClassActivityStudentProgressDto`. */
export const classActivityStudentProgressSchema = z.object({
  classId: z.string().uuid(),
  activityId: z.string().uuid(),
  activityType: activityTypeSchema,
  classSessionId: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  sessionStatus: classSessionStatusSchema
    .nullish()
    .transform((value) => value ?? null),
  totalStudents: z.number().int(),
  completedCount: z.number().int(),
  inProgressCount: z.number().int(),
  notStartedCount: z.number().int(),
  students: z.preprocess(
    (val) => val ?? [],
    z.array(classActivityStudentProgressItemSchema),
  ),
});

/** Row in `GET /api/classes/{classId}/assignments/{assignmentId}/student-progress`. */
export const classAssignmentStudentProgressItemSchema = z.object({
  studentId: z.string().uuid(),
  studentCode: optionalNullableString,
  studentName: optionalNullableString,
  email: optionalNullableString,
  avatarUrl: optionalNullableString,
  submissionId: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  attemptNumber: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? null),
  submissionStatus: assignmentSubmissionStatusSchema
    .nullish()
    .transform((value) => value ?? null),
  assignedGrade: z
    .number()
    .nullish()
    .transform((value) => value ?? null),
  passed: z
    .boolean()
    .nullish()
    .transform((value) => value ?? null),
  submittedAt: optionalNullableString,
  gradedAt: optionalNullableString,
});

/** Matches `ClassAssignmentStudentProgressDto`. */
export const classAssignmentStudentProgressSchema = z.object({
  classId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  assignmentType: assignmentTypeSchema,
  status: z.preprocess(
    coerceAssignmentNavStatus,
    classCurriculumAssignmentNavStatusSchema,
  ),
  totalStudents: z.number().int(),
  submittedCount: z.number().int(),
  gradedCount: z.number().int(),
  notStartedCount: z.number().int(),
  averageScore: z
    .number()
    .nullish()
    .transform((value) => value ?? null),
  students: z.preprocess(
    (val) => val ?? [],
    z.array(classAssignmentStudentProgressItemSchema),
  ),
});

export type ActivityCompletionSource = z.infer<
  typeof activityCompletionSourceSchema
>;
export type ClassActivityStudentProgressItem = z.infer<
  typeof classActivityStudentProgressItemSchema
>;
export type ClassActivityStudentProgress = z.infer<
  typeof classActivityStudentProgressSchema
>;
export type ClassAssignmentStudentProgressItem = z.infer<
  typeof classAssignmentStudentProgressItemSchema
>;
export type ClassAssignmentStudentProgress = z.infer<
  typeof classAssignmentStudentProgressSchema
>;
