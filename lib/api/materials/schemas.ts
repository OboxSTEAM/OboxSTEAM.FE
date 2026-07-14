import { z } from "zod";

import { materialSchema } from "@/lib/api/entities/material";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const materialDetailValueSchema = createApiValueSchema(materialSchema);

export const getMaterialResponseSchema = createApiResponseSchema(materialDetailValueSchema);
export const materialMutationValueSchema = createApiValueSchema(materialSchema);
export const materialDeleteValueSchema = createApiValueSchema(z.boolean());

export const uploadMaterialResponseSchema = createApiResponseSchema(materialMutationValueSchema);
export const updateMaterialResponseSchema = createApiResponseSchema(materialMutationValueSchema);
export const deleteMaterialResponseSchema = createApiResponseSchema(materialDeleteValueSchema);

export type GetMaterialResponse = z.infer<typeof getMaterialResponseSchema>;
export type GetMaterialResult = GetMaterialResponse["value"];

export type UploadMaterialResponse = z.infer<typeof uploadMaterialResponseSchema>;
export type UploadMaterialResult = UploadMaterialResponse["value"];

export type UpdateMaterialResponse = z.infer<typeof updateMaterialResponseSchema>;
export type UpdateMaterialResult = UpdateMaterialResponse["value"];

export type DeleteMaterialResponse = z.infer<typeof deleteMaterialResponseSchema>;
export type DeleteMaterialResult = DeleteMaterialResponse["value"];
