export {
  register,
  verifyOtp,
  login,
  refreshToken,
  type RegisterInput,
  type VerifyOtpInput,
  type LoginInput,
  type RefreshTokenInput,
  type RegisteredUser,
  type AuthTokens,
  type RegisterResponse,
  type VerifyOtpResponse,
  type LoginResponse,
  type RefreshTokenResponse,
  type RegisterResult,
  type VerifyOtpResult,
  type LoginResult,
  type RefreshTokenResult,
} from "./auth";

export { createApiPost } from "./create-endpoint";
export { ApiRequestError, ApiResponseError } from "./errors";
export {
  apiFetch,
  apiFetchParsed,
  assertApiSuccess,
  getApiBaseUrl,
} from "./client";
export {
  apiErrorSchema,
  apiValueMessageOnlySchema,
  createApiResponseSchema,
  createApiValueSchema,
  type ApiEnvelope,
  type ApiError,
} from "./schemas";
