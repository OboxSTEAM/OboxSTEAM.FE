import { z } from "zod";

import { createApiPost } from "@/lib/api/create-endpoint";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  verifyOtpSchema,
} from "@/lib/validations/auth";

import {
  loginValueSchema,
  refreshTokenValueSchema,
  registerValueSchema,
  verifyOtpValueSchema,
} from "./schemas";

export type {
  AuthTokens,
  LoginResponse,
  LoginResult,
  RegisteredUser,
  RefreshTokenResponse,
  RefreshTokenResult,
  RegisterResponse,
  RegisterResult,
  VerifyOtpResponse,
  VerifyOtpResult,
} from "./schemas";

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

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
