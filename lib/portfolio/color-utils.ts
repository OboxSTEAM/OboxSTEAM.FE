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
