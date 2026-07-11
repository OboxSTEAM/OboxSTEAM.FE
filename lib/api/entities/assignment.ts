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
