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

/** Body for `POST /api/class-redelivery-requests/{id}/assign-target`. */
export const assignTargetClassRedeliveryRequestSchema = z.object({
  targetClassId: z.string().uuid("ID lớp đích không hợp lệ."),
  decisionNote: z.string().nullable().optional(),
});

/** Body for `POST /api/class-redelivery-requests/{id}/reject`. */
export const rejectClassRedeliveryRequestSchema = z.object({
  decisionNote: z.string().nullable().optional(),
});

export type ClassRedeliveryRequestIdParam = z.infer<
  typeof classRedeliveryRequestIdParamSchema
>;
export type CreateClassRedeliveryRequestInput = z.infer<
  typeof createClassRedeliveryRequestSchema
>;
export type AssignTargetClassRedeliveryRequestInput = z.infer<
  typeof assignTargetClassRedeliveryRequestSchema
>;
export type RejectClassRedeliveryRequestInput = z.infer<
  typeof rejectClassRedeliveryRequestSchema
>;
