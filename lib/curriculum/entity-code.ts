/** Prefixes for manager curriculum entity codes. */
export type EntityCodePrefix = "PRG" | "MOD" | "CRS" | "ACT" | "ASG";

const CODE_SLUG_MAX = 24;

/**
 * Build a stable, API-friendly code from a display name.
 * Vietnamese diacritics are stripped; spaces become hyphens.
 */
export function slugifyEntityName(name: string, maxLen = CODE_SLUG_MAX): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
  return slug;
}

/** `MOD-ECOLOGY-STUDIO` — empty name yields `MOD` only (caller may show placeholder). */
export function generateEntityCode(
  prefix: EntityCodePrefix,
  name: string,
): string {
  const slug = slugifyEntityName(name.trim());
  return slug ? `${prefix}-${slug}` : prefix;
}

/** Side-by-side name + mã when the name is short enough to leave room. */
export const SHORT_ENTITY_NAME_CHARS = 28;

export function isShortEntityName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= SHORT_ENTITY_NAME_CHARS;
}
