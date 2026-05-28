import {
  clearAuthSession,
  getAuthSession,
  persistAuthSession,
} from "@/lib/auth/session";

import { refreshTokenResponseSchema } from "../auth/schemas";
import { getApiBaseUrl } from "../config";

const AUTH_API_PREFIX = "/api/auth/";

let refreshInFlight: Promise<string | null> | null = null;

/** Bearer token from browser session (client-only). */
export function resolveBearerAuthHeaders(): Record<string, string> {
  const session = getAuthSession();
  if (!session?.accessToken) return {};
  return { Authorization: `Bearer ${session.accessToken}` };
}

export function isPublicAuthRoute(path: string): boolean {
  return path.includes(AUTH_API_PREFIX);
}

export function shouldRetryWithRefresh(
  status: number,
  path: string,
  options: { skipAuth?: boolean; skipRefresh?: boolean },
): boolean {
  return (
    status === 401 &&
    !options.skipRefresh &&
    !options.skipAuth &&
    !isPublicAuthRoute(path)
  );
}

/**
 * Exchanges the stored refresh token. Uses raw fetch (not apiFetch) to avoid
 * interceptor recursion. Concurrent 401s share one in-flight refresh.
 */
export async function refreshAuthTokens(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = getAuthSession();
    if (!session?.refreshToken) return null;

    try {
      const url = `${getApiBaseUrl()}${AUTH_API_PREFIX}refresh-token`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        json = null;
      }

      if (!response.ok) {
        clearAuthSession();
        return null;
      }

      const parsed = refreshTokenResponseSchema.parse(json);
      if (!parsed.isSuccess || parsed.value == null) {
        clearAuthSession();
        return null;
      }

      const nextSession = persistAuthSession(parsed.value.data, session.user);
      return nextSession.accessToken;
    } catch {
      clearAuthSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
