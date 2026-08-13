import { z } from "zod";

import { authTokensSchema } from "@/lib/api/auth/schemas";
import { linkedAccountSchema } from "@/lib/api/entities/linked-account";
import {
  parentChildProgressionSchema,
  parentEnrollmentProgressionSchema,
} from "@/lib/api/entities/parent-progression";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const parentLinkedStudentSchema = linkedAccountSchema;

export const parentBooleanValueSchema = createApiValueSchema(z.boolean());
export const parentMagicLoginValueSchema = createApiValueSchema(authTokensSchema);
export const parentLinksValueSchema = createApiValueSchema(
  z.array(parentLinkedStudentSchema),
);
export const parentChildProgressionValueSchema = createApiValueSchema(
  parentChildProgressionSchema,
);
export const parentEnrollmentProgressionValueSchema = createApiValueSchema(
  parentEnrollmentProgressionSchema,
);

export const requestParentLinkResponseSchema = createApiResponseSchema(
  parentBooleanValueSchema,
);
export const parentMagicLoginResponseSchema = createApiResponseSchema(
  parentMagicLoginValueSchema,
);
export const completeParentProfileResponseSchema = createApiResponseSchema(
  parentBooleanValueSchema,
);
export const approveParentLinkResponseSchema = createApiResponseSchema(
  parentBooleanValueSchema,
);
export const getParentLinksResponseSchema = createApiResponseSchema(
  parentLinksValueSchema,
);
export const getParentChildProgressionResponseSchema = createApiResponseSchema(
  parentChildProgressionValueSchema,
);
export const getParentEnrollmentProgressionResponseSchema = createApiResponseSchema(
  parentEnrollmentProgressionValueSchema,
);

export type ParentLinkedStudent = z.infer<typeof parentLinkedStudentSchema>;

export type RequestParentLinkResponse = z.infer<
  typeof requestParentLinkResponseSchema
>;
export type ParentMagicLoginResponse = z.infer<typeof parentMagicLoginResponseSchema>;
export type CompleteParentProfileResponse = z.infer<
  typeof completeParentProfileResponseSchema
>;
export type ApproveParentLinkResponse = z.infer<typeof approveParentLinkResponseSchema>;
export type GetParentLinksResponse = z.infer<typeof getParentLinksResponseSchema>;
export type GetParentChildProgressionResponse = z.infer<
  typeof getParentChildProgressionResponseSchema
>;
export type GetParentEnrollmentProgressionResponse = z.infer<
  typeof getParentEnrollmentProgressionResponseSchema
>;

export type RequestParentLinkResult = RequestParentLinkResponse["value"];
export type ParentMagicLoginResult = ParentMagicLoginResponse["value"];
export type CompleteParentProfileResult = CompleteParentProfileResponse["value"];
export type ApproveParentLinkResult = ApproveParentLinkResponse["value"];
export type GetParentLinksResult = GetParentLinksResponse["value"];
export type GetParentChildProgressionResult =
  GetParentChildProgressionResponse["value"];
export type GetParentEnrollmentProgressionResult =
  GetParentEnrollmentProgressionResponse["value"];

export type {
  ParentActivityStats,
  ParentAssignmentOutcome,
  ParentBlocker,
  ParentBlockerCode,
  ParentChildProgression,
  ParentClassInfo,
  ParentCurrentActivity,
  ParentCurrentModule,
  ParentEnrollmentBrief,
  ParentEnrollmentHeader,
  ParentEnrollmentProgression,
  ParentModuleOutcomeLabel,
  ParentModuleProgress,
  ParentProgressEvent,
  ParentProgressEventType,
  ParentProgressionStudent,
  ParentProgressionSummary,
} from "@/lib/api/entities/parent-progression";
