"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getProgramOpenClasses,
  type OpenEnrollmentClass,
} from "@/lib/api";
import { getPreferredClassId } from "@/lib/programs/preferred-class";

type UseProgramOpenClassesResult = {
  classes: OpenEnrollmentClass[];
  isLoading: boolean;
  hasError: boolean;
  hasOpenSeats: boolean;
  refresh: (preferredClassId?: string | null) => Promise<OpenEnrollmentClass[]>;
};

/**
 * Public open-class preview for a program.
 * Pass `preferredClassId` to soft-sort (post-pay); omit to use localStorage preference.
 */
export function useProgramOpenClasses(
  programId: string,
  options?: { preferredClassId?: string | null; enabled?: boolean },
): UseProgramOpenClassesResult {
  const enabled = options?.enabled ?? true;
  const [classes, setClasses] = useState<OpenEnrollmentClass[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [hasError, setHasError] = useState(false);

  const refresh = useCallback(
    async (preferredClassId?: string | null) => {
      if (!enabled) return [];
      setIsLoading(true);
      setHasError(false);
      try {
        const preferred =
          preferredClassId !== undefined
            ? preferredClassId
            : getPreferredClassId(programId);
        const result = await getProgramOpenClasses(programId, {
          preferredClassId: preferred,
        });
        const next = result?.data ?? [];
        setClasses(next);
        return next;
      } catch {
        setClasses([]);
        setHasError(true);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, programId],
  );

  useEffect(() => {
    if (!enabled) {
      setClasses([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }
    void refresh(options?.preferredClassId);
  }, [enabled, options?.preferredClassId, refresh]);

  return {
    classes,
    isLoading,
    hasError,
    hasOpenSeats: classes.length > 0,
    refresh,
  };
}
