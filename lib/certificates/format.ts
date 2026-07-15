/** Public share/verify route for a certificate code. */
export function getCertificateVerifyHref(code: string): string {
  return `/certificates/verify/${encodeURIComponent(code)}`;
}

/** Formats BE issue dates (`15/06/2026 14:30:00` or ISO). */
export function formatCertificateDate(value: string | null | undefined): string {
  if (!value?.trim()) return "—";

  const trimmed = value.trim();

  // Backend example: 15/06/2026 14:30:00
  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(trimmed);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    }
  }

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(trimmed));
  } catch {
    return trimmed;
  }
}

/**
 * Prefer `skillsGained[]`; fall back to splitting `skillsAcquired` string
 * (comma / semicolon / newline).
 */
export function resolveCertificateSkills(
  skillsGained: string[] | null | undefined,
  skillsAcquired: string | null | undefined,
): string[] {
  if (skillsGained && skillsGained.length > 0) {
    return skillsGained.map((skill) => skill.trim()).filter(Boolean);
  }

  if (!skillsAcquired?.trim()) return [];

  return skillsAcquired
    .split(/[,;\n]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}
