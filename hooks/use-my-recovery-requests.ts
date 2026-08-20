"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getMyAssessmentRecoveryRequests,
  getMyClassRedeliveryRequests,
  type AssessmentRecoveryRequest,
  type ClassRedeliveryRequest,
} from "@/lib/api";

type UseMyRecoveryRequestsResult = {
  recoveryRequests: AssessmentRecoveryRequest[];
  redeliveryRequests: ClassRedeliveryRequest[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

/** Loads the student's recovery + redelivery lists; refetches on window focus. */
export function useMyRecoveryRequests(
  enabled: boolean,
): UseMyRecoveryRequestsResult {
  const [recoveryRequests, setRecoveryRequests] = useState<
    AssessmentRecoveryRequest[]
  >([]);
  const [redeliveryRequests, setRedeliveryRequests] = useState<
    ClassRedeliveryRequest[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const [recoveryResult, redeliveryResult] = await Promise.all([
        getMyAssessmentRecoveryRequests(),
        getMyClassRedeliveryRequests(),
      ]);
      setRecoveryRequests(recoveryResult?.data ?? []);
      setRedeliveryRequests(redeliveryResult?.data ?? []);
    } catch {
      // Keep stale lists; callers toast on mutation failures.
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, refresh]);

  return { recoveryRequests, redeliveryRequests, isLoading, refresh };
}
