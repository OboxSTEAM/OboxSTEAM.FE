type MediaSyncHandler = (mediaId: string | null) => void | Promise<void>;

const handlers = new Set<MediaSyncHandler>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const MEDIA_SYNC_DEBOUNCE_MS = 800;

/** Register a silent media gallery/detail refetch handler. */
export function registerMediaSyncHandler(handler: MediaSyncHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

function runHandlers(mediaId: string | null): void {
  for (const handler of handlers) {
    void Promise.resolve(handler(mediaId)).catch(() => {
      /* Best-effort refresh. */
    });
  }
}

/**
 * Notify open media screens that a media asset finished processing (or failed).
 * Pass `null` to refresh all open galleries.
 */
export function dispatchMediaSyncEvent(mediaId: string | null): void {
  if (handlers.size === 0) return;

  const key = mediaId ?? "*";
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);

  debounceTimers.set(
    key,
    setTimeout(() => {
      debounceTimers.delete(key);
      runHandlers(mediaId);
    }, MEDIA_SYNC_DEBOUNCE_MS),
  );
}

export function flushAllMediaSyncHandlers(): void {
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();
  runHandlers(null);
}
