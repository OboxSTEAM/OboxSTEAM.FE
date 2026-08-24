/**
 * Soft invalidate for manager class schedule / session lists when activity
 * DurationMinutes changes (BE rewrites linked ClassSession EndTime).
 */

type ClassSessionsInvalidateHandler = () => void | Promise<void>;

const handlers = new Set<ClassSessionsInvalidateHandler>();

export function subscribeClassSessionsInvalidate(
  handler: ClassSessionsInvalidateHandler,
): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

/** Notify open schedule/session screens to refetch. */
export function invalidateClassSessions(): void {
  for (const handler of handlers) {
    void Promise.resolve(handler()).catch(() => {
      /* Best-effort; list screens keep their last good data. */
    });
  }
}
