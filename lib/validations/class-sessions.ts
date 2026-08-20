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
