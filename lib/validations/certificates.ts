import { z } from "zod";

/** Path param for `GET /api/certificates/{id}`. */
export const certificateIdParamSchema = z.object({
  id: z.string().uuid("ID chứng chỉ không hợp lệ."),
});

/** Path param for enrollment-scoped certificate routes. */
export const programEnrollmentIdParamSchema = z.object({
  programEnrollmentId: z.string().uuid("ID ghi danh chương trình không hợp lệ."),
});

/** Path param for `GET /api/certificates/verify/{code}`. */
export const certificateCodeParamSchema = z.object({
  code: z.string().min(1, "Mã chứng chỉ không hợp lệ."),
});

export type CertificateIdParam = z.infer<typeof certificateIdParamSchema>;
export type ProgramEnrollmentIdParam = z.infer<
  typeof programEnrollmentIdParamSchema
>;
export type CertificateCodeParam = z.infer<typeof certificateCodeParamSchema>;
