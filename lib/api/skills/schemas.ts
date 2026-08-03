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

export type GetSkillsResponse = z.infer<typeof getSkillsResponseSchema>;
export type GetSkillsResult = GetSkillsResponse["value"];
