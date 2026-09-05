import { z } from "zod";

import { classRedeliveryRequestSchema } from "@/lib/api/entities/class-redelivery-request";
import { rebuyClassCatalogSchema } from "@/lib/api/entities/rebuy-class-catalog";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const classRedeliveryRequestValueSchema = createApiValueSchema(
  classRedeliveryRequestSchema,
);
export const classRedeliveryRequestListValueSchema = createApiValueSchema(
  z.array(classRedeliveryRequestSchema).nullable(),
);
export const rebuyClassCatalogValueSchema = createApiValueSchema(
  rebuyClassCatalogSchema,
);

export const createClassRedeliveryRequestResponseSchema = createApiResponseSchema(
  classRedeliveryRequestValueSchema,
);
export const getMyClassRedeliveryRequestsResponseSchema = createApiResponseSchema(
  classRedeliveryRequestListValueSchema,
);
/** Candidates now return the shared `RebuyClassCatalogDto`. */
export const getClassRedeliveryCandidatesResponseSchema = createApiResponseSchema(
  rebuyClassCatalogValueSchema,
);
export const cancelClassRedeliveryRequestResponseSchema = createApiResponseSchema(
  classRedeliveryRequestValueSchema,
);
/** @deprecated Prefer `cancelClassRedeliveryRequestResponseSchema` — `/withdraw` is an alias of `/cancel`. */
export const withdrawClassRedeliveryRequestResponseSchema =
  cancelClassRedeliveryRequestResponseSchema;
export const selectClassRedeliveryRequestResponseSchema = createApiResponseSchema(
  classRedeliveryRequestValueSchema,
);

export type CreateClassRedeliveryRequestResponse = z.infer<
  typeof createClassRedeliveryRequestResponseSchema
>;
export type GetMyClassRedeliveryRequestsResponse = z.infer<
  typeof getMyClassRedeliveryRequestsResponseSchema
>;
export type GetClassRedeliveryCandidatesResponse = z.infer<
  typeof getClassRedeliveryCandidatesResponseSchema
>;
export type CancelClassRedeliveryRequestResponse = z.infer<
  typeof cancelClassRedeliveryRequestResponseSchema
>;
export type WithdrawClassRedeliveryRequestResponse =
  CancelClassRedeliveryRequestResponse;
export type SelectClassRedeliveryRequestResponse = z.infer<
  typeof selectClassRedeliveryRequestResponseSchema
>;

export type CreateClassRedeliveryRequestResult =
  CreateClassRedeliveryRequestResponse["value"];
export type GetMyClassRedeliveryRequestsResult =
  GetMyClassRedeliveryRequestsResponse["value"];
export type GetClassRedeliveryCandidatesResult =
  GetClassRedeliveryCandidatesResponse["value"];
export type CancelClassRedeliveryRequestResult =
  CancelClassRedeliveryRequestResponse["value"];
export type WithdrawClassRedeliveryRequestResult =
  CancelClassRedeliveryRequestResult;
export type SelectClassRedeliveryRequestResult =
  SelectClassRedeliveryRequestResponse["value"];
