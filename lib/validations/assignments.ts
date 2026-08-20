import { z } from "zod";

/** Path param for `GET /api/assignments/{assignmentId}` and quiz start. */
export const assignmentIdParamSchema = z.object({
  assignmentId: z.string().uuid("ID bài tập không hợp lệ."),
});

/* ─── Manager CRUD (create / update) ───────────────────────────────────────── */

export const assignmentTypeInputSchema = z.enum([
  "Retrospective",
  "FileUpload",
  "Quiz",
]);

export type AssignmentTypeInput = z.infer<typeof assignmentTypeInputSchema>;

/** Shared field shape for `Create`/`UpdateAssignmentRequestDto`. Dates use `dd/MM/yyyy HH:mm:ss`. */
const assignmentFieldsSchema = z.object({
  code: z.string().nullable().optional(),
  moduleId: z.string().uuid("ID module không hợp lệ."),
  courseId: z.string().uuid("ID khóa học không hợp lệ.").nullable().optional(),
  title: z.string().min(1, "Tiêu đề bài tập là bắt buộc."),
  description: z.string().nullable().optional(),
  assignmentType: assignmentTypeInputSchema,
  maxPoints: z.number().int().min(0, "Điểm tối đa không được âm."),
  passScore: z.number().min(0, "Điểm đạt không được âm."),
  isRequiredForModulePass: z.boolean().default(false),
  dueDate: z.string().nullable().optional(),
  availableFrom: z.string().nullable().optional(),
  availableUntil: z.string().nullable().optional(),
  allowShuffle: z.boolean().default(false),
  questionBankId: z.string().uuid("ID ngân hàng câu hỏi không hợp lệ.").nullable().optional(),
  questionCount: z.number().int().min(0).nullable().optional(),
  shuffleOptions: z.boolean().default(false),
  easyPercent: z.number().int().min(0).max(100).default(0),
  mediumPercent: z.number().int().min(0).max(100).default(0),
  hardPercent: z.number().int().min(0).max(100).default(0),
  timeLimitMinutes: z.number().int().min(1).nullable().optional(),
  maxAttempts: z.number().int().min(1, "Số lần làm tối thiểu là 1."),
});

/** Quiz assignments must have difficulty percentages summing to 100. */
function quizPercentValid(v: {
  assignmentType: AssignmentTypeInput;
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
}): boolean {
  if (v.assignmentType !== "Quiz") return true;
  return v.easyPercent + v.mediumPercent + v.hardPercent === 100;
}

const QUIZ_PERCENT_REFINE = {
  message: "Tổng tỉ lệ độ khó (dễ + trung bình + khó) phải bằng 100%.",
  path: ["easyPercent"] as PropertyKey[],
};

export const createAssignmentSchema = assignmentFieldsSchema.refine(
  quizPercentValid,
  QUIZ_PERCENT_REFINE,
);

export const updateAssignmentSchema = assignmentFieldsSchema
  .partial()
  .extend({ moduleId: z.string().uuid("ID module không hợp lệ.").optional() });

/**
 * Manager assignment create/edit form.
 * `moduleId` is injected from the selected tree node, not a form field.
 * `courseId` uses `"none"` when the assignment is not attached to a course.
 */
export const assignmentFormSchema = assignmentFieldsSchema
  .omit({ moduleId: true })
  .extend({
    code: z.string(),
    courseId: z.string(),
    description: z.string(),
    dueDate: z.string(),
    availableFrom: z.string(),
    availableUntil: z.string(),
    questionBankId: z.string(),
    questionCount: z.number().int().min(0).nullable().optional(),
    timeLimitMinutes: z.number().int().min(1).nullable().optional(),
    isRequiredForModulePass: z.boolean(),
    allowShuffle: z.boolean(),
    shuffleOptions: z.boolean(),
    easyPercent: z.number().int().min(0).max(100),
    mediumPercent: z.number().int().min(0).max(100),
    hardPercent: z.number().int().min(0).max(100),
  })
  .refine(quizPercentValid, QUIZ_PERCENT_REFINE);

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

/** Query params for `GET /api/assignments`. */
export const assignmentListQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  moduleId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  assignmentType: assignmentTypeInputSchema.optional(),
});

export type AssignmentListQuery = z.infer<typeof assignmentListQuerySchema>;

/** Path param for submission-scoped quiz routes. */
export const submissionIdParamSchema = z.object({
  submissionId: z.string().uuid("ID bài nộp không hợp lệ."),
});

/** Query for `GET /api/assignments/{assignmentId}/submissions`. */
export const assignmentSubmissionsQuerySchema = z.object({
  classId: z.string().uuid("ID lớp không hợp lệ."),
});

/** Body for `POST /api/assignment-submissions/{submissionId}/grade`. */
export const gradeAssignmentSubmissionSchema = z.object({
  assignedGrade: z.number().min(0, "Điểm không được âm."),
  mentorFeedback: z.string().max(4000).nullable().optional(),
  returnForRevision: z.boolean().optional(),
});

export type AssignmentSubmissionsQuery = z.infer<
  typeof assignmentSubmissionsQuerySchema
>;
export type GradeAssignmentSubmissionInput = z.infer<
  typeof gradeAssignmentSubmissionSchema
>;

export const quizAnswerInputSchema = z.object({
  questionId: z.string().uuid("ID câu hỏi không hợp lệ."),
  selectedOptionIds: z
    .array(z.string().uuid("ID lựa chọn không hợp lệ."))
    .min(1, "Chọn ít nhất một đáp án."),
});

/** Body for `PUT /api/submissions/{submissionId}/quiz/answers`. */
export const saveQuizAnswersSchema = z.object({
  answers: z.array(quizAnswerInputSchema).min(1, "Cần ít nhất một câu trả lời."),
});

/**
 * Body for `POST /api/submissions/{submissionId}/quiz/submit`.
 * Empty array is allowed when all drafts are already saved.
 */
export const submitQuizSchema = z.object({
  answers: z.array(quizAnswerInputSchema),
});

export type AssignmentIdParam = z.infer<typeof assignmentIdParamSchema>;
export type SubmissionIdParam = z.infer<typeof submissionIdParamSchema>;
export type QuizAnswerInput = z.infer<typeof quizAnswerInputSchema>;
export type SaveQuizAnswersInput = z.infer<typeof saveQuizAnswersSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;

/** Body for `PUT /api/submissions/{submissionId}/retrospective/draft`. */
export const saveRetrospectiveDraftSchema = z.object({
  contentText: z.string().nullable().optional(),
});

/** Body for `POST /api/submissions/{submissionId}/retrospective/submit`. */
export const submitRetrospectiveSchema = z.object({
  contentText: z.string().nullable().optional(),
});

export type SaveRetrospectiveDraftInput = z.infer<typeof saveRetrospectiveDraftSchema>;
export type SubmitRetrospectiveInput = z.infer<typeof submitRetrospectiveSchema>;
