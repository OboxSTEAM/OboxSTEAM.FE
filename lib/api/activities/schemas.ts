import { z } from "zod";

import { activitySchema } from "@/lib/api/entities/activity";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const activityDetailValueSchema = createApiValueSchema(activitySchema);

export const getActivityByIdResponseSchema = createApiResponseSchema(
  activityDetailValueSchema,
);

export type GetActivityByIdResponse = z.infer<typeof getActivityByIdResponseSchema>;
export type GetActivityByIdResult = GetActivityByIdResponse["value"];
