const AUTH_STORAGE_KEY = "oboxsteam.auth";
const REMEMBER_EMAIL_KEY = "oboxsteam.rememberEmail";

export type StoredAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export function persistAuthTokens(tokens: StoredAuthTokens): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthTokens(): StoredAuthTokens | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuthTokens;
  } catch {
    return null;
  }
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
