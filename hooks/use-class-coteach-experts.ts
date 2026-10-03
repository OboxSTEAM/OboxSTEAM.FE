"use client";

import { useMemo } from "react";

import { useClientFetch } from "@/hooks/use-client-fetch";
import type { ClassSession } from "@/lib/api/entities/class-session";
import {
  groupCoTeachExpertsByActivity,
  loadAcceptedCoTeachExperts,
  type CoTeachExpertFace,
} from "@/lib/curriculum/coteach-experts";

export function useClassCoTeachExperts(
  classId: string | null | undefined,
  sessions: ClassSession[],
) {
  const { data, isLoading } = useClientFetch({
    enabled: Boolean(classId),
    fetcher: async () => {
      if (!classId) return [];
      return loadAcceptedCoTeachExperts(classId);
    },
    deps: [classId],
    minSkeletonMs: 0,
    onError: () => undefined,
  });

  const expertsByActivityId = useMemo(
    () => groupCoTeachExpertsByActivity(data ?? [], sessions),
    [data, sessions],
  );

  return {
    expertsByActivityId,
    isLoading,
  };
}

export type { CoTeachExpertFace };
