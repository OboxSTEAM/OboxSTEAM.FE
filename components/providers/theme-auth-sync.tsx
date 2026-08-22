"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

import {
  AUTH_SESSION_CHANGED,
  getAuthSession,
} from "@/lib/auth/session";
import { resetAppThemeToLight } from "@/lib/theme/reset-theme";

/** Reset next-themes state when the auth session is cleared (logout / token expiry). */
export function ThemeAuthSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    function syncThemeWithAuth() {
      if (getAuthSession()) return;
      resetAppThemeToLight();
      setTheme("light");
    }

    window.addEventListener(AUTH_SESSION_CHANGED, syncThemeWithAuth);
    return () =>
      window.removeEventListener(AUTH_SESSION_CHANGED, syncThemeWithAuth);
  }, [setTheme]);

  return null;
}
