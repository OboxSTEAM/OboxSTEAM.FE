import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Họ tên là bắt buộc."),
  phone: z.string().min(1, "Số điện thoại là bắt buộc."),
});

export const uploadAvatarSchema = z.object({
  file: z
    .instanceof(File, { message: "Vui lòng chọn ảnh đại diện." })
    .refine((file) => file.size > 0, "Tệp ảnh không hợp lệ.")
    .refine(
      (file) => file.type.startsWith("image/"),
      "Chỉ chấp nhận tệp hình ảnh (JPG, PNG, …).",
    )
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "Ảnh đại diện không được vượt quá 5 MB.",
    ),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid("User id không hợp lệ."),
});
