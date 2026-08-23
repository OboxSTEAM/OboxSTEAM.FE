"use client";

import { useEffect, useState } from "react";

import {
  getLiveJoinState,
  type LiveJoinSessionInput,
  type LiveJoinState,
} from "@/lib/classes/session-helpers";

/** Ticks every second so join phase / countdown stay in sync with curriculum. */
export function useLiveJoinState(
  session: LiveJoinSessionInput | null | undefined,
): LiveJoinState | null {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  if (!session) return null;
  return getLiveJoinState(session, now);
}
