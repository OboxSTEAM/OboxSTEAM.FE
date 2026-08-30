import { refreshAuthTokens } from "@/lib/api/interceptors/auth";
import { isAccessTokenExpired } from "@/lib/auth/jwt-payload";
import { getAuthSession } from "@/lib/auth/session";

/** Default skew — refresh ~60s before the 30-minute access JWT expires. */
export const ACCESS_TOKEN_REFRESH_SKEW_MS = 60_000;

export function getStoredAccessToken(): string | null {
  return getAuthSession()?.accessToken ?? null;
}

export function isStoredAccessTokenFresh(
  skewMs = ACCESS_TOKEN_REFRESH_SKEW_MS,
): boolean {
  const token = getStoredAccessToken();
  if (!token) return false;
  return !isAccessTokenExpired(token, skewMs);
}

/**
 * Return a valid access token, refreshing proactively when near expiry.
 * Returns null when unauthenticated or refresh definitively failed.
 */
export async function ensureFreshAccessToken(
  skewMs = ACCESS_TOKEN_REFRESH_SKEW_MS,
): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const session = getAuthSession();
  if (!session?.accessToken) return null;
  if (!isAccessTokenExpired(session.accessToken, skewMs)) {
    return session.accessToken;
  }
  if (!session.refreshToken) return null;

  return refreshAuthTokens();
}

/**
 * SignalR negotiate token — valid JWT, refreshed when stale, or empty for
 * anonymous public sync when unauthenticated / refresh unavailable.
 */
export async function resolveHubAccessToken(
  skewMs = ACCESS_TOKEN_REFRESH_SKEW_MS,
): Promise<string> {
  if (typeof window === "undefined") return "";

  const session = getAuthSession();
  if (!session?.accessToken) return "";
  if (!isAccessTokenExpired(session.accessToken, skewMs)) {
    return session.accessToken;
  }
  if (!session.refreshToken) return "";

  const refreshed = await ensureFreshAccessToken(skewMs);
  return refreshed ?? "";
}
