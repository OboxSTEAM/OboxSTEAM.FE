import { z } from "zod";

import { apiFetch, apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { parentCheckoutSessionSchema } from "@/lib/api/entities/payment";
import { ApiResponseError } from "@/lib/api/errors";
import { createApiValueSchema } from "@/lib/api/schemas";
import {
  checkoutPaymentSchema,
  parentCheckoutSchema,
  paymentIdParamSchema,
  requestParentPaymentSchema,
} from "@/lib/validations/payments";

import {
  checkoutPaymentValueSchema,
  getPaymentByIdResponseSchema,
  requestParentPaymentValueSchema,
  type CheckoutPaymentResult,
  type GetPaymentByIdResult,
  type ParentCheckoutResult,
  type RequestParentPaymentResult,
} from "./schemas";

const parentCheckoutPaymentValueSchema = createApiValueSchema(
  parentCheckoutSessionSchema,
);

export type {
  CheckoutPaymentResponse,
  CheckoutPaymentResult,
  GetPaymentByIdResponse,
  GetPaymentByIdResult,
  ParentCheckoutResponse,
  ParentCheckoutResult,
  RequestParentPaymentResponse,
  RequestParentPaymentResult,
} from "./schemas";

export type {
  CheckoutSession,
  ParentCheckoutSession,
  Payment,
  PaymentGateway,
  PaymentStatus,
} from "@/lib/api/entities/payment";

export type CheckoutPaymentInput = z.infer<typeof checkoutPaymentSchema>;
export type RequestParentPaymentInput = z.infer<typeof requestParentPaymentSchema>;
export type ParentCheckoutInput = z.infer<typeof parentCheckoutSchema>;

const PAYMENTS_BASE = "/api/payments";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

export const checkoutPayment = createApiPost({
  path: `${PAYMENTS_BASE}/checkout`,
  input: checkoutPaymentSchema,
  value: checkoutPaymentValueSchema,
});

export const requestParentPayment = createApiPost({
  path: `${PAYMENTS_BASE}/request-parent`,
  input: requestParentPaymentSchema,
  value: requestParentPaymentValueSchema,
});

export const parentCheckout = createApiPost({
  path: `${PAYMENTS_BASE}/parent-checkout`,
  input: parentCheckoutSchema,
  value: parentCheckoutPaymentValueSchema,
  fetchOptions: { skipAuth: true, skipRefresh: true },
});

export async function getPaymentById(id: string): Promise<GetPaymentByIdResult> {
  const { id: paymentId } = paymentIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${PAYMENTS_BASE}/${paymentId}`,
    getPaymentByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Marks payment as cancelled; returns 204 with no body (idempotent). */
export async function cancelPayment(id: string): Promise<void> {
  const { id: paymentId } = paymentIdParamSchema.parse({ id });

  await apiFetch<null>(`${PAYMENTS_BASE}/${paymentId}/cancel`, {
    method: "PATCH",
  });
}
