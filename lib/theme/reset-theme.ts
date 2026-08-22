import { APP_THEME_DEFAULT, APP_THEME_STORAGE_KEY } from "@/lib/theme/constants";

/** Force light mode in storage and on `<html>` (public pages stay light after logout). */
export function resetAppThemeToLight(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(APP_THEME_STORAGE_KEY, APP_THEME_DEFAULT);
  } catch {
    // Ignore private-mode / quota errors.
  }

  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = APP_THEME_DEFAULT;
}
