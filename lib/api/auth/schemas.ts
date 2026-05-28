import { z } from "zod";

import { userProfileSchema } from "@/lib/api/entities/user";
import {
  apiValueMessageOnlySchema,
  createApiResponseSchema,
  createApiValueSchema,
} from "@/lib/api/schemas";

/** Same shape as account profile — used by register response. */
export const registeredUserSchema = userProfileSchema;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const registerValueSchema = createApiValueSchema(registeredUserSchema);
export const verifyOtpValueSchema = apiValueMessageOnlySchema;
export const loginValueSchema = createApiValueSchema(authTokensSchema);
export const refreshTokenValueSchema = createApiValueSchema(authTokensSchema);
export const sendResetLinkValueSchema = apiValueMessageOnlySchema;
export const forgotPasswordValueSchema = apiValueMessageOnlySchema;

export const registerResponseSchema = createApiResponseSchema(registerValueSchema);
export const verifyOtpResponseSchema = createApiResponseSchema(verifyOtpValueSchema);
export const loginResponseSchema = createApiResponseSchema(loginValueSchema);
export const refreshTokenResponseSchema =
  createApiResponseSchema(refreshTokenValueSchema);
export const sendResetLinkResponseSchema = createApiResponseSchema(
  sendResetLinkValueSchema,
);
export const forgotPasswordResponseSchema = createApiResponseSchema(
  forgotPasswordValueSchema,
);

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

export type SendResetLinkResponse = z.infer<typeof sendResetLinkResponseSchema>;
export type ForgotPasswordResponse = z.infer<typeof forgotPasswordResponseSchema>;
export type SendResetLinkResult = SendResetLinkResponse["value"];
export type ForgotPasswordResult = ForgotPasswordResponse["value"];
