/**
 * Portfolio item date helpers — BE uses `dd/MM/yyyy HH:mm:ss`
 * (example: `15/06/2026 14:30:00`). Native date inputs use `yyyy-MM-dd`.
 */

const BE_DATE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/;

/** Parse BE or ISO date string into a local Date, or null. */
export function parsePortfolioItemDate(
  value: string | null | undefined,
): Date | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();

  const slash = BE_DATE_RE.exec(trimmed);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = Number(slash[3]);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const iso = new Date(trimmed);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

/** `yyyy-MM-dd` for `<input type="date">`. */
export function toDateInputValue(value: string | null | undefined): string {
  const date = parsePortfolioItemDate(value);
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Convert `yyyy-MM-dd` → BE `dd/MM/yyyy 00:00:00` (or null when empty). */
export function fromDateInputValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${d}/${m}/${y} 00:00:00`;
}

/** Short display for card/review meta (e.g. `15 thg 6 2026`). */
export function formatPortfolioItemDate(
  value: string | null | undefined,
): string | null {
  const date = parsePortfolioItemDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** `Jun 2025 – Dec 2025` style range, or single date. */
export function formatPortfolioItemDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string | null {
  const start = formatPortfolioItemDate(startDate);
  const end = formatPortfolioItemDate(endDate);
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}
