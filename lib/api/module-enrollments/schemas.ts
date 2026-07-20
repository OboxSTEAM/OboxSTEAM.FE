import { z } from "zod";

import { studentMilestoneProgressSchema } from "@/lib/api/entities/research-milestone-progress";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const studentMilestoneProgressValueSchema = createApiValueSchema(
  studentMilestoneProgressSchema,
);

export const getModuleEnrollmentResearchMilestoneProgressResponseSchema =
  createApiResponseSchema(studentMilestoneProgressValueSchema);

export type GetModuleEnrollmentResearchMilestoneProgressResponse = z.infer<
  typeof getModuleEnrollmentResearchMilestoneProgressResponseSchema
>;
export type GetModuleEnrollmentResearchMilestoneProgressResult =
  GetModuleEnrollmentResearchMilestoneProgressResponse["value"];
