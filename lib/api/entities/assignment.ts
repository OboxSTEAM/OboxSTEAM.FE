import { z } from "zod";

export const assignmentTypeSchema = z.enum(["Quiz", "Retrospective", "FileUpload"]);

/** Per-student status on enrollment curriculum assignment nodes. */
export const enrollmentAssignmentStatusSchema = z.enum([
  "available",
  "locked",
  "submitted",
  "graded",
  "passed",
  "failed",
]);

export const enrollmentCurriculumAssignmentSchema = z.object({
  assignmentId: z.string(),
  assignmentCode: z.string(),
  title: z.string(),
  assignmentType: assignmentTypeSchema,
  maxPoints: z.number(),
  passScore: z.number(),
  isRequiredForModulePass: z.boolean(),
  dueDate: z.string(),
  status: enrollmentAssignmentStatusSchema,
});

export type AssignmentType = z.infer<typeof assignmentTypeSchema>;
export type EnrollmentAssignmentStatus = z.infer<typeof enrollmentAssignmentStatusSchema>;
export type EnrollmentCurriculumAssignment = z.infer<
  typeof enrollmentCurriculumAssignmentSchema
>;

/** Full assignment detail from `GET /api/assignments/{assignmentId}`. */
export const assignmentDetailSchema = z.object({
  id: z.string(),
  code: z.string(),
  moduleId: z.string(),
  courseId: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  assignmentType: assignmentTypeSchema,
  maxPoints: z.number(),
  passScore: z.number(),
  isRequiredForModulePass: z.boolean(),
  dueDate: z.string().nullable(),
  availableFrom: z.string().nullable(),
  availableUntil: z.string().nullable(),
  allowShuffle: z.boolean(),
  questionBankId: z.string().nullable(),
  questionCount: z.number().nullable(),
  shuffleOptions: z.boolean(),
  easyPercent: z.number(),
  mediumPercent: z.number(),
  hardPercent: z.number(),
  timeLimitMinutes: z.number().nullable(),
  maxAttempts: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AssignmentDetail = z.infer<typeof assignmentDetailSchema>;
