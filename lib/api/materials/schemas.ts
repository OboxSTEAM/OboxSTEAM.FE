import { z } from "zod";

import { materialListItemSchema, materialSchema } from "@/lib/api/entities/material";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedMaterialsSchema = createPaginatedSchema(materialListItemSchema);
export const materialsListValueSchema = createApiValueSchema(paginatedMaterialsSchema);
export const getMaterialsResponseSchema = createApiResponseSchema(materialsListValueSchema);

export const materialDetailValueSchema = createApiValueSchema(materialSchema);

export const getMaterialResponseSchema = createApiResponseSchema(materialDetailValueSchema);
export const materialMutationValueSchema = createApiValueSchema(materialSchema);
// Delete returns a message-only envelope (data may be a boolean, null, or absent).
export const materialDeleteValueSchema = createApiValueSchema(z.boolean().nullish());

export const uploadMaterialResponseSchema = createApiResponseSchema(materialMutationValueSchema);
export const updateMaterialResponseSchema = createApiResponseSchema(materialMutationValueSchema);
export const deleteMaterialResponseSchema = createApiResponseSchema(materialDeleteValueSchema);

export type GetMaterialsResponse = z.infer<typeof getMaterialsResponseSchema>;
export type GetMaterialsResult = GetMaterialsResponse["value"];

export type GetMaterialResponse = z.infer<typeof getMaterialResponseSchema>;
export type GetMaterialResult = GetMaterialResponse["value"];

export type UploadMaterialResponse = z.infer<typeof uploadMaterialResponseSchema>;
export type UploadMaterialResult = UploadMaterialResponse["value"];

export type UpdateMaterialResponse = z.infer<typeof updateMaterialResponseSchema>;
export type UpdateMaterialResult = UpdateMaterialResponse["value"];

export type DeleteMaterialResponse = z.infer<typeof deleteMaterialResponseSchema>;
export type DeleteMaterialResult = DeleteMaterialResponse["value"];
