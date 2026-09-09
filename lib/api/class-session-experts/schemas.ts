import { z } from "zod";

import { classSessionExpertSchema } from "@/lib/api/entities/class-session-expert";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedClassSessionExpertsSchema = createPaginatedSchema(
  classSessionExpertSchema,
);

export const classSessionExpertsListValueSchema = createApiValueSchema(
  paginatedClassSessionExpertsSchema,
);
export const classSessionExpertValueSchema = createApiValueSchema(
  classSessionExpertSchema,
);
export const deleteClassSessionExpertValueSchema = createApiValueSchema(
  z.boolean(),
);

export const getClassSessionExpertsResponseSchema = createApiResponseSchema(
  classSessionExpertsListValueSchema,
);
export const classSessionExpertResponseSchema = createApiResponseSchema(
  classSessionExpertValueSchema,
);
export const withdrawClassSessionExpertResponseSchema = createApiResponseSchema(
  deleteClassSessionExpertValueSchema,
);

export type GetClassSessionExpertsResponse = z.infer<
  typeof getClassSessionExpertsResponseSchema
>;
export type GetClassSessionExpertsResult =
  GetClassSessionExpertsResponse["value"];
export type ClassSessionExpertResponse = z.infer<
  typeof classSessionExpertResponseSchema
>;
export type ClassSessionExpertResult = ClassSessionExpertResponse["value"];
export type WithdrawClassSessionExpertResponse = z.infer<
  typeof withdrawClassSessionExpertResponseSchema
>;
export type WithdrawClassSessionExpertResult =
  WithdrawClassSessionExpertResponse["value"];
