import { z } from "zod";

import { apiFetch, apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  checkoutPaymentSchema,
  paymentIdParamSchema,
} from "@/lib/validations/payments";

import {
  checkoutPaymentValueSchema,
  getPaymentByIdResponseSchema,
  type CheckoutPaymentResult,
  type GetPaymentByIdResult,
} from "./schemas";

export type {
  CheckoutPaymentResponse,
  CheckoutPaymentResult,
  GetPaymentByIdResponse,
  GetPaymentByIdResult,
} from "./schemas";

export type {
  CheckoutSession,
  Payment,
  PaymentGateway,
  PaymentStatus,
} from "@/lib/api/entities/payment";

export type CheckoutPaymentInput = z.infer<typeof checkoutPaymentSchema>;

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
