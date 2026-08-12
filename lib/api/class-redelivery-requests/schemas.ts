import { z } from "zod";

import { classRedeliveryRequestSchema } from "@/lib/api/entities/class-redelivery-request";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const classRedeliveryRequestValueSchema = createApiValueSchema(
  classRedeliveryRequestSchema,
);
export const classRedeliveryRequestListValueSchema = createApiValueSchema(
  z.array(classRedeliveryRequestSchema).nullable(),
);

export const createClassRedeliveryRequestResponseSchema = createApiResponseSchema(
  classRedeliveryRequestValueSchema,
);
export const getMyClassRedeliveryRequestsResponseSchema = createApiResponseSchema(
  classRedeliveryRequestListValueSchema,
);
export const getPendingManagerClassRedeliveryRequestsResponseSchema =
  createApiResponseSchema(classRedeliveryRequestListValueSchema);
export const withdrawClassRedeliveryRequestResponseSchema =
  createApiResponseSchema(classRedeliveryRequestValueSchema);
export const assignTargetClassRedeliveryRequestResponseSchema =
  createApiResponseSchema(classRedeliveryRequestValueSchema);
export const rejectClassRedeliveryRequestResponseSchema = createApiResponseSchema(
  classRedeliveryRequestValueSchema,
);

export type CreateClassRedeliveryRequestResponse = z.infer<
  typeof createClassRedeliveryRequestResponseSchema
>;
export type GetMyClassRedeliveryRequestsResponse = z.infer<
  typeof getMyClassRedeliveryRequestsResponseSchema
>;
export type GetPendingManagerClassRedeliveryRequestsResponse = z.infer<
  typeof getPendingManagerClassRedeliveryRequestsResponseSchema
>;
export type WithdrawClassRedeliveryRequestResponse = z.infer<
  typeof withdrawClassRedeliveryRequestResponseSchema
>;
export type AssignTargetClassRedeliveryRequestResponse = z.infer<
  typeof assignTargetClassRedeliveryRequestResponseSchema
>;
export type RejectClassRedeliveryRequestResponse = z.infer<
  typeof rejectClassRedeliveryRequestResponseSchema
>;

export type CreateClassRedeliveryRequestResult =
  CreateClassRedeliveryRequestResponse["value"];
export type GetMyClassRedeliveryRequestsResult =
  GetMyClassRedeliveryRequestsResponse["value"];
export type GetPendingManagerClassRedeliveryRequestsResult =
  GetPendingManagerClassRedeliveryRequestsResponse["value"];
export type WithdrawClassRedeliveryRequestResult =
  WithdrawClassRedeliveryRequestResponse["value"];
export type AssignTargetClassRedeliveryRequestResult =
  AssignTargetClassRedeliveryRequestResponse["value"];
export type RejectClassRedeliveryRequestResult =
  RejectClassRedeliveryRequestResponse["value"];
