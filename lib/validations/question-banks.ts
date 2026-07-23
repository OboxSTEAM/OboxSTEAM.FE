import { z } from "zod";

/** Path param for `/api/question-banks/{questionBankId}`. */
export const questionBankIdParamSchema = z.object({
  questionBankId: z.string().uuid("ID ngân hàng câu hỏi không hợp lệ."),
});

/** Path param for a single bank question. */
export const bankQuestionParamSchema = z.object({
  questionBankId: z.string().uuid("ID ngân hàng câu hỏi không hợp lệ."),
  questionId: z.string().uuid("ID câu hỏi không hợp lệ."),
});

/** Body for `POST /api/question-banks`. */
export const createQuestionBankSchema = z.object({
  courseId: z.string().uuid("ID khóa học không hợp lệ."),
  name: z.string().min(1, "Tên ngân hàng câu hỏi là bắt buộc."),
  description: z.string().nullable().optional(),
});

/** Query params for `GET /api/question-banks`. */
export const questionBankListQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  courseId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  moduleId: z.string().uuid().optional(),
});

export type QuestionBankIdParam = z.infer<typeof questionBankIdParamSchema>;
export type BankQuestionParam = z.infer<typeof bankQuestionParamSchema>;
export type CreateQuestionBankInput = z.infer<typeof createQuestionBankSchema>;
export type QuestionBankListQuery = z.infer<typeof questionBankListQuerySchema>;
