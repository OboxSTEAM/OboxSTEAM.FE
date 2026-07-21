import { z } from "zod";

import {
  researchMilestoneActivitySchema,
  researchMilestoneSchema,
} from "@/lib/api/entities/research-milestone";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const researchMilestoneValueSchema = createApiValueSchema(researchMilestoneSchema);
export const researchMilestoneListValueSchema = createApiValueSchema(
  z.array(researchMilestoneSchema),
);
export const milestoneActivityValueSchema = createApiValueSchema(
  researchMilestoneActivitySchema,
);

export const getResearchMilestonesResponseSchema = createApiResponseSchema(
  researchMilestoneListValueSchema,
);
export const getResearchMilestoneResponseSchema = createApiResponseSchema(
  researchMilestoneValueSchema,
);
export const researchMilestoneMutationResponseSchema = createApiResponseSchema(
  researchMilestoneValueSchema,
);
export const linkMilestoneActivityResponseSchema = createApiResponseSchema(
  milestoneActivityValueSchema,
);
export const deleteResearchMilestoneResponseSchema = createApiResponseSchema(z.unknown());

export type GetResearchMilestonesResponse = z.infer<
  typeof getResearchMilestonesResponseSchema
>;
export type GetResearchMilestonesResult = GetResearchMilestonesResponse["value"];

export type GetResearchMilestoneResponse = z.infer<
  typeof getResearchMilestoneResponseSchema
>;
export type GetResearchMilestoneResult = GetResearchMilestoneResponse["value"];

export type ResearchMilestoneMutationResponse = z.infer<
  typeof researchMilestoneMutationResponseSchema
>;
export type ResearchMilestoneMutationResult = ResearchMilestoneMutationResponse["value"];

export type LinkMilestoneActivityResponse = z.infer<
  typeof linkMilestoneActivityResponseSchema
>;
export type LinkMilestoneActivityResult = LinkMilestoneActivityResponse["value"];
