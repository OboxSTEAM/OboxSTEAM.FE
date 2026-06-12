import { z } from "zod";

/** Path param for `GET /api/experts/{expertId}`. */
export const expertIdParamSchema = z.object({
  expertId: z.string().uuid("ID chuyên gia không hợp lệ."),
});

export type ExpertIdParam = z.infer<typeof expertIdParamSchema>;
