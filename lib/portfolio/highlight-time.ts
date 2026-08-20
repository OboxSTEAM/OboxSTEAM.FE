/** Format seconds as m:ss (or h:mm:ss when ≥ 1 hour) for highlight UI. */
export function formatHighlightTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const whole = Math.floor(totalSeconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Parse UI / API time into total seconds.
 * Accepts bare seconds, `m:ss[.frac]`, or `HH:MM:SS[.mmm]`.
 */
export function parseHighlightTime(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  const hms = /^(\d+):([0-5]?\d):([0-5]?\d)(?:\.(\d{1,3}))?$/.exec(trimmed);
  if (hms) {
    const hours = Number(hms[1]);
    const minutes = Number(hms[2]);
    const seconds = Number(hms[3]);
    const frac = hms[4] ? Number(`0.${hms[4]}`) : 0;
    if (![hours, minutes, seconds].every(Number.isFinite)) return null;
    return hours * 3600 + minutes * 60 + seconds + frac;
  }

  const ms = /^(\d+):([0-5]?\d)(?:\.(\d+))?$/.exec(trimmed);
  if (!ms) return null;
  const minutes = Number(ms[1]);
  const seconds = Number(ms[2]);
  const frac = ms[3] ? Number(`0.${ms[3]}`) : 0;
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  return minutes * 60 + seconds + frac;
}

/**
 * Wire time for BE trim / add-segment: `HH:MM:SS` or `HH:MM:SS.mmm`.
 */
export function toHighlightApiTime(totalSeconds: number): string {
  const wholeMs = Math.max(0, Math.round(totalSeconds * 1000));
  const hours = Math.floor(wholeMs / 3_600_000);
  const minutes = Math.floor((wholeMs % 3_600_000) / 60_000);
  const seconds = Math.floor((wholeMs % 60_000) / 1000);
  const millis = wholeMs % 1000;
  const base = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return millis > 0 ? `${base}.${String(millis).padStart(3, "0")}` : base;
}

export function msToSeconds(ms: number | null | undefined): number {
  if (ms == null || !Number.isFinite(ms)) return 0;
  return Math.max(0, ms / 1000);
}
