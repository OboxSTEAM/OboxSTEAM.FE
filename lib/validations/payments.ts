import { z } from "zod";

import { paymentGatewaySchema } from "@/lib/api/entities/payment";

/** Body for `POST /api/payments/checkout`. */
export const checkoutPaymentSchema = z.object({
  programId: z.string().uuid("ID chương trình không hợp lệ."),
  gateway: paymentGatewaySchema,
});

/** Body for `POST /api/payments/request-parent`. */
export const requestParentPaymentSchema = z.object({
  programId: z.string().uuid("ID chương trình không hợp lệ."),
  parentId: z.string().uuid("ID phụ huynh không hợp lệ."),
});

/** Body for `POST /api/payments/parent-checkout`. */
export const parentCheckoutSchema = z.object({
  token: z.string().min(1, "Token không hợp lệ."),
  gateway: paymentGatewaySchema,
});

/** Query params from parent payment email (`?token=…`). */
export const parentCheckoutLinkParamsSchema = z.object({
  token: z.string().min(1, "Token không hợp lệ."),
});

export const paymentIdParamSchema = z.object({
  id: z.string().uuid("ID thanh toán không hợp lệ."),
});
