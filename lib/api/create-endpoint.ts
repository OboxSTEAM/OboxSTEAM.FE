import { z } from "zod";

import { apiFetchParsed, assertApiSuccess, type ApiFetchOptions } from "./client";
import { createApiResponseSchema } from "./schemas";

type CreateApiPostOptions<TInput extends z.ZodType, TValue extends z.ZodType> = {
  path: string;
  input: TInput;
  value: TValue;
  fetchOptions?: Omit<ApiFetchOptions, "method" | "body">;
};

/**
 * Factory for POST endpoints that share the `{ isSuccess, value, error }` envelope.
 * Prefer explicit `apiFetchParsed` when the route is GET/PATCH or needs custom handling.
 */
export function createApiPost<TInput extends z.ZodType, TValue extends z.ZodType>(
  opts: CreateApiPostOptions<TInput, TValue>,
) {
  const responseSchema = createApiResponseSchema(opts.value);

  return async (input: z.infer<TInput>): Promise<z.infer<TValue>> => {
    const body = opts.input.parse(input);
    const response = await apiFetchParsed(opts.path, responseSchema, {
      method: "POST",
      body,
      ...opts.fetchOptions,
    });
    assertApiSuccess(response);
    return response.value;
  };
}
