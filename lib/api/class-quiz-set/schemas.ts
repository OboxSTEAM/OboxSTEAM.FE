import { z } from "zod";

import {
  classQuizQuestionSchema,
  classQuizQuestionSetSchema,
} from "@/lib/api/entities/class-quiz-set";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const classQuizQuestionSetValueSchema = createApiValueSchema(
  classQuizQuestionSetSchema,
);

export const classQuizQuestionValueSchema = createApiValueSchema(classQuizQuestionSchema);

export const getClassQuizSetResponseSchema = createApiResponseSchema(
  classQuizQuestionSetValueSchema,
);

export const pullClassQuizSetResponseSchema = createApiResponseSchema(
  classQuizQuestionSetValueSchema,
);

export const updateClassQuizQuestionResponseSchema = createApiResponseSchema(
  classQuizQuestionValueSchema,
);

export type GetClassQuizSetResponse = z.infer<typeof getClassQuizSetResponseSchema>;
export type GetClassQuizSetResult = GetClassQuizSetResponse["value"];

export type PullClassQuizSetResponse = z.infer<typeof pullClassQuizSetResponseSchema>;
export type PullClassQuizSetResult = PullClassQuizSetResponse["value"];

export type UpdateClassQuizQuestionResponse = z.infer<
  typeof updateClassQuizQuestionResponseSchema
>;
export type UpdateClassQuizQuestionResult = UpdateClassQuizQuestionResponse["value"];
