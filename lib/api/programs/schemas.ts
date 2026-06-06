import { z } from "zod";

import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import {
  programSchema,
  programWithModulesSchema,
} from "@/lib/api/entities/program";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedProgramsSchema = createPaginatedSchema(programSchema);
export const paginatedProgramsWithModulesSchema = createPaginatedSchema(
  programWithModulesSchema,
);

export const programsListValueSchema = createApiValueSchema(paginatedProgramsSchema);
export const programsWithModulesListValueSchema = createApiValueSchema(
  paginatedProgramsWithModulesSchema,
);
export const programDetailValueSchema = createApiValueSchema(programWithModulesSchema);

export const getProgramsResponseSchema = createApiResponseSchema(programsListValueSchema);
export const getProgramsWithModulesResponseSchema = createApiResponseSchema(
  programsWithModulesListValueSchema,
);
export const getProgramByIdResponseSchema = createApiResponseSchema(
  programDetailValueSchema,
);

export const programMutationValueSchema = createApiValueSchema(programWithModulesSchema);
export const programDeleteValueSchema = createApiValueSchema(z.boolean());

export const createProgramResponseSchema = createApiResponseSchema(
  programMutationValueSchema,
);
export const updateProgramResponseSchema = createApiResponseSchema(
  programMutationValueSchema,
);
export const deleteProgramResponseSchema = createApiResponseSchema(
  programDeleteValueSchema,
);

export type GetProgramsResponse = z.infer<typeof getProgramsResponseSchema>;
export type GetProgramsWithModulesResponse = z.infer<typeof getProgramsWithModulesResponseSchema>;
export type GetProgramByIdResponse = z.infer<typeof getProgramByIdResponseSchema>;
export type CreateProgramResponse = z.infer<typeof createProgramResponseSchema>;
export type UpdateProgramResponse = z.infer<typeof updateProgramResponseSchema>;
export type DeleteProgramResponse = z.infer<typeof deleteProgramResponseSchema>;

export type GetProgramsResult = GetProgramsResponse["value"];
export type GetProgramsWithModulesResult = GetProgramsWithModulesResponse["value"];
export type GetProgramByIdResult = GetProgramByIdResponse["value"];
export type CreateProgramResult = CreateProgramResponse["value"];
export type UpdateProgramResult = UpdateProgramResponse["value"];
export type DeleteProgramResult = DeleteProgramResponse["value"];
