/** Format seconds as mm:ss for highlight trim/segment UI. */
export function formatHighlightTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const whole = Math.floor(totalSeconds);
  const minutes = Math.floor(whole / 60);
  const seconds = whole % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Parse mm:ss or bare seconds into total seconds. */
export function parseHighlightTime(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  const match = /^(\d+):([0-5]?\d)(?:\.(\d+))?$/.exec(trimmed);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  return minutes * 60 + seconds;
}

/** Wire time string for BE (seconds as decimal string). */
export function toHighlightApiTime(totalSeconds: number): string {
  return String(Math.max(0, Math.round(totalSeconds * 1000) / 1000));
}

export function msToSeconds(ms: number | null | undefined): number {
  if (ms == null || !Number.isFinite(ms)) return 0;
  return Math.max(0, ms / 1000);
}
