import { z } from "zod";

import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { skillSummarySchema } from "@/lib/api/entities/skill";
import {
  createApiResponseSchema,
  createApiValueSchema,
} from "@/lib/api/schemas";

export const paginatedSkillsSchema = createPaginatedSchema(skillSummarySchema);
export const skillsListValueSchema = createApiValueSchema(paginatedSkillsSchema);

export const getSkillsResponseSchema = createApiResponseSchema(
  skillsListValueSchema,
);

/** Create response includes description; catalog list items do not. */
export const createdSkillSchema = skillSummarySchema.extend({
  description: z.string().nullish(),
});

export const createSkillValueSchema = createApiValueSchema(createdSkillSchema);

export const createSkillResponseSchema = createApiResponseSchema(
  createSkillValueSchema,
);

export type GetSkillsResponse = z.infer<typeof getSkillsResponseSchema>;
export type GetSkillsResult = GetSkillsResponse["value"];
export type CreatedSkill = z.infer<typeof createdSkillSchema>;
