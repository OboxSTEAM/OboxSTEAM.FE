import { z } from "zod";

import { mentorSchema, mentorSkillSchema } from "@/lib/api/entities/mentor";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedMentorsSchema = createPaginatedSchema(mentorSchema);

export const mentorsListValueSchema = createApiValueSchema(paginatedMentorsSchema);
export const mentorDetailValueSchema = createApiValueSchema(mentorSchema);
export const mentorSkillsListValueSchema = createApiValueSchema(
  z
    .array(mentorSkillSchema)
    .nullish()
    .transform((value) => value ?? []),
);
export const mentorSkillValueSchema = createApiValueSchema(mentorSkillSchema);
export const deleteMentorSkillValueSchema = createApiValueSchema(z.boolean());

export const getMentorsResponseSchema =
  createApiResponseSchema(mentorsListValueSchema);
export const getMentorByIdResponseSchema =
  createApiResponseSchema(mentorDetailValueSchema);
export const getMyMentorProfileResponseSchema =
  createApiResponseSchema(mentorDetailValueSchema);
export const updateMyMentorProfileResponseSchema =
  createApiResponseSchema(mentorDetailValueSchema);
export const getMyMentorSkillsResponseSchema = createApiResponseSchema(
  mentorSkillsListValueSchema,
);
export const addMyMentorSkillResponseSchema =
  createApiResponseSchema(mentorSkillValueSchema);
export const deleteMyMentorSkillResponseSchema = createApiResponseSchema(
  deleteMentorSkillValueSchema,
);
export const updateMentorClassLimitResponseSchema =
  createApiResponseSchema(mentorDetailValueSchema);

export type GetMentorsResponse = z.infer<typeof getMentorsResponseSchema>;
export type GetMentorsResult = GetMentorsResponse["value"];

export type GetMentorByIdResponse = z.infer<typeof getMentorByIdResponseSchema>;
export type GetMentorByIdResult = GetMentorByIdResponse["value"];

export type GetMyMentorProfileResponse = z.infer<
  typeof getMyMentorProfileResponseSchema
>;
export type GetMyMentorProfileResult = GetMyMentorProfileResponse["value"];

export type UpdateMyMentorProfileResponse = z.infer<
  typeof updateMyMentorProfileResponseSchema
>;
export type UpdateMyMentorProfileResult = UpdateMyMentorProfileResponse["value"];

export type GetMyMentorSkillsResponse = z.infer<
  typeof getMyMentorSkillsResponseSchema
>;
export type GetMyMentorSkillsResult = GetMyMentorSkillsResponse["value"];

export type AddMyMentorSkillResponse = z.infer<
  typeof addMyMentorSkillResponseSchema
>;
export type AddMyMentorSkillResult = AddMyMentorSkillResponse["value"];

export type DeleteMyMentorSkillResponse = z.infer<
  typeof deleteMyMentorSkillResponseSchema
>;
export type DeleteMyMentorSkillResult = DeleteMyMentorSkillResponse["value"];

export type UpdateMentorClassLimitResponse = z.infer<
  typeof updateMentorClassLimitResponseSchema
>;
export type UpdateMentorClassLimitResult = UpdateMentorClassLimitResponse["value"];
