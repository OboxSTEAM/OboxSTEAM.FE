import { z } from "zod";

import {
  checkoutSessionSchema,
  paymentSchema,
} from "@/lib/api/entities/payment";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const checkoutPaymentValueSchema = createApiValueSchema(checkoutSessionSchema);
export const paymentDetailValueSchema = createApiValueSchema(paymentSchema);
export const requestParentPaymentValueSchema = createApiValueSchema(z.null());

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
  checkoutPaymentValueSchema,
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
