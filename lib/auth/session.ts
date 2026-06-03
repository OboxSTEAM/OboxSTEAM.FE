import { clearParentProfilePending } from "@/lib/auth/parent-profile";

const AUTH_STORAGE_KEY = "oboxsteam.auth";
const REMEMBER_EMAIL_KEY = "oboxsteam.rememberEmail";

export const AUTH_SESSION_CHANGED = "oboxsteam:auth-session-changed";

export type StoredAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type StoredAuthUser = {
  email: string;
  code?: string;
  displayName?: string;
  avatarUrl?: string | null;
  /** Cached from profile for header/nav before `/api/account/me` finishes. */
  role?: string;
};

export type StoredAuthSession = StoredAuthTokens & {
  user?: StoredAuthUser;
};

export function notifyAuthSessionChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED));
}

export function persistAuthSession(
  tokens: StoredAuthTokens,
  user?: StoredAuthUser,
): StoredAuthSession {
  const session: StoredAuthSession = { ...tokens, ...(user ? { user } : {}) };
  if (typeof window !== "undefined") {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    notifyAuthSessionChanged();
  }
  return session;
}

/** @deprecated Use persistAuthSession */
export function persistAuthTokens(
  tokens: StoredAuthTokens,
  user?: StoredAuthUser,
): void {
  persistAuthSession(tokens, user);
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  clearParentProfilePending();
  notifyAuthSessionChanged();
}

/** @deprecated Use clearAuthSession */
export function clearAuthTokens(): void {
  clearAuthSession();
}

export function getAuthSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuthSession;
  } catch {
    return null;
  }
}

/** @deprecated Use getAuthSession */
export function getAuthTokens(): StoredAuthTokens | null {
  return getAuthSession();
}

export function persistRememberedEmail(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBER_EMAIL_KEY, email);
}

export function getRememberedEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REMEMBER_EMAIL_KEY);
}

export function clearRememberedEmail(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REMEMBER_EMAIL_KEY);
}
