import { z } from "zod";

import { invoiceSchema } from "@/lib/api/entities/invoice";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const invoicesListValueSchema = createApiValueSchema(
  z.array(invoiceSchema).nullable(),
);
export const invoiceDetailValueSchema = createApiValueSchema(invoiceSchema);

export const getMyInvoicesResponseSchema = createApiResponseSchema(
  invoicesListValueSchema,
);
export const getInvoiceByIdResponseSchema = createApiResponseSchema(
  invoiceDetailValueSchema,
);
export const getInvoiceByPaymentIdResponseSchema = createApiResponseSchema(
  invoiceDetailValueSchema,
);

export type GetMyInvoicesResponse = z.infer<typeof getMyInvoicesResponseSchema>;
export type GetInvoiceByIdResponse = z.infer<typeof getInvoiceByIdResponseSchema>;
export type GetInvoiceByPaymentIdResponse = z.infer<
  typeof getInvoiceByPaymentIdResponseSchema
>;

export type GetMyInvoicesResult = GetMyInvoicesResponse["value"];
export type GetInvoiceByIdResult = GetInvoiceByIdResponse["value"];
export type GetInvoiceByPaymentIdResult = GetInvoiceByPaymentIdResponse["value"];
