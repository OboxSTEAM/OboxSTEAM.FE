import { z } from "zod";

import { rebuyClassCatalogSchema } from "@/lib/api/entities/rebuy-class-catalog";
import { studentMilestoneProgressSchema } from "@/lib/api/entities/research-milestone-progress";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const studentMilestoneProgressValueSchema = createApiValueSchema(
  studentMilestoneProgressSchema,
);

export const getModuleEnrollmentResearchMilestoneProgressResponseSchema =
  createApiResponseSchema(studentMilestoneProgressValueSchema);

export const moduleEnrollmentContinuityClassesValueSchema = createApiValueSchema(
  rebuyClassCatalogSchema,
);
export const getModuleEnrollmentContinuityClassesResponseSchema =
  createApiResponseSchema(moduleEnrollmentContinuityClassesValueSchema);

export type GetModuleEnrollmentResearchMilestoneProgressResponse = z.infer<
  typeof getModuleEnrollmentResearchMilestoneProgressResponseSchema
>;
export type GetModuleEnrollmentResearchMilestoneProgressResult =
  GetModuleEnrollmentResearchMilestoneProgressResponse["value"];

export type GetModuleEnrollmentContinuityClassesResponse = z.infer<
  typeof getModuleEnrollmentContinuityClassesResponseSchema
>;
export type GetModuleEnrollmentContinuityClassesResult =
  GetModuleEnrollmentContinuityClassesResponse["value"];
