/**
 * Accent- and case-insensitive form of Vietnamese text for client-side search:
 * NFD, strip combining marks, `đ` → `d`, lowercase, collapse whitespace.
 */
export function foldVietnamese(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Folded, whitespace-separated query tokens (empty array for a blank query). */
export function foldQueryTokens(query: string): string[] {
  const folded = foldVietnamese(query);
  return folded ? folded.split(" ") : [];
}

/**
 * Every query token appears somewhere in the haystack (accent-insensitive).
 * A blank query matches everything.
 */
export function matchesQuery(
  haystack: string | ReadonlyArray<string | null | undefined>,
  query: string,
): boolean {
  const tokens = foldQueryTokens(query);
  if (tokens.length === 0) return true;
  const text = foldVietnamese(
    typeof haystack === "string" ? haystack : haystack.filter(Boolean).join(" "),
  );
  return tokens.every((token) => text.includes(token));
}
