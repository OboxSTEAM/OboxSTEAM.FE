"use client";

import { useEffect, useState } from "react";

import {
  joinAdvisorySync,
  leaveAdvisorySync,
} from "@/lib/realtime/program-sync-membership";
import { acquireSyncHub } from "@/lib/realtime/sync-hub-connection";

/**
 * Hold advisory group membership for the lifetime of a page that renders the chat
 * sidebar (collapsed or open). Membership is presence: the BE suppresses chat
 * notifications while joined. Re-join after reconnect is handled by the hub.
 */
export function useAdvisoryPresence(
  programId: string | null | undefined,
  enabled = true,
): { isJoined: boolean } {
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (!enabled || !programId) return;

    let isActive = true;
    const releaseHub = acquireSyncHub();
    void joinAdvisorySync(programId).then((joined) => {
      if (isActive) setIsJoined(joined);
    });

    return () => {
      isActive = false;
      setIsJoined(false);
      leaveAdvisorySync(programId);
      releaseHub();
    };
  }, [enabled, programId]);

  return { isJoined };
}
