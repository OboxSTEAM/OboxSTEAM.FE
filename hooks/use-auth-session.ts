"use client";

import { useEffect, useState } from "react";

import {
  AUTH_SESSION_CHANGED,
  getAuthSession,
  type StoredAuthSession,
} from "@/lib/auth/session";

export function useAuthSession() {
  const [session, setSession] = useState<StoredAuthSession | null>(null);
  /** False until client has read sessionStorage (avoids false "logged out" on first paint). */
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setSession(getAuthSession());

    sync();
    setIsHydrated(true);
    window.addEventListener(AUTH_SESSION_CHANGED, sync);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED, sync);
  }, []);

  return {
    session,
    isHydrated,
    isAuthenticated: Boolean(session?.accessToken),
  };
}
