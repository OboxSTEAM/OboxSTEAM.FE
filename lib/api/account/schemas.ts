import { z } from "zod";

import { userProfileSchema } from "@/lib/api/entities/user";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const userProfileValueSchema = createApiValueSchema(userProfileSchema);

export const getCurrentUserResponseSchema =
  createApiResponseSchema(userProfileValueSchema);
export const updateProfileResponseSchema =
  createApiResponseSchema(userProfileValueSchema);
export const uploadAvatarResponseSchema =
  createApiResponseSchema(userProfileValueSchema);

export type GetCurrentUserResponse = z.infer<typeof getCurrentUserResponseSchema>;
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;
export type UploadAvatarResponse = z.infer<typeof uploadAvatarResponseSchema>;

export type UserProfileValue = z.infer<typeof userProfileValueSchema>;
export type GetCurrentUserResult = GetCurrentUserResponse["value"];
export type UpdateProfileResult = UpdateProfileResponse["value"];
export type UploadAvatarResult = UploadAvatarResponse["value"];
