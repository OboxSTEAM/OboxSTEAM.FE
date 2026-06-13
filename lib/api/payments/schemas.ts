import { z } from "zod";

import {
  checkoutSessionSchema,
  paymentSchema,
} from "@/lib/api/entities/payment";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const checkoutPaymentValueSchema = createApiValueSchema(checkoutSessionSchema);
export const paymentDetailValueSchema = createApiValueSchema(paymentSchema);

export const checkoutPaymentResponseSchema = createApiResponseSchema(
  checkoutPaymentValueSchema,
);
export const getPaymentByIdResponseSchema = createApiResponseSchema(
  paymentDetailValueSchema,
);

export type CheckoutPaymentResponse = z.infer<typeof checkoutPaymentResponseSchema>;
export type GetPaymentByIdResponse = z.infer<typeof getPaymentByIdResponseSchema>;

export type CheckoutPaymentResult = CheckoutPaymentResponse["value"];
export type GetPaymentByIdResult = GetPaymentByIdResponse["value"];
