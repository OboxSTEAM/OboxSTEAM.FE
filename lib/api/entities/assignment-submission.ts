import { z } from "zod";

import { assignmentTypeSchema } from "@/lib/api/entities/assignment";

/** Shared submission lifecycle for assignment / file / quiz / retrospective rows. */
export const assignmentSubmissionStatusSchema = z.enum([
  "Pending",
  "TurnedIn",
  "Graded",
  "ReturnedForRevision",
]);

/** Row from `GET /api/assignments/{assignmentId}/submissions`. */
export const assignmentSubmissionListItemSchema = z.object({
  submissionId: z.string().uuid(),
  studentId: z.string().uuid(),
  studentName: z.string().nullable(),
  attemptNumber: z.number().int(),
  status: assignmentSubmissionStatusSchema,
  assignedGrade: z.number().nullable(),
  passed: z.boolean().nullable(),
  submittedAt: z.string().nullable(),
  gradedAt: z.string().nullable(),
});

/** Detail returned by grade / get submission endpoints. */
export const assignmentSubmissionDetailSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable(),
  assignmentId: z.string().uuid(),
  assignmentType: assignmentTypeSchema,
  moduleEnrollmentId: z.string().uuid().nullable(),
  studentId: z.string().uuid(),
  attemptNumber: z.number().int(),
  status: assignmentSubmissionStatusSchema,
  contentText: z.string().nullable(),
  fileUrl: z.string().nullable(),
  assignedGrade: z.number().nullable(),
  passScore: z.number(),
  maxPoints: z.number().int(),
  passed: z.boolean().nullable(),
  mentorFeedback: z.string().nullable(),
  verifiedBy: z.string().uuid().nullable(),
  submittedAt: z.string().nullable(),
  gradedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type AssignmentSubmissionStatus = z.infer<
  typeof assignmentSubmissionStatusSchema
>;
export type AssignmentSubmissionListItem = z.infer<
  typeof assignmentSubmissionListItemSchema
>;
export type AssignmentSubmissionDetail = z.infer<
  typeof assignmentSubmissionDetailSchema
>;
