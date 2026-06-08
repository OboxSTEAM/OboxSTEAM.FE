/** Default minimum time a content skeleton stays visible (avoids flash on fast API). */
export const DEFAULT_MIN_SKELETON_MS = 420;

/** Wait until `minMs` has elapsed since `startedAt` (no-op if already past). */
export async function waitMinSkeleton(
  startedAt: number,
  minMs: number = DEFAULT_MIN_SKELETON_MS,
): Promise<void> {
  const remaining = Math.max(0, minMs - (Date.now() - startedAt));

  if (remaining <= 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}
