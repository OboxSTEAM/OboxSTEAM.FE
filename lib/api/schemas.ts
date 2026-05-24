import { z } from "zod";

export const apiErrorSchema = z
  .object({
    code: z.string().optional(),
    message: z.string().optional(),
  })
  .passthrough();

export type ApiError = z.infer<typeof apiErrorSchema>;

export function createApiValueSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    code: z.string(),
    message: z.string(),
    data: dataSchema,
  });
}

export const apiValueMessageOnlySchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type ApiEnvelope<TValue> = {
  isSuccess: boolean;
  value: TValue | null;
  error: ApiError | null;
};

export function createApiResponseSchema<T extends z.ZodType>(valueSchema: T) {
  return z.object({
    isSuccess: z.boolean(),
    value: valueSchema.nullable(),
    error: apiErrorSchema.nullable(),
  }) as unknown as z.ZodType<ApiEnvelope<z.infer<T>>>;
}
