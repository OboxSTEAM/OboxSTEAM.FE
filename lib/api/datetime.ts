/**
 * Shared API datetime helpers.
 * Backend may return ISO (`2026-07-16T09:00:00Z`) or legacy (`15/06/2026 14:30:00`).
 */

const LEGACY_API =
  /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Parse API datetime into a Date (local semantics for legacy strings). */
export function parseApiDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;

  const legacy = value.trim().match(LEGACY_API);
  if (legacy) {
    const [, dd, mm, yyyy, hh, min, ss] = legacy;
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss ?? "0"),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
