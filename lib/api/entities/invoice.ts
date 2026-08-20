import { z } from "zod";

/**
 * `InvoiceResponseDto` from Invoice APIs.
 * Retake invoices include `moduleId`; program enrollments set `programId`.
 */
export const invoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string().nullable(),
  paymentId: z.string().uuid(),
  paymentCode: z.string().nullable(),
  programId: z.string().uuid(),
  moduleId: z.string().uuid().nullable(),
  issuedToId: z.string().uuid(),
  billingName: z.string().nullable(),
  billingEmail: z.string().nullable(),
  itemDescription: z.string().nullable(),
  subTotal: z.number(),
  totalAmount: z.number(),
  currency: z.string().nullable(),
  createdAt: z.string(),
});

export type Invoice = z.infer<typeof invoiceSchema>;
