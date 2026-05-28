export {
  register,
  verifyOtp,
  login,
  refreshToken,
  sendResetLink,
  forgotPassword,
  type RegisterInput,
  type VerifyOtpInput,
  type LoginInput,
  type RefreshTokenInput,
  type SendResetLinkInput,
  type ForgotPasswordInput,
  type RegisteredUser,
  type AuthTokens,
  type RegisterResponse,
  type VerifyOtpResponse,
  type LoginResponse,
  type RefreshTokenResponse,
  type SendResetLinkResponse,
  type ForgotPasswordResponse,
  type RegisterResult,
  type VerifyOtpResult,
  type LoginResult,
  type RefreshTokenResult,
  type SendResetLinkResult,
  type ForgotPasswordResult,
} from "./auth";

export { createApiPost } from "./create-endpoint";
export { ApiRequestError, ApiResponseError } from "./errors";
export {
  apiFetch,
  apiFetchParsed,
  assertApiSuccess,
  getApiBaseUrl,
  type ApiFetchOptions,
} from "./client";
export {
  apiErrorSchema,
  apiValueMessageOnlySchema,
  createApiResponseSchema,
  createApiValueSchema,
  type ApiEnvelope,
  type ApiError,
} from "./schemas";
