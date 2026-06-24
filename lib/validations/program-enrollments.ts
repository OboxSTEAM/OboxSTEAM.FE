import { z } from "zod";

export const programEnrollmentSortBySchema = z.enum([
  "enrolledAt",
  "progressPercent",
  "status",
  "createdAt",
]);

const programEnrollmentsListQueryFields = {
  sortBy: programEnrollmentSortBySchema.optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
} as const;

/** Query params for `GET /api/program-enrollments/me`. */
export const myProgramEnrollmentsQuerySchema = z.object(programEnrollmentsListQueryFields);

/** Query params for `GET /api/program-enrollments/student/{studentId}`. */
export const studentProgramEnrollmentsQuerySchema = z.object(
  programEnrollmentsListQueryFields,
);

/** Path param for enrollment-scoped routes. */
export const enrollmentIdParamSchema = z.object({
  enrollmentId: z.string().uuid("ID ghi danh không hợp lệ."),
});

/** Path params for `.../activities/{activityId}` enrollment routes. */
export const enrollmentActivityParamsSchema = z.object({
  enrollmentId: z.string().uuid("ID ghi danh không hợp lệ."),
  activityId: z.string().uuid("ID hoạt động không hợp lệ."),
});

/** Path param for `GET /api/program-enrollments/student/{studentId}`. */
export const studentIdParamSchema = z.object({
  studentId: z.string().uuid("ID học sinh không hợp lệ."),
});

export const videoResumeStateSchema = z.object({
  kind: z.literal("video"),
  positionSeconds: z
    .number()
    .min(0, "Vị trí video không hợp lệ.")
    .transform((value) => Math.floor(value))
    .pipe(z.number().int().min(0)),
  durationSeconds: z
    .number()
    .min(0, "Thời lượng video không hợp lệ.")
    .transform((value) => Math.round(value))
    .pipe(z.number().int().min(0))
    .optional(),
});

export const pdfResumeStateSchema = z.object({
  kind: z.literal("pdf"),
  page: z.number().int().min(1, "Số trang phải từ 1 trở lên."),
  scrollRatio: z
    .number()
    .min(0, "Tỷ lệ cuộn phải từ 0 đến 1.")
    .max(1, "Tỷ lệ cuộn phải từ 0 đến 1.")
    .optional(),
});

export const docResumeStateSchema = z.object({
  kind: z.literal("doc"),
  scrollRatio: z
    .number()
    .min(0, "Tỷ lệ cuộn phải từ 0 đến 1.")
    .max(1, "Tỷ lệ cuộn phải từ 0 đến 1."),
});

export const activityResumeStateInputSchema = z.discriminatedUnion("kind", [
  videoResumeStateSchema,
  pdfResumeStateSchema,
  docResumeStateSchema,
]);

/** Body for `PATCH .../activities/{activityId}/checkpoint`. */
export const saveActivityCheckpointSchema = z.object({
  resumeState: activityResumeStateInputSchema,
});

export const completeActivitySourceSchema = z.enum(["video", "reading", "manual"]);

/** Body for `POST .../activities/{activityId}/complete`. */
export const completeActivitySchema = z.object({
  source: completeActivitySourceSchema,
});

export type EnrollmentIdParam = z.infer<typeof enrollmentIdParamSchema>;
export type EnrollmentActivityParams = z.infer<typeof enrollmentActivityParamsSchema>;
export type StudentIdParam = z.infer<typeof studentIdParamSchema>;
export type StudentProgramEnrollmentsQuery = z.infer<
  typeof studentProgramEnrollmentsQuerySchema
>;
export type ActivityResumeStateInput = z.infer<typeof activityResumeStateInputSchema>;
export type SaveActivityCheckpointInput = z.infer<typeof saveActivityCheckpointSchema>;
export type CompleteActivitySource = z.infer<typeof completeActivitySourceSchema>;
export type CompleteActivityInput = z.infer<typeof completeActivitySchema>;
