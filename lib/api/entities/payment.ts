import { z } from "zod";

export const paymentGatewaySchema = z.enum(["Stripe", "MoMo"]);

export const paymentStatusSchema = z.enum([
  "Pending",
  "Success",
  "Cancelled",
  "Failed",
]);

export const checkoutSessionSchema = z.object({
  paymentId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  checkoutUrl: z.string().url(),
});

export const paymentSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  studentId: z.string().uuid(),
  paidById: z.string().uuid(),
  programEnrollmentId: z.string().uuid(),
  amount: z.number(),
  currency: z.string(),
  gateway: paymentGatewaySchema,
  transactionId: z.string().nullable(),
  checkoutSessionId: z.string(),
  status: paymentStatusSchema,
  paidAt: z.string().nullable(),
  createdAt: z.string(),
});

export type PaymentGateway = z.infer<typeof paymentGatewaySchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;
export type Payment = z.infer<typeof paymentSchema>;
