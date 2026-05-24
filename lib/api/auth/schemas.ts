import { z } from "zod";

import {
  apiValueMessageOnlySchema,
  createApiResponseSchema,
  createApiValueSchema,
} from "@/lib/api/schemas";

export const registeredUserSchema = z.object({
  id: z.string(),
  code: z.string(),
  fullName: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  phone: z.string(),
  role: z.string(),
  status: z.string(),
  isEmailVerified: z.boolean(),
  createdAt: z.string(),
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const registerValueSchema = createApiValueSchema(registeredUserSchema);
export const verifyOtpValueSchema = apiValueMessageOnlySchema;
export const loginValueSchema = createApiValueSchema(authTokensSchema);
export const refreshTokenValueSchema = createApiValueSchema(authTokensSchema);

export const registerResponseSchema = createApiResponseSchema(registerValueSchema);
export const verifyOtpResponseSchema = createApiResponseSchema(verifyOtpValueSchema);
export const loginResponseSchema = createApiResponseSchema(loginValueSchema);
export const refreshTokenResponseSchema =
  createApiResponseSchema(refreshTokenValueSchema);

export type RegisteredUser = z.infer<typeof registeredUserSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;

export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type VerifyOtpResponse = z.infer<typeof verifyOtpResponseSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;

export type RegisterResult = RegisterResponse["value"];
export type VerifyOtpResult = VerifyOtpResponse["value"];
export type LoginResult = LoginResponse["value"];
export type RefreshTokenResult = RefreshTokenResponse["value"];
