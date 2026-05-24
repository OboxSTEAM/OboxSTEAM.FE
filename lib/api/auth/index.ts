import { z } from "zod";

import { createApiPost } from "@/lib/api/create-endpoint";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  sendResetLinkSchema,
  verifyOtpSchema,
} from "@/lib/validations/auth";

import {
  forgotPasswordValueSchema,
  loginValueSchema,
  refreshTokenValueSchema,
  registerValueSchema,
  sendResetLinkValueSchema,
  verifyOtpValueSchema,
} from "./schemas";

export type {
  AuthTokens,
  ForgotPasswordResponse,
  ForgotPasswordResult,
  LoginResponse,
  LoginResult,
  RegisteredUser,
  RefreshTokenResponse,
  RefreshTokenResult,
  RegisterResponse,
  RegisterResult,
  SendResetLinkResponse,
  SendResetLinkResult,
  VerifyOtpResponse,
  VerifyOtpResult,
} from "./schemas";

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type SendResetLinkInput = z.infer<typeof sendResetLinkSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

const AUTH_BASE = "/api/auth";

export const register = createApiPost({
  path: `${AUTH_BASE}/register`,
  input: registerSchema,
  value: registerValueSchema,
});

export const verifyOtp = createApiPost({
  path: `${AUTH_BASE}/verify-otp`,
  input: verifyOtpSchema,
  value: verifyOtpValueSchema,
});

export const login = createApiPost({
  path: `${AUTH_BASE}/login`,
  input: loginSchema,
  value: loginValueSchema,
});

export const refreshToken = createApiPost({
  path: `${AUTH_BASE}/refresh-token`,
  input: refreshTokenSchema,
  value: refreshTokenValueSchema,
});

export const sendResetLink = createApiPost({
  path: `${AUTH_BASE}/send-resetlink`,
  input: sendResetLinkSchema,
  value: sendResetLinkValueSchema,
});

export const forgotPassword = createApiPost({
  path: `${AUTH_BASE}/forgot-password`,
  input: forgotPasswordSchema,
  value: forgotPasswordValueSchema,
});
