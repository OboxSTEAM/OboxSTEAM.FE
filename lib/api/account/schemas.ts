import { z } from "zod";

import { userProfileSchema } from "@/lib/api/entities/user";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const userProfileValueSchema = createApiValueSchema(userProfileSchema);

export const getCurrentUserResponseSchema =
  createApiResponseSchema(userProfileValueSchema);
export const getUserProfileByIdResponseSchema =
  createApiResponseSchema(userProfileValueSchema);
export const updateProfileResponseSchema =
  createApiResponseSchema(userProfileValueSchema);
export const uploadAvatarResponseSchema =
  createApiResponseSchema(userProfileValueSchema);

export type GetCurrentUserResponse = z.infer<typeof getCurrentUserResponseSchema>;
export type GetUserProfileByIdResponse = z.infer<typeof getUserProfileByIdResponseSchema>;
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;
export type UploadAvatarResponse = z.infer<typeof uploadAvatarResponseSchema>;

export type UserProfileValue = z.infer<typeof userProfileValueSchema>;
export type GetCurrentUserResult = NonNullable<GetCurrentUserResponse["value"]>;
export type GetUserProfileByIdResult = NonNullable<GetUserProfileByIdResponse["value"]>;
export type UpdateProfileResult = NonNullable<UpdateProfileResponse["value"]>;
export type UploadAvatarResult = NonNullable<UploadAvatarResponse["value"]>;
