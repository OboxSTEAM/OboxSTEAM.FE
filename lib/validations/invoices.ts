import { z } from "zod";

/** Path param for `GET /api/invoices/{id}`. */
export const invoiceIdParamSchema = z.object({
  id: z.string().uuid("ID hóa đơn không hợp lệ."),
});

/** Path param for `GET /api/invoices/by-payment/{paymentId}`. */
export const invoicePaymentIdParamSchema = z.object({
  paymentId: z.string().uuid("ID thanh toán không hợp lệ."),
});

export type InvoiceIdParam = z.infer<typeof invoiceIdParamSchema>;
export type InvoicePaymentIdParam = z.infer<typeof invoicePaymentIdParamSchema>;
