import { z } from "zod";

export const requestParentLinkSchema = z.object({
  parentEmail: z.email("Email phụ huynh không hợp lệ."),
});

/** Body for `POST /api/parent/magic-login` (from email magic link). */
export const parentMagicLoginSchema = z.object({
  email: z.email("Email không hợp lệ."),
  token: z.string().min(1, "Token không hợp lệ."),
});

/** Query params from parent magic link (`?email=…&token=…`). */
export const parentMagicLoginLinkParamsSchema = z.object({
  email: z.email("Email không hợp lệ."),
  token: z.string().min(1, "Token không hợp lệ."),
});

export const completeParentProfileSchema = z.object({
  fullName: z.string().min(1, "Họ tên là bắt buộc."),
  phone: z.string().min(1, "Số điện thoại là bắt buộc."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
});

export const approveParentLinkSchema = z.object({
  token: z.string().min(1, "Token là bắt buộc."),
});
