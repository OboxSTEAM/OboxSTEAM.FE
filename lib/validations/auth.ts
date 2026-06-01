import { z } from "zod";

import { registerRoleSchema } from "@/lib/api/entities/user";

export const registerSchema = z.object({
  email: z.email("Email không hợp lệ."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
  fullName: z.string().min(1, "Họ tên là bắt buộc."),
  phone: z.string().min(1, "Số điện thoại là bắt buộc."),
  role: registerRoleSchema,
});

export const verifyOtpSchema = z.object({
  email: z.email("Email không hợp lệ."),
  otp: z
    .string()
    .min(6, "Mã OTP phải có 6 chữ số.")
    .max(6, "Mã OTP phải có 6 chữ số.")
    .regex(/^\d{6}$/, "Mã OTP phải gồm 6 chữ số."),
});

export const loginSchema = z.object({
  email: z.email("Email không hợp lệ."),
  password: z.string().min(1, "Mật khẩu là bắt buộc."),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token là bắt buộc."),
});

export const sendResetLinkSchema = z.object({
  email: z.email("Email không hợp lệ."),
});

/** Query params from the email reset link (`?email=…&token=…`). */
export const resetPasswordLinkParamsSchema = z.object({
  email: z.email("Email không hợp lệ."),
  token: z.string().min(1, "Token không hợp lệ."),
});

export const forgotPasswordSchema = z
  .object({
    token: z.string().min(1, "Token là bắt buộc."),
    newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });
