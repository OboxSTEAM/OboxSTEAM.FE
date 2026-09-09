import { z } from "zod";

import { programStatusSchema } from "@/lib/api/entities/program";

const nullableStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => value ?? "");

/** OpenAPI `ProgramReviewQueueItemDto` — lean queue row, not full Program. */
export const programReviewQueueItemSchema = z.object({
  id: z.string().uuid(),
  code: nullableStringSchema,
  name: nullableStringSchema,
  status: programStatusSchema,
  frameworkId: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  frameworkName: nullableStringSchema,
  expertId: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type ProgramReviewQueueItem = z.infer<typeof programReviewQueueItemSchema>;
