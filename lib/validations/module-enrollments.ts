import { z } from "zod";

/** Path param for `/api/module-enrollments/{moduleEnrollmentId}` routes. */
export const moduleEnrollmentIdParamSchema = z.object({
  moduleEnrollmentId: z.string().uuid("ID đăng ký module không hợp lệ."),
});

export type ModuleEnrollmentIdParam = z.infer<typeof moduleEnrollmentIdParamSchema>;
