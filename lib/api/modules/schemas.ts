import { z } from "zod";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { moduleSchema } from "@/lib/api/entities/module";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedModulesSchema = createPaginatedSchema(moduleSchema);
export const modulesListValueSchema = createApiValueSchema(paginatedModulesSchema);
export const moduleDetailValueSchema = createApiValueSchema(moduleSchema);

export const getModuleByIdResponseSchema = createApiResponseSchema(moduleDetailValueSchema);

export const moduleMutationValueSchema = createApiValueSchema(moduleSchema);
export const moduleDeleteValueSchema = createApiValueSchema(z.boolean());

export const createModuleResponseSchema = createApiResponseSchema(moduleMutationValueSchema);
export const updateModuleResponseSchema = createApiResponseSchema(moduleMutationValueSchema);
export const deleteModuleResponseSchema = createApiResponseSchema(moduleDeleteValueSchema);

export type GetModuleByIdResponse = z.infer<typeof getModuleByIdResponseSchema>;
export type GetModuleByIdResult = GetModuleByIdResponse["value"];

export type CreateModuleResponse = z.infer<typeof createModuleResponseSchema>;
export type CreateModuleResult = CreateModuleResponse["value"];

export type UpdateModuleResponse = z.infer<typeof updateModuleResponseSchema>;
export type UpdateModuleResult = UpdateModuleResponse["value"];

export type DeleteModuleResponse = z.infer<typeof deleteModuleResponseSchema>;
export type DeleteModuleResult = DeleteModuleResponse["value"];

export const getModulesResponseSchema = createApiResponseSchema(modulesListValueSchema);

export type GetModulesResponse = z.infer<typeof getModulesResponseSchema>;
export type GetModulesResult = GetModulesResponse["value"];
