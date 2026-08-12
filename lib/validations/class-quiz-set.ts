import { z } from "zod";

export const classQuizSetParamsSchema = z.object({
  assignmentId: z.string().uuid("ID bài tập không hợp lệ."),
  classId: z.string().uuid("ID lớp không hợp lệ."),
});

export const classQuizQuestionParamsSchema = classQuizSetParamsSchema.extend({
  questionId: z.string().uuid("ID câu hỏi không hợp lệ."),
});

export const updateClassQuizQuestionOptionSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  optionText: z.string().nullable().optional(),
  isCorrect: z.boolean().nullable().optional(),
});

/** Body for `PUT .../quiz-set/questions/{questionId}`. */
export const updateClassQuizQuestionSchema = z.object({
  questionText: z.string().nullable().optional(),
  questionType: z.string().nullable().optional(),
  points: z.number().nullable().optional(),
  difficultyLevel: z.number().int().nullable().optional(),
  orderIndex: z.number().int().nullable().optional(),
  options: z.array(updateClassQuizQuestionOptionSchema).nullable().optional(),
});

export type ClassQuizSetParams = z.infer<typeof classQuizSetParamsSchema>;
export type ClassQuizQuestionParams = z.infer<typeof classQuizQuestionParamsSchema>;
export type UpdateClassQuizQuestionInput = z.infer<typeof updateClassQuizQuestionSchema>;
