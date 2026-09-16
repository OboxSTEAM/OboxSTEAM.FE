import { z } from "zod";

import {
  checkoutSessionSchema,
  parentCheckoutSessionSchema,
  paymentSchema,
  requestParentPaymentSessionSchema,
} from "@/lib/api/entities/payment";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const checkoutPaymentValueSchema = createApiValueSchema(checkoutSessionSchema);
export const parentCheckoutPaymentValueSchema = createApiValueSchema(
  parentCheckoutSessionSchema,
);
export const paymentDetailValueSchema = createApiValueSchema(paymentSchema);
// BE (ObjectApiResult) returns `data: null` for request-parent — the email is the
// side effect; seat-hold data is only documented on checkout. Nullable avoids a
// Zod parse failure on the success path (email sent but error toast shown).
export const requestParentPaymentValueSchema = createApiValueSchema(
  requestParentPaymentSessionSchema.nullable(),
);

export const checkoutPaymentResponseSchema = createApiResponseSchema(
  checkoutPaymentValueSchema,
);
export const getPaymentByIdResponseSchema = createApiResponseSchema(
  paymentDetailValueSchema,
);
export const requestParentPaymentResponseSchema = createApiResponseSchema(
  requestParentPaymentValueSchema,
);
export const parentCheckoutResponseSchema = createApiResponseSchema(
  parentCheckoutPaymentValueSchema,
);

export type CheckoutPaymentResponse = z.infer<typeof checkoutPaymentResponseSchema>;
export type GetPaymentByIdResponse = z.infer<typeof getPaymentByIdResponseSchema>;
export type RequestParentPaymentResponse = z.infer<
  typeof requestParentPaymentResponseSchema
>;
export type ParentCheckoutResponse = z.infer<typeof parentCheckoutResponseSchema>;

export type CheckoutPaymentResult = CheckoutPaymentResponse["value"];
export type GetPaymentByIdResult = GetPaymentByIdResponse["value"];
export type RequestParentPaymentResult = RequestParentPaymentResponse["value"];
export type ParentCheckoutResult = ParentCheckoutResponse["value"];
