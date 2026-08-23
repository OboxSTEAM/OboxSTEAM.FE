import { z } from "zod";

export const apiErrorSchema = z
  .object({
    /** OpenAPI marks these nullable — tolerate null from BE serializers. */
    code: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    message: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
  })
  .passthrough();

export type ApiError = z.infer<typeof apiErrorSchema>;

export function createApiValueSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    code: z
      .string()
      .nullish()
      .transform((value) => value ?? "OK"),
    message: z
      .string()
      .nullish()
      .transform((value) => value ?? ""),
    data: dataSchema,
  });
}

export const apiValueMessageOnlySchema = z.object({
  code: z
    .string()
    .nullish()
    .transform((value) => value ?? "OK"),
  message: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
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
