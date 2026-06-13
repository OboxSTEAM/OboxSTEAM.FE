import { z } from "zod";

import { paymentGatewaySchema } from "@/lib/api/entities/payment";

/** Body for `POST /api/payments/checkout`. */
export const checkoutPaymentSchema = z.object({
  programId: z.string().uuid("ID chương trình không hợp lệ."),
  gateway: paymentGatewaySchema,
});

export const paymentIdParamSchema = z.object({
  id: z.string().uuid("ID thanh toán không hợp lệ."),
});
