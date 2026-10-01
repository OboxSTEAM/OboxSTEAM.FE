type ApiErrorCodeListener = () => void;

const listenersByCode = new Map<string, Set<ApiErrorCodeListener>>();

/**
 * Observe a backend error code surfaced through `showAppErrorFromUnknown`, e.g. to
 * switch a page to read-only when any save hits `CURRICULUM_LOCKED_COHORT`.
 */
export function subscribeApiErrorCode(
  code: string,
  listener: ApiErrorCodeListener,
): () => void {
  const bucket = listenersByCode.get(code) ?? new Set<ApiErrorCodeListener>();
  bucket.add(listener);
  listenersByCode.set(code, bucket);
  return () => {
    bucket.delete(listener);
    if (bucket.size === 0) listenersByCode.delete(code);
  };
}

export function emitApiErrorCode(code: string | null): void {
  if (!code) return;
  for (const listener of listenersByCode.get(code) ?? []) listener();
}
