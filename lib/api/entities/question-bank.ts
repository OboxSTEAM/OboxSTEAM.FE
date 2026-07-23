import { z } from "zod";

/** Question bank (`QuestionBankResponseDto`). `questionCount` is best-effort (may be absent). */
export const questionBankSchema = z
  .object({
    id: z.string(),
    courseId: z.string(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    questionCount: z.number().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .passthrough();

/** Row in `GET /api/question-banks` — carries deep-link context (`QuestionBankListItemDto`). */
export const questionBankListItemSchema = z
  .object({
    id: z.string(),
    courseId: z.string(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    questionCount: z.number().nullable().optional(),
    courseName: z.string().nullable().optional(),
    moduleId: z.string(),
    moduleName: z.string().nullable().optional(),
    programId: z.string(),
    programName: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .passthrough();

export type QuestionBank = z.infer<typeof questionBankSchema>;
export type QuestionBankListItem = z.infer<typeof questionBankListItemSchema>;
