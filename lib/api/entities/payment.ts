import { z } from "zod";

export const paymentGatewaySchema = z.enum(["Stripe", "MoMo"]);

export const paymentStatusSchema = z.enum([
  "Pending",
  "Success",
  "Cancelled",
  "Failed",
]);

/** Seat hold metadata returned by checkout / request-parent (5-minute window). */
export const paymentSeatHoldSchema = z.object({
  classId: z.string().uuid(),
  holdExpiresAt: z.string(),
});

/** Student checkout — `checkoutUrl` is null when the program is free (enrolled immediately). */
export const checkoutSessionSchema = paymentSeatHoldSchema.extend({
  paymentId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  checkoutUrl: z.string().url().nullable(),
  accessToken: z.string().nullable().optional(),
});

/** Parent payment request — email link holds the selected class seat. */
export const requestParentPaymentSessionSchema = paymentSeatHoldSchema;

/** Parent email-link checkout — includes short-lived access for post-Stripe receipt. */
export const parentCheckoutSessionSchema = z.object({
  paymentId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  checkoutUrl: z.string().url(),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
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
export type PaymentSeatHold = z.infer<typeof paymentSeatHoldSchema>;
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;
export type RequestParentPaymentSession = z.infer<
  typeof requestParentPaymentSessionSchema
>;
export type ParentCheckoutSession = z.infer<typeof parentCheckoutSessionSchema>;
export type Payment = z.infer<typeof paymentSchema>;
