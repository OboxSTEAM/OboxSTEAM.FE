import { z } from "zod";

import { authTokensSchema } from "@/lib/api/auth/schemas";
import { linkedAccountSchema } from "@/lib/api/entities/linked-account";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const parentLinkedStudentSchema = linkedAccountSchema;

export const parentBooleanValueSchema = createApiValueSchema(z.boolean());
export const parentMagicLoginValueSchema = createApiValueSchema(authTokensSchema);
export const parentLinksValueSchema = createApiValueSchema(
  z.array(parentLinkedStudentSchema),
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

export type RequestParentLinkResult = RequestParentLinkResponse["value"];
export type ParentMagicLoginResult = ParentMagicLoginResponse["value"];
export type CompleteParentProfileResult = CompleteParentProfileResponse["value"];
export type ApproveParentLinkResult = ApproveParentLinkResponse["value"];
export type GetParentLinksResult = GetParentLinksResponse["value"];
