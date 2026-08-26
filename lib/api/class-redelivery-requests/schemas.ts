import { z } from "zod";

import {
  classRedeliveryCandidateSchema,
  classRedeliveryRequestSchema,
} from "@/lib/api/entities/class-redelivery-request";
import {
  openRemedialClassResultSchema,
  redeliveryWaitlistProgramGroupSchema,
} from "@/lib/api/entities/redelivery-waitlist";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const classRedeliveryRequestValueSchema = createApiValueSchema(
  classRedeliveryRequestSchema,
);
export const classRedeliveryRequestListValueSchema = createApiValueSchema(
  z.array(classRedeliveryRequestSchema).nullable(),
);
export const classRedeliveryCandidateListValueSchema = createApiValueSchema(
  z.array(classRedeliveryCandidateSchema).nullable(),
);
export const redeliveryWaitlistValueSchema = createApiValueSchema(
  z.array(redeliveryWaitlistProgramGroupSchema).nullable(),
);
export const openRemedialClassValueSchema = createApiValueSchema(
  openRemedialClassResultSchema,
);

export const createClassRedeliveryRequestResponseSchema = createApiResponseSchema(
  classRedeliveryRequestValueSchema,
);
export const getMyClassRedeliveryRequestsResponseSchema = createApiResponseSchema(
  classRedeliveryRequestListValueSchema,
);
export const getPendingManagerClassRedeliveryRequestsResponseSchema =
  createApiResponseSchema(classRedeliveryRequestListValueSchema);
export const getClassRedeliveryCandidatesResponseSchema = createApiResponseSchema(
  classRedeliveryCandidateListValueSchema,
);
export const withdrawClassRedeliveryRequestResponseSchema =
  createApiResponseSchema(classRedeliveryRequestValueSchema);
export const selectClassRedeliveryRequestResponseSchema = createApiResponseSchema(
  classRedeliveryRequestValueSchema,
);
export const acceptIntensiveClassRedeliveryRequestResponseSchema =
  createApiResponseSchema(classRedeliveryRequestValueSchema);
export const declineIntensiveClassRedeliveryRequestResponseSchema =
  createApiResponseSchema(classRedeliveryRequestValueSchema);
export const assignTargetClassRedeliveryRequestResponseSchema =
  createApiResponseSchema(classRedeliveryRequestValueSchema);
export const rejectClassRedeliveryRequestResponseSchema = createApiResponseSchema(
  classRedeliveryRequestValueSchema,
);
export const getManagerRedeliveryWaitlistResponseSchema = createApiResponseSchema(
  redeliveryWaitlistValueSchema,
);
export const openRemedialClassResponseSchema = createApiResponseSchema(
  openRemedialClassValueSchema,
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
export type GetClassRedeliveryCandidatesResponse = z.infer<
  typeof getClassRedeliveryCandidatesResponseSchema
>;
export type WithdrawClassRedeliveryRequestResponse = z.infer<
  typeof withdrawClassRedeliveryRequestResponseSchema
>;
export type SelectClassRedeliveryRequestResponse = z.infer<
  typeof selectClassRedeliveryRequestResponseSchema
>;
export type AcceptIntensiveClassRedeliveryRequestResponse = z.infer<
  typeof acceptIntensiveClassRedeliveryRequestResponseSchema
>;
export type DeclineIntensiveClassRedeliveryRequestResponse = z.infer<
  typeof declineIntensiveClassRedeliveryRequestResponseSchema
>;
export type AssignTargetClassRedeliveryRequestResponse = z.infer<
  typeof assignTargetClassRedeliveryRequestResponseSchema
>;
export type RejectClassRedeliveryRequestResponse = z.infer<
  typeof rejectClassRedeliveryRequestResponseSchema
>;
export type GetManagerRedeliveryWaitlistResponse = z.infer<
  typeof getManagerRedeliveryWaitlistResponseSchema
>;
export type OpenRemedialClassResponse = z.infer<
  typeof openRemedialClassResponseSchema
>;

export type CreateClassRedeliveryRequestResult =
  CreateClassRedeliveryRequestResponse["value"];
export type GetMyClassRedeliveryRequestsResult =
  GetMyClassRedeliveryRequestsResponse["value"];
export type GetPendingManagerClassRedeliveryRequestsResult =
  GetPendingManagerClassRedeliveryRequestsResponse["value"];
export type GetClassRedeliveryCandidatesResult =
  GetClassRedeliveryCandidatesResponse["value"];
export type WithdrawClassRedeliveryRequestResult =
  WithdrawClassRedeliveryRequestResponse["value"];
export type SelectClassRedeliveryRequestResult =
  SelectClassRedeliveryRequestResponse["value"];
export type AcceptIntensiveClassRedeliveryRequestResult =
  AcceptIntensiveClassRedeliveryRequestResponse["value"];
export type DeclineIntensiveClassRedeliveryRequestResult =
  DeclineIntensiveClassRedeliveryRequestResponse["value"];
export type AssignTargetClassRedeliveryRequestResult =
  AssignTargetClassRedeliveryRequestResponse["value"];
export type RejectClassRedeliveryRequestResult =
  RejectClassRedeliveryRequestResponse["value"];
export type GetManagerRedeliveryWaitlistResult =
  GetManagerRedeliveryWaitlistResponse["value"];
export type OpenRemedialClassResultValue = OpenRemedialClassResponse["value"];
