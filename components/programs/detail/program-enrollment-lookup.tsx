"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { useClientFetch } from "@/hooks/use-client-fetch";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getMyProgramEnrollments,
  type ProgramEnrollment,
} from "@/lib/api/program-enrollments";
import { isStudentRole } from "@/lib/auth/roles";
import {
  findEnrollmentForProgram,
  PROGRAM_DETAIL_ENROLLMENTS_LOOKUP_QUERY,
} from "@/lib/programs/enrollments";

type ProgramEnrollmentLookupContextValue = {
  enrollment: ProgramEnrollment | null;
  isLoading: boolean;
};

const ProgramEnrollmentLookupContext =
  createContext<ProgramEnrollmentLookupContextValue | null>(null);

type ProgramEnrollmentLookupProviderProps = {
  programId: string;
  children: ReactNode;
};

export function ProgramEnrollmentLookupProvider({
  programId,
  children,
}: ProgramEnrollmentLookupProviderProps) {
  const { isAuthenticated, isHydrated, isLoading, profile } = useCurrentUser();

  const canFetch =
    isHydrated && !isLoading && isAuthenticated && isStudentRole(profile?.role);

  const { data: enrollment, isLoading: isEnrollmentLoading } = useClientFetch({
    enabled: canFetch,
    minSkeletonMs: 0,
    fetcher: async () => {
      const result = await getMyProgramEnrollments(
        PROGRAM_DETAIL_ENROLLMENTS_LOOKUP_QUERY,
      );
      return findEnrollmentForProgram(result?.data?.items ?? [], programId);
    },
    deps: [programId, canFetch],
  });

  const value = useMemo(
    (): ProgramEnrollmentLookupContextValue => ({
      enrollment: canFetch ? (enrollment ?? null) : null,
      isLoading: canFetch && isEnrollmentLoading,
    }),
    [canFetch, enrollment, isEnrollmentLoading],
  );

  return (
    <ProgramEnrollmentLookupContext.Provider value={value}>
      {children}
    </ProgramEnrollmentLookupContext.Provider>
  );
}

export function useProgramEnrollmentLookup(): ProgramEnrollmentLookupContextValue {
  const context = useContext(ProgramEnrollmentLookupContext);

  if (!context) {
    throw new Error(
      "useProgramEnrollmentLookup must be used within ProgramEnrollmentLookupProvider",
    );
  }

  return context;
}
