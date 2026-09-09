import { z } from "zod";

import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import {
  frameworkRubricCriterionSchema,
  programFrameworkSchema,
} from "@/lib/api/entities/program-framework";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedProgramFrameworksSchema = createPaginatedSchema(
  programFrameworkSchema,
);

export const programFrameworksListValueSchema = createApiValueSchema(
  paginatedProgramFrameworksSchema,
);
export const programFrameworkValueSchema = createApiValueSchema(
  programFrameworkSchema,
);
export const frameworkRubricCriterionValueSchema = createApiValueSchema(
  frameworkRubricCriterionSchema,
);
export const deleteProgramFrameworkValueSchema = createApiValueSchema(z.boolean());

export const getProgramFrameworksResponseSchema = createApiResponseSchema(
  programFrameworksListValueSchema,
);
export const getProgramFrameworkByIdResponseSchema = createApiResponseSchema(
  programFrameworkValueSchema,
);
export const createProgramFrameworkResponseSchema = createApiResponseSchema(
  programFrameworkValueSchema,
);
export const updateProgramFrameworkResponseSchema = createApiResponseSchema(
  programFrameworkValueSchema,
);
export const deleteProgramFrameworkResponseSchema = createApiResponseSchema(
  deleteProgramFrameworkValueSchema,
);
export const createFrameworkCriterionResponseSchema = createApiResponseSchema(
  frameworkRubricCriterionValueSchema,
);
export const updateFrameworkCriterionResponseSchema = createApiResponseSchema(
  frameworkRubricCriterionValueSchema,
);
export const deleteFrameworkCriterionResponseSchema = createApiResponseSchema(
  deleteProgramFrameworkValueSchema,
);

export type GetProgramFrameworksResponse = z.infer<
  typeof getProgramFrameworksResponseSchema
>;
export type GetProgramFrameworksResult = GetProgramFrameworksResponse["value"];
export type GetProgramFrameworkByIdResponse = z.infer<
  typeof getProgramFrameworkByIdResponseSchema
>;
export type GetProgramFrameworkByIdResult =
  GetProgramFrameworkByIdResponse["value"];
export type CreateProgramFrameworkResponse = z.infer<
  typeof createProgramFrameworkResponseSchema
>;
export type CreateProgramFrameworkResult =
  CreateProgramFrameworkResponse["value"];
export type UpdateProgramFrameworkResponse = z.infer<
  typeof updateProgramFrameworkResponseSchema
>;
export type UpdateProgramFrameworkResult =
  UpdateProgramFrameworkResponse["value"];
export type DeleteProgramFrameworkResponse = z.infer<
  typeof deleteProgramFrameworkResponseSchema
>;
export type DeleteProgramFrameworkResult =
  DeleteProgramFrameworkResponse["value"];
export type CreateFrameworkCriterionResponse = z.infer<
  typeof createFrameworkCriterionResponseSchema
>;
export type CreateFrameworkCriterionResult =
  CreateFrameworkCriterionResponse["value"];
export type UpdateFrameworkCriterionResponse = z.infer<
  typeof updateFrameworkCriterionResponseSchema
>;
export type UpdateFrameworkCriterionResult =
  UpdateFrameworkCriterionResponse["value"];
export type DeleteFrameworkCriterionResponse = z.infer<
  typeof deleteFrameworkCriterionResponseSchema
>;
export type DeleteFrameworkCriterionResult =
  DeleteFrameworkCriterionResponse["value"];
