import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import type { UserProfile } from "@/lib/api/entities/user";
import { updateProfileSchema } from "@/lib/validations/account";

import {
  getCurrentUserResponseSchema,
  updateProfileResponseSchema,
  uploadAvatarResponseSchema,
  type GetCurrentUserResult,
  type UpdateProfileResult,
  type UploadAvatarResult,
} from "./schemas";

export type {
  GetCurrentUserResponse,
  GetCurrentUserResult,
  UpdateProfileResponse,
  UpdateProfileResult,
  UploadAvatarResponse,
  UploadAvatarResult,
  UserProfileValue,
} from "./schemas";

export type { UserProfile } from "@/lib/api/entities/user";

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

const ACCOUNT_ME = "/api/account/me";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

export async function getCurrentUser(): Promise<GetCurrentUserResult> {
  const response = await apiFetchParsed(ACCOUNT_ME, getCurrentUserResponseSchema, {
    method: "GET",
  });
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const body = updateProfileSchema.parse(input);
  const response = await apiFetchParsed(ACCOUNT_ME, updateProfileResponseSchema, {
    method: "PUT",
    body,
  });
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function uploadAvatar(file: File): Promise<UploadAvatarResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetchParsed(
    `${ACCOUNT_ME}/avatar`,
    uploadAvatarResponseSchema,
    {
      method: "POST",
      body: formData,
    },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Maps API profile to session user fields for header / auth storage. */
export function toStoredAuthUser(profile: UserProfile) {
  return {
    email: profile.email,
    code: profile.code,
    displayName: profile.fullName,
    avatarUrl: profile.avatarUrl,
  };
}
