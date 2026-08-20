import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  invoiceIdParamSchema,
  invoicePaymentIdParamSchema,
} from "@/lib/validations/invoices";

import {
  getInvoiceByIdResponseSchema,
  getInvoiceByPaymentIdResponseSchema,
  getMyInvoicesResponseSchema,
  type GetInvoiceByIdResult,
  type GetInvoiceByPaymentIdResult,
  type GetMyInvoicesResult,
} from "./schemas";

export type {
  GetInvoiceByIdResponse,
  GetInvoiceByIdResult,
  GetInvoiceByPaymentIdResponse,
  GetInvoiceByPaymentIdResult,
  GetMyInvoicesResponse,
  GetMyInvoicesResult,
} from "./schemas";

export type { Invoice } from "@/lib/api/entities/invoice";

export type {
  InvoiceIdParam,
  InvoicePaymentIdParam,
} from "@/lib/validations/invoices";

const INVOICES_BASE = "/api/invoices";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** `GET /api/invoices/my` — student/parent invoices, newest first. */
export async function getMyInvoices(): Promise<GetMyInvoicesResult> {
  const response = await apiFetchParsed(
    `${INVOICES_BASE}/my`,
    getMyInvoicesResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/invoices/{id}` — invoice detail by invoice ID. */
export async function getInvoiceById(id: string): Promise<GetInvoiceByIdResult> {
  const { id: invoiceId } = invoiceIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${INVOICES_BASE}/${invoiceId}`,
    getInvoiceByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `GET /api/invoices/by-payment/{paymentId}`
 * Invoice created after a successful payment (404 if not confirmed yet).
 */
export async function getInvoiceByPaymentId(
  paymentId: string,
): Promise<GetInvoiceByPaymentIdResult> {
  const { paymentId: parsedPaymentId } = invoicePaymentIdParamSchema.parse({
    paymentId,
  });

  const response = await apiFetchParsed(
    `${INVOICES_BASE}/by-payment/${parsedPaymentId}`,
    getInvoiceByPaymentIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
