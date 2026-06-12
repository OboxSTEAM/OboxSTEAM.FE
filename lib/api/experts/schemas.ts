import { z } from "zod";

import { expertSchema } from "@/lib/api/entities/expert";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const expertDetailValueSchema = createApiValueSchema(expertSchema);

export const getExpertByIdResponseSchema = createApiResponseSchema(
  expertDetailValueSchema,
);

export type GetExpertByIdResponse = z.infer<typeof getExpertByIdResponseSchema>;
export type GetExpertByIdResult = GetExpertByIdResponse["value"];
