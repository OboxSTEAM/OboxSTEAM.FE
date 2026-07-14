import { z } from "zod";

import { activitySchema } from "@/lib/api/entities/activity";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const activityDetailValueSchema = createApiValueSchema(activitySchema);

export const getActivityByIdResponseSchema = createApiResponseSchema(
  activityDetailValueSchema,
);

export const activityMutationValueSchema = createApiValueSchema(activitySchema);
export const activityDeleteValueSchema = createApiValueSchema(z.boolean());

export const createActivityResponseSchema = createApiResponseSchema(activityMutationValueSchema);
export const updateActivityResponseSchema = createApiResponseSchema(activityMutationValueSchema);
export const deleteActivityResponseSchema = createApiResponseSchema(activityDeleteValueSchema);

export type GetActivityByIdResponse = z.infer<typeof getActivityByIdResponseSchema>;
export type GetActivityByIdResult = GetActivityByIdResponse["value"];

export type CreateActivityResponse = z.infer<typeof createActivityResponseSchema>;
export type CreateActivityResult = CreateActivityResponse["value"];

export type UpdateActivityResponse = z.infer<typeof updateActivityResponseSchema>;
export type UpdateActivityResult = UpdateActivityResponse["value"];

export type DeleteActivityResponse = z.infer<typeof deleteActivityResponseSchema>;
export type DeleteActivityResult = DeleteActivityResponse["value"];
