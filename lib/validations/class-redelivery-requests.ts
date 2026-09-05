import { z } from "zod";

/** Path param for class-redelivery-request mutation routes. */
export const classRedeliveryRequestIdParamSchema = z.object({
  id: z.string().uuid("ID yêu cầu học lại lớp không hợp lệ."),
});

/** Body for `POST /api/class-redelivery-requests`. */
export const createClassRedeliveryRequestSchema = z.object({
  moduleEnrollmentId: z.string().uuid("ID ghi danh module không hợp lệ."),
  requestMessage: z.string().nullable().optional(),
});

/** Body for `POST /api/class-redelivery-requests/{id}/select-class`. */
export const selectClassRedeliveryRequestSchema = z.object({
  classId: z.string().uuid("ID lớp không hợp lệ."),
});

export type ClassRedeliveryRequestIdParam = z.infer<
  typeof classRedeliveryRequestIdParamSchema
>;
export type CreateClassRedeliveryRequestInput = z.infer<
  typeof createClassRedeliveryRequestSchema
>;
export type SelectClassRedeliveryRequestInput = z.infer<
  typeof selectClassRedeliveryRequestSchema
>;
