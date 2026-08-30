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
  getAuthSession,
} from "@/lib/auth/session";
import { restartSyncHubIfActive } from "@/lib/realtime/sync-hub-connection";

function clearScheduledRefresh(
  timerRef: React.RefObject<ReturnType<typeof setTimeout> | null>,
): void {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
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
 * Keeps the access JWT fresh while the tab is open — timer before exp and on
 * tab focus — so idle sessions survive the 30-minute access TTL via refresh.
 */
export function AuthSessionLifecycle({
  children,
}: {
  children: React.ReactNode;
}) {
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const syncSession = () => {
      const session = getAuthSession();
      if (!session?.accessToken) {
        clearScheduledRefresh(refreshTimerRef);
        return;
      }

      scheduleProactiveRefresh(session.accessToken, refreshTimerRef);

      if (!isStoredAccessTokenFresh()) {
        void ensureFreshAccessToken().then((token) => {
          if (token) restartSyncHubIfActive();
        });
      }
    };

    syncSession();
    window.addEventListener(AUTH_SESSION_CHANGED, syncSession);

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (!getAuthSession()?.refreshToken) return;

      void ensureFreshAccessToken().then((token) => {
        if (token) restartSyncHubIfActive();
      });
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED, syncSession);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearScheduledRefresh(refreshTimerRef);
    };
  }, []);

  return children;
}
