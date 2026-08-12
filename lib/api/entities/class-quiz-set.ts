import { z } from "zod";

export const classQuizQuestionOptionSchema = z.object({
  id: z.string().uuid(),
  optionText: z.string().nullable(),
  isCorrect: z.boolean(),
});

export const classQuizQuestionSchema = z.object({
  id: z.string().uuid(),
  sourceBankQuestionId: z.string().uuid().nullable().optional(),
  questionText: z.string().nullable(),
  questionType: z.string().nullable(),
  points: z.number(),
  difficultyLevel: z.number().int(),
  orderIndex: z.number().int(),
  options: z
    .array(classQuizQuestionOptionSchema)
    .nullish()
    .transform((value) => value ?? []),
});

/** `ClassQuizQuestionSetResponseDto` — class-scoped pulled quiz copy. */
export const classQuizQuestionSetSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  pulledAt: z.string(),
  isLocked: z.boolean(),
  questions: z
    .array(classQuizQuestionSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type ClassQuizQuestionOption = z.infer<typeof classQuizQuestionOptionSchema>;
export type ClassQuizQuestion = z.infer<typeof classQuizQuestionSchema>;
export type ClassQuizQuestionSet = z.infer<typeof classQuizQuestionSetSchema>;

