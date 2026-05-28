import { z } from "zod";

import { getApiBaseUrl } from "./config";
import { ApiRequestError, ApiResponseError } from "./errors";
import {
  refreshAuthTokens,
  resolveBearerAuthHeaders,
  shouldRetryWithRefresh,
} from "./interceptors";
import type { ApiEnvelope } from "./schemas";

export { getApiBaseUrl } from "./config";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Do not attach Authorization from session storage */
  skipAuth?: boolean;
  /** Do not attempt refresh + retry on 401 */
  skipRefresh?: boolean;
};

async function executeRequest(
  path: string,
  options: ApiFetchOptions,
): Promise<{ response: Response; json: unknown }> {
  const { body, headers, skipAuth, ...rest } = options;
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const authHeaders = skipAuth ? {} : resolveBearerAuthHeaders();

  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
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

  return { response, json };
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  let { response, json } = await executeRequest(path, options);

  if (shouldRetryWithRefresh(response.status, path, options)) {
    const newAccessToken = await refreshAuthTokens();
    if (newAccessToken) {
      ({ response, json } = await executeRequest(path, {
        ...options,
        skipRefresh: true,
      }));
    }
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
