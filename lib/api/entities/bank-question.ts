import { z } from "zod";

/** Option on a bank question (`BankQuestionOptionResponseDto`). */
export const bankQuestionOptionSchema = z
  .object({
    id: z.string(),
    bankQuestionId: z.string().nullable().optional(),
    optionText: z.string().nullable().optional(),
    isCorrect: z.boolean().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .passthrough();

/** Question inside a bank (`BankQuestionResponseDto`). */
export const bankQuestionSchema = z
  .object({
    id: z.string(),
    questionBankId: z.string(),
    questionText: z.string().nullable().optional(),
    questionType: z.string().nullable().optional(),
    points: z.number().nullable().optional(),
    difficultyLevel: z.number().nullable().optional(),
    orderIndex: z.number().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
    options: z.array(bankQuestionOptionSchema).nullable().optional(),
  })
  .passthrough();

export type BankQuestionOption = z.infer<typeof bankQuestionOptionSchema>;
export type BankQuestion = z.infer<typeof bankQuestionSchema>;
