"use client";

import { useEffect, useRef } from "react";

import { registerMediaSyncHandler } from "@/lib/realtime/media-sync-bus";

/**
 * Subscribe to media pipeline notifications (`MediaVideoReady`, tags, failures)
 * so open galleries can refetch without waiting for the next poll tick.
 */
export function useMediaSync(
  onSync: (mediaId: string | null) => void | Promise<void>,
): void {
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    return registerMediaSyncHandler((mediaId) => onSyncRef.current(mediaId));
  }, []);
}
