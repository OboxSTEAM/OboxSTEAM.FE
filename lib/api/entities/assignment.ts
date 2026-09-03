import { z } from "zod";

export const assignmentTypeSchema = z.enum(["Quiz", "Retrospective", "FileUpload"]);

/** BE often omits unset dates (undefined) rather than sending null. */
const optionalNullableDateSchema = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

/**
 * Per-student status on enrollment curriculum assignment nodes.
 * Mirrors the backend `ResolveAssignmentStatus` output (CurriculumStatusHelper):
 * locked · available · submitted · completed.
 */
export const enrollmentAssignmentStatusSchema = z.enum([
  "available",
  "locked",
  "submitted",
  "completed",
]);

export const enrollmentCurriculumAssignmentSchema = z.object({
  assignmentId: z.string(),
  assignmentCode: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  title: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  assignmentType: assignmentTypeSchema,
  maxPoints: z.number(),
  passScore: z.number(),
  isRequiredForModulePass: z.boolean(),
  dueDate: optionalNullableDateSchema,
  availableFrom: optionalNullableDateSchema,
  /**
   * Latest quiz/file/retro submission for this student (when BE includes it on
   * `EnrollmentCurriculumAssignmentDto`). Used to hydrate results via
   * `GET /api/submissions/{submissionId}/quiz/result`.
   */
  latestSubmissionId: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  status: enrollmentAssignmentStatusSchema
    .nullish()
    .transform((value) => value ?? "locked"),
});

export type AssignmentType = z.infer<typeof assignmentTypeSchema>;
export type EnrollmentAssignmentStatus = z.infer<typeof enrollmentAssignmentStatusSchema>;
export type EnrollmentCurriculumAssignment = z.infer<
  typeof enrollmentCurriculumAssignmentSchema
>;

/**
 * Full assignment detail from `GET /api/assignments/{assignmentId}`.
 * OpenAPI `AssignmentResponseDto` currently omits schedule fields; tolerate
 * omission while still accepting legacy null/string payloads.
 */
export const assignmentDetailSchema = z.object({
  id: z.string(),
  code: z.string().nullable(),
  moduleId: z.string(),
  courseId: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  assignmentType: assignmentTypeSchema,
  maxPoints: z.number(),
  passScore: z.number(),
  isRequiredForModulePass: z.boolean(),
  dueDate: optionalNullableDateSchema,
  availableFrom: optionalNullableDateSchema,
  availableUntil: optionalNullableDateSchema,
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
  updatedAt: z.string().nullable(),
});

/** Row in `GET /api/assignments` — carries deep-link context (`AssignmentListItemDto`). */
export const assignmentListItemSchema = z
  .object({
    id: z.string(),
    code: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    assignmentType: assignmentTypeSchema,
    moduleId: z.string(),
    courseId: z.string().nullable().optional(),
    maxPoints: z.number().nullable().optional(),
    passScore: z.number().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    questionBankId: z.string().nullable().optional(),
    questionCount: z.number().nullable().optional(),
    moduleName: z.string().nullable().optional(),
    programId: z.string(),
    programName: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .passthrough();

export type AssignmentDetail = z.infer<typeof assignmentDetailSchema>;
export type AssignmentListItem = z.infer<typeof assignmentListItemSchema>;
