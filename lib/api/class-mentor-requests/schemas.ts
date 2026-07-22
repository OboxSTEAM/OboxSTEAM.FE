import { z } from "zod";

import { classMentorRequestSchema } from "@/lib/api/entities/class-mentor-request";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { skillSummarySchema } from "@/lib/api/entities/skill";
import { classStatusSchema } from "@/lib/api/entities/class";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedClassMentorRequestsSchema = createPaginatedSchema(
  classMentorRequestSchema,
);

export const mentorBoardClassSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  programId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  maxCapacity: z.number().int(),
  status: classStatusSchema,
  scheduleSummary: z.string().nullable(),
  requiredSkills: z
    .array(skillSummarySchema)
    .nullish()
    .transform((value) => value ?? []),
  matchesMySkills: z.boolean(),
  hasPendingRequestFromMe: z.boolean(),
  pendingRequestCount: z.number().int(),
});

export const paginatedMentorBoardClassesSchema = createPaginatedSchema(
  mentorBoardClassSchema,
);

export const classMentorRequestsListValueSchema = createApiValueSchema(
  paginatedClassMentorRequestsSchema,
);
export const classMentorRequestValueSchema = createApiValueSchema(
  classMentorRequestSchema,
);
export const withdrawClassMentorRequestValueSchema = createApiValueSchema(
  z.boolean(),
);
export const mentorBoardListValueSchema = createApiValueSchema(
  paginatedMentorBoardClassesSchema,
);

export const getClassMentorRequestsResponseSchema = createApiResponseSchema(
  classMentorRequestsListValueSchema,
);
export const classMentorRequestResponseSchema = createApiResponseSchema(
  classMentorRequestValueSchema,
);
export const withdrawClassMentorRequestResponseSchema = createApiResponseSchema(
  withdrawClassMentorRequestValueSchema,
);
export const getMentorBoardResponseSchema = createApiResponseSchema(
  mentorBoardListValueSchema,
);

export type GetClassMentorRequestsResponse = z.infer<
  typeof getClassMentorRequestsResponseSchema
>;
export type GetClassMentorRequestsResult = GetClassMentorRequestsResponse["value"];

export type ClassMentorRequestResponse = z.infer<
  typeof classMentorRequestResponseSchema
>;
export type ClassMentorRequestResult = ClassMentorRequestResponse["value"];

export type WithdrawClassMentorRequestResponse = z.infer<
  typeof withdrawClassMentorRequestResponseSchema
>;
export type WithdrawClassMentorRequestResult =
  WithdrawClassMentorRequestResponse["value"];

export type GetMentorBoardResponse = z.infer<typeof getMentorBoardResponseSchema>;
export type GetMentorBoardResult = GetMentorBoardResponse["value"];

export type MentorBoardClass = z.infer<typeof mentorBoardClassSchema>;
