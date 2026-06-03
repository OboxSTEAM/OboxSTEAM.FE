export { updateProfileSchema, uploadAvatarSchema } from "./account";
export {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordLinkParamsSchema,
  sendResetLinkSchema,
  verifyOtpSchema,
} from "./auth";
export {
  approveParentLinkSchema,
  completeParentProfileSchema,
  parentMagicLoginLinkParamsSchema,
  parentMagicLoginSchema,
  requestParentLinkSchema,
} from "./parent";
