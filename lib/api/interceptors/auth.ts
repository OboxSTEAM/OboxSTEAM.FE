import { expireAuthSession, getAuthSession, persistAuthSession } from "@/lib/auth/session";
import type { StoredAuthTokens } from "@/lib/auth/session";

import { getApiBaseUrl } from "../config";

const AUTH_API_PREFIX = "/api/auth/";

let refreshInFlight: Promise<string | null> | null = null;

function isDefinitiveRefreshFailure(status: number): boolean {
  return status === 400 || status === 401;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

/**
 * Refresh returns the same envelope as login (`value.data`), but the new
 * refresh token may be omitted. Keep the stored 7-day refresh token in that case.
 * A strict Zod parse used to reject the whole body and leave the expired access token in place.
 */
function readIssuedTokens(
  json: unknown,
  fallbackRefreshToken: string,
): StoredAuthTokens | null {
  const root = asRecord(json);
  if (!root || root.isSuccess !== true) return null;

  const value = asRecord(root.value);
  if (!value) return null;

  const data = asRecord(value.data) ?? value;
  const accessToken = readNonEmptyString(data.accessToken);
  if (!accessToken) return null;

  const refreshToken =
    readNonEmptyString(data.refreshToken) ?? fallbackRefreshToken;
  if (!refreshToken) return null;

  return { accessToken, refreshToken };
}

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
 * interceptor recursion. Concurrent refresh attempts share one in-flight call.
 */
export async function refreshAuthTokens(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = getAuthSession();
    if (!session?.refreshToken) {
      if (session?.accessToken) expireAuthSession();
      return null;
    }

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
        if (isDefinitiveRefreshFailure(response.status)) {
          expireAuthSession();
        }
        return null;
      }

      const issued = readIssuedTokens(json, session.refreshToken);
      if (!issued) {
        expireAuthSession();
        return null;
      }

      const nextSession = persistAuthSession(issued, session.user);
      return nextSession.accessToken;
    } catch {
      /* Transient network failure — keep session so a later retry can succeed. */
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
