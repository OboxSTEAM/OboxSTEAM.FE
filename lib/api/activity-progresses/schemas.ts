import { z } from "zod";

import { activityProgressRecordSchema } from "@/lib/api/entities/activity-progress-record";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const activityProgressRecordValueSchema = createApiValueSchema(
  activityProgressRecordSchema,
);

export const forceCompleteActivityResponseSchema = createApiResponseSchema(
  activityProgressRecordValueSchema,
);

export type ForceCompleteActivityResponse = z.infer<
  typeof forceCompleteActivityResponseSchema
>;
export type ForceCompleteActivityResult = ForceCompleteActivityResponse["value"];
