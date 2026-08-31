import { z } from "zod";

export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid("ID buổi học không hợp lệ."),
});

/** Body for `POST /api/class-sessions/{id}/checkin` — exactly one field. */
export const studentSessionCheckinSchema = z
  .object({
    token: z.string().uuid().optional(),
    code: z
      .string()
      .trim()
      .max(6, "Mã check-in tối đa 6 ký tự.")
      .optional(),
  })
  .superRefine((value, ctx) => {
    const hasToken = Boolean(value.token);
    const hasCode = Boolean(value.code?.length);
    if (hasToken === hasCode) {
      ctx.addIssue({
        code: "custom",
        message: "Gửi token hoặc mã 6 số, không gửi cả hai.",
        path: ["token"],
      });
    }
  });

export type StudentSessionCheckinInput = z.infer<
  typeof studentSessionCheckinSchema
>;

const SESSION_EVIDENCE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

/** Path params for `DELETE /api/class-sessions/{id}/evidence/{mediaId}`. */
export const sessionEvidenceMediaParamSchema = z.object({
  sessionId: z.string().uuid("ID buổi học không hợp lệ."),
  mediaId: z.string().uuid("ID minh chứng không hợp lệ."),
});

/** Multipart body for `POST /api/class-sessions/{id}/evidence`. */
export const uploadSessionEvidenceSchema = z.object({
  file: z
    .instanceof(File, { message: "Vui lòng chọn ảnh minh chứng." })
    .refine((file) => file.size > 0, "Tệp ảnh không hợp lệ.")
    .refine(
      (file) =>
        SESSION_EVIDENCE_IMAGE_TYPES.has(file.type.toLowerCase()) ||
        /\.(jpe?g|png)$/i.test(file.name),
      "Chỉ chấp nhận ảnh JPG hoặc PNG.",
    )
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "Ảnh minh chứng không được vượt quá 10 MB.",
    ),
});

export type SessionEvidenceMediaParam = z.infer<
  typeof sessionEvidenceMediaParamSchema
>;
