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
