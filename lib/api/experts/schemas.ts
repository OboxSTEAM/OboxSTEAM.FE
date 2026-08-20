import { z } from "zod";

import {
  expertDegreeSchema,
  expertProgramSchema,
  expertPublicationSchema,
  expertSchema,
} from "@/lib/api/entities/expert";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedExpertsSchema = createPaginatedSchema(expertSchema);
export const expertsListValueSchema = createApiValueSchema(paginatedExpertsSchema);
export const expertDetailValueSchema = createApiValueSchema(expertSchema);
export const expertMutationValueSchema = createApiValueSchema(expertSchema);
export const expertProgramValueSchema = createApiValueSchema(expertProgramSchema);
export const deleteExpertValueSchema = createApiValueSchema(z.boolean());

export const getExpertsResponseSchema = createApiResponseSchema(expertsListValueSchema);
export const getExpertByIdResponseSchema = createApiResponseSchema(
  expertDetailValueSchema,
);
export const createExpertResponseSchema = createApiResponseSchema(
  expertMutationValueSchema,
);
export const updateExpertResponseSchema = createApiResponseSchema(
  expertMutationValueSchema,
);
export const deleteExpertResponseSchema = createApiResponseSchema(
  deleteExpertValueSchema,
);
export const expertProgramResponseSchema = createApiResponseSchema(
  expertProgramValueSchema,
);
export const expertDegreeValueSchema = createApiValueSchema(expertDegreeSchema);
export const expertPublicationValueSchema = createApiValueSchema(
  expertPublicationSchema,
);
export const createExpertDegreeResponseSchema = createApiResponseSchema(
  expertDegreeValueSchema,
);
export const updateExpertDegreeResponseSchema = createApiResponseSchema(
  expertDegreeValueSchema,
);
export const createExpertPublicationResponseSchema = createApiResponseSchema(
  expertPublicationValueSchema,
);
export const updateExpertPublicationResponseSchema = createApiResponseSchema(
  expertPublicationValueSchema,
);

export type GetExpertsResponse = z.infer<typeof getExpertsResponseSchema>;
export type GetExpertsResult = GetExpertsResponse["value"];
export type GetExpertByIdResponse = z.infer<typeof getExpertByIdResponseSchema>;
export type GetExpertByIdResult = GetExpertByIdResponse["value"];
export type CreateExpertResponse = z.infer<typeof createExpertResponseSchema>;
export type CreateExpertResult = CreateExpertResponse["value"];
export type UpdateExpertResponse = z.infer<typeof updateExpertResponseSchema>;
export type UpdateExpertResult = UpdateExpertResponse["value"];
export type DeleteExpertResponse = z.infer<typeof deleteExpertResponseSchema>;
export type DeleteExpertResult = DeleteExpertResponse["value"];
export type ExpertProgramResponse = z.infer<typeof expertProgramResponseSchema>;
export type ExpertProgramResult = ExpertProgramResponse["value"];
export type CreateExpertDegreeResponse = z.infer<
  typeof createExpertDegreeResponseSchema
>;
export type CreateExpertDegreeResult = CreateExpertDegreeResponse["value"];
export type UpdateExpertDegreeResponse = z.infer<
  typeof updateExpertDegreeResponseSchema
>;
export type UpdateExpertDegreeResult = UpdateExpertDegreeResponse["value"];
export type CreateExpertPublicationResponse = z.infer<
  typeof createExpertPublicationResponseSchema
>;
export type CreateExpertPublicationResult = CreateExpertPublicationResponse["value"];
export type UpdateExpertPublicationResponse = z.infer<
  typeof updateExpertPublicationResponseSchema
>;
export type UpdateExpertPublicationResult = UpdateExpertPublicationResponse["value"];
