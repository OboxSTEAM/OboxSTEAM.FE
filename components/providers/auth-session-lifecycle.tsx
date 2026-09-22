"use client";

import { useEffect, useRef } from "react";

import {
  ACCESS_TOKEN_REFRESH_SKEW_MS,
  ensureFreshAccessToken,
  isStoredAccessTokenFresh,
} from "@/lib/auth/access-token";
import { readJwtExpMs } from "@/lib/auth/jwt-payload";
import {
  AUTH_SESSION_CHANGED,
  AUTH_SESSION_EXPIRED,
  getAuthSession,
} from "@/lib/auth/session";
import { restartSyncHubIfActive } from "@/lib/realtime/sync-hub-connection";

/** Re-check while the tab is visible so a throttled timer cannot miss the 30-minute access TTL. */
const SESSION_HEARTBEAT_MS = 15_000;

const AUTH_ENTRY_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
  "/magic-login",
  "/approve-link",
];

function clearScheduledRefresh(
  timerRef: React.RefObject<ReturnType<typeof setTimeout> | null>,
): void {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

function isAuthEntryPath(pathname: string): boolean {
  return AUTH_ENTRY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function redirectToLogin(): void {
  const { pathname, search } = window.location;
  if (isAuthEntryPath(pathname)) return;

  const returnUrl = `${pathname}${search}`;
  window.location.replace(
    `/login?returnUrl=${encodeURIComponent(returnUrl)}`,
  );
}

function scheduleProactiveRefresh(
  accessToken: string,
  timerRef: React.RefObject<ReturnType<typeof setTimeout> | null>,
): void {
  clearScheduledRefresh(timerRef);

  const expMs = readJwtExpMs(accessToken);
  if (expMs == null) return;

  const delay = expMs - ACCESS_TOKEN_REFRESH_SKEW_MS - Date.now();
  const runRefresh = () => {
    void ensureFreshAccessToken().then((token) => {
      if (token) restartSyncHubIfActive();
    });
  };

  if (delay <= 0) {
    runRefresh();
    return;
  }

  timerRef.current = setTimeout(runRefresh, delay);
}

/**
 * Keeps the access JWT fresh while the tab is open.
 * Login tokens last 30 minutes; refresh issues a 1-hour access token and a 7-day refresh token.
 * When the refresh token itself is rejected, the tab is sent to login.
 */
export function AuthSessionLifecycle({
  children,
}: {
  children: React.ReactNode;
}) {
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let redirecting = false;

    const refreshIfNeeded = () => {
      const session = getAuthSession();
      if (!session?.accessToken || !session.refreshToken) return;
      if (isStoredAccessTokenFresh()) return;

      void ensureFreshAccessToken().then((token) => {
        if (token) restartSyncHubIfActive();
      });
    };

    const syncSession = () => {
      const session = getAuthSession();
      if (!session?.accessToken) {
        clearScheduledRefresh(refreshTimerRef);
        return;
      }

      scheduleProactiveRefresh(session.accessToken, refreshTimerRef);
      refreshIfNeeded();
    };

    const onExpired = () => {
      if (redirecting) return;
      redirecting = true;
      redirectToLogin();
    };

    syncSession();
    window.addEventListener(AUTH_SESSION_CHANGED, syncSession);
    window.addEventListener(AUTH_SESSION_EXPIRED, onExpired);

    const heartbeat = window.setInterval(refreshIfNeeded, SESSION_HEARTBEAT_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      refreshIfNeeded();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", refreshIfNeeded);
    window.addEventListener("online", refreshIfNeeded);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED, syncSession);
      window.removeEventListener(AUTH_SESSION_EXPIRED, onExpired);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", refreshIfNeeded);
      window.removeEventListener("online", refreshIfNeeded);
      window.clearInterval(heartbeat);
      clearScheduledRefresh(refreshTimerRef);
    };
  }, []);

  return children;
}
