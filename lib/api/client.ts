import { z } from "zod";

import { env } from "@/lib/env";

import { ApiRequestError, ApiResponseError } from "./errors";
import type { ApiEnvelope } from "./schemas";

export function getApiBaseUrl(): string {
  return env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw new ApiRequestError(
      `Request failed with status ${response.status}`,
      response.status,
      json,
    );
  }

  return json as T;
}

export async function apiFetchParsed<T extends z.ZodType>(
  path: string,
  schema: T,
  options: ApiFetchOptions = {},
): Promise<z.infer<T>> {
  const json = await apiFetch<unknown>(path, options);
  return schema.parse(json);
}

export function assertApiSuccess<T>(
  response: ApiEnvelope<T>,
): asserts response is ApiEnvelope<T> & { isSuccess: true; value: T } {
  if (!response.isSuccess || response.value == null) {
    const err = response.error;
    throw new ApiResponseError(
      err?.message ?? "Request failed.",
      err?.code,
      response.error,
    );
  }
}
