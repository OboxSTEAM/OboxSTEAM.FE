import { z } from "zod";

import { materialSchema } from "@/lib/api/entities/material";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const materialDetailValueSchema = createApiValueSchema(materialSchema);

export const getMaterialByActivityResponseSchema = createApiResponseSchema(
  materialDetailValueSchema,
);

export type GetMaterialByActivityResponse = z.infer<
  typeof getMaterialByActivityResponseSchema
>;
export type GetMaterialByActivityResult = GetMaterialByActivityResponse["value"];
