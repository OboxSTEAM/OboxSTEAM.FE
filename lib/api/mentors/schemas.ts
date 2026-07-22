import { z } from "zod";

import {
  mentorAssignmentProfileSchema,
  mentorSkillSchema,
} from "@/lib/api/entities/mentor";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedMentorsSchema = createPaginatedSchema(
  mentorAssignmentProfileSchema,
);

export const mentorsListValueSchema = createApiValueSchema(paginatedMentorsSchema);
export const mentorValueSchema = createApiValueSchema(mentorAssignmentProfileSchema);
export const mentorSkillsListValueSchema = createApiValueSchema(
  z.array(mentorSkillSchema),
);
export const mentorSkillValueSchema = createApiValueSchema(mentorSkillSchema);
export const deleteMentorSkillValueSchema = createApiValueSchema(z.boolean());

export const getMentorsResponseSchema =
  createApiResponseSchema(mentorsListValueSchema);
export const mentorResponseSchema = createApiResponseSchema(mentorValueSchema);
export const getMyMentorSkillsResponseSchema = createApiResponseSchema(
  mentorSkillsListValueSchema,
);
export const mentorSkillResponseSchema =
  createApiResponseSchema(mentorSkillValueSchema);
export const deleteMentorSkillResponseSchema = createApiResponseSchema(
  deleteMentorSkillValueSchema,
);

export type GetMentorsResponse = z.infer<typeof getMentorsResponseSchema>;
export type GetMentorsResult = GetMentorsResponse["value"];

export type MentorResponse = z.infer<typeof mentorResponseSchema>;
export type MentorResult = MentorResponse["value"];

export type GetMyMentorSkillsResponse = z.infer<
  typeof getMyMentorSkillsResponseSchema
>;
export type GetMyMentorSkillsResult = GetMyMentorSkillsResponse["value"];

export type MentorSkillResponse = z.infer<typeof mentorSkillResponseSchema>;
export type MentorSkillResult = MentorSkillResponse["value"];

export type DeleteMentorSkillResponse = z.infer<
  typeof deleteMentorSkillResponseSchema
>;
export type DeleteMentorSkillResult = DeleteMentorSkillResponse["value"];
