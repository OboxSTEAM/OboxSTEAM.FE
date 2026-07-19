/** Parse `#RRGGBB` / `#RGB` into RGB channels. */
export function parseHexColor(
  hex: string,
): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function toHex(channel: number): string {
  return Math.max(0, Math.min(255, Math.round(channel)))
    .toString(16)
    .padStart(2, "0");
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Normalize any color string to `#RRGGBB` when possible. */
export function normalizeHexColor(
  value: string | null | undefined,
  fallback = "#2D2D2D",
): string {
  if (!value) return fallback;
  const parsed = parseHexColor(value);
  if (!parsed) return fallback;
  return rgbToHex(parsed.r, parsed.g, parsed.b);
}

export type HsvColor = { h: number; s: number; v: number };

export function rgbToHsv(r: number, g: number, b: number): HsvColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      default:
        h = ((rn - gn) / d + 4) * 60;
        break;
    }
  }

  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

export function hsvToRgb(
  h: number,
  s: number,
  v: number,
): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;

  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hh < 60) {
    rp = c;
    gp = x;
  } else if (hh < 120) {
    rp = x;
    gp = c;
  } else if (hh < 180) {
    gp = c;
    bp = x;
  } else if (hh < 240) {
    gp = x;
    bp = c;
  } else if (hh < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

export function hexToHsv(hex: string): HsvColor {
  const rgb = parseHexColor(hex) ?? { r: 45, g: 45, b: 45 };
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

export function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

/** Linear mix of two hex colors (`t` = weight of `b`). */
export function mixHex(a: string, b: string, t: number): string {
  const left = parseHexColor(a);
  const right = parseHexColor(b);
  if (!left || !right) return a;
  const w = Math.max(0, Math.min(1, t));
  return `#${toHex(left.r + (right.r - left.r) * w)}${toHex(left.g + (right.g - left.g) * w)}${toHex(left.b + (right.b - left.b) * w)}`;
}

/**
 * Derive secondary / accent companions from a single primary so the
 * whole portfolio palette shifts when the user picks one theme color.
 */
export function deriveCompanionColors(primary: string): {
  secondary: string;
  accent: string;
} {
  return {
    secondary: mixHex(primary, "#4FC3F7", 0.48),
    accent: mixHex(primary, "#7E57C2", 0.42),
  };
}

function srgbChannelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance for `#RRGGBB`. */
export function relativeLuminance(hex: string): number {
  const rgb = parseHexColor(hex);
  if (!rgb) return 0;
  const r = srgbChannelToLinear(rgb.r);
  const g = srgbChannelToLinear(rgb.g);
  const b = srgbChannelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors (1–21). */
export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const DEFAULT_DARK_TEXT = "#1a1a1a";
const DEFAULT_LIGHT_TEXT = "#FAFAF5";

/**
 * Pick dark or light text for a filled background so buttons/badges
 * stay readable on both light and dark portfolio presets (e.g. cyan
 * primary on Neo Lab must not use white text).
 */
export function getReadableTextColor(
  background: string,
  options?: { dark?: string; light?: string },
): string {
  const dark = options?.dark ?? DEFAULT_DARK_TEXT;
  const light = options?.light ?? DEFAULT_LIGHT_TEXT;
  const bg = normalizeHexColor(background, "#2D2D2D");
  const darkContrast = contrastRatio(bg, dark);
  const lightContrast = contrastRatio(bg, light);
  return lightContrast >= darkContrast ? light : dark;
}
