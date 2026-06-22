import { z } from "zod";

import { moduleSchema } from "@/lib/api/entities/module";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const moduleDetailValueSchema = createApiValueSchema(moduleSchema);

export const getModuleByIdResponseSchema = createApiResponseSchema(moduleDetailValueSchema);

export type GetModuleByIdResponse = z.infer<typeof getModuleByIdResponseSchema>;
export type GetModuleByIdResult = GetModuleByIdResponse["value"];
