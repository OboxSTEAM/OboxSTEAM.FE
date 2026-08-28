"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useCurrentUser } from "@/hooks/use-current-user";
import { selectProgramClass } from "@/lib/api/programs";
import { isStudentRole } from "@/lib/auth/roles";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  clearClassHold,
  getClassHold,
  isClassHoldActive,
  saveClassHold,
  type ClassHold,
} from "@/lib/payment/seat-hold";
import { releaseProgramClassHoldOnExit } from "@/lib/payment/release-class-hold";
import {
  getPreferredClassId,
  setPreferredClassId,
} from "@/lib/programs/preferred-class";

import { useProgramEnrollmentLookup } from "./program-enrollment-lookup";

type ProgramSelectedClassContextValue = {
  selectedClassId: string | null;
  programEnrollmentId: string | null;
  holdExpiresAt: string | null;
  hasValidHold: boolean;
  isHoldExpired: boolean;
  selectingClassId: string | null;
  selectClass: (classId: string) => Promise<void>;
};

const ProgramSelectedClassContext =
  createContext<ProgramSelectedClassContextValue | null>(null);

function applyHoldState(
  hold: ClassHold | null,
): Pick<
  ProgramSelectedClassContextValue,
  "selectedClassId" | "programEnrollmentId" | "holdExpiresAt" | "hasValidHold"
> {
  if (!hold) {
    return {
      selectedClassId: null,
      programEnrollmentId: null,
      holdExpiresAt: null,
      hasValidHold: false,
    };
  }

  const active = isClassHoldActive(hold);
  return {
    selectedClassId: hold.classId,
    programEnrollmentId: active ? hold.programEnrollmentId : null,
    holdExpiresAt: hold.holdExpiresAt || null,
    hasValidHold: active,
  };
}

export function ProgramSelectedClassProvider({
  programId,
  children,
}: {
  programId: string;
  children: React.ReactNode;
}) {
  const { isAuthenticated, isHydrated, profile } = useCurrentUser();
  const { enrollment, refresh: refreshEnrollment } = useProgramEnrollmentLookup();
  const isStudent =
    isHydrated && isAuthenticated && isStudentRole(profile?.role);

  const [hold, setHold] = useState<ClassHold | null>(null);
  const [selectingClassId, setSelectingClassId] = useState<string | null>(null);
  const selectGenerationRef = useRef(0);

  const holdState = useMemo(() => applyHoldState(hold), [hold]);
  const isHoldExpired = Boolean(
    hold?.holdExpiresAt && !holdState.hasValidHold,
  );

  useLayoutEffect(() => {
    setHold(null);
    setSelectingClassId(null);
    selectGenerationRef.current += 1;
  }, [programId]);

  useEffect(() => {
    const stored = getClassHold(programId);
    const preferred = getPreferredClassId(programId);

    if (stored && isClassHoldActive(stored)) {
      setHold(stored);
      return;
    }

    if (stored) {
      clearClassHold(programId);
    }

    if (preferred) {
      setHold({
        classId: preferred,
        holdExpiresAt: "",
        programEnrollmentId: "",
      });
    } else {
      setHold(null);
    }
  }, [programId]);

  useEffect(() => {
    if (!hold?.holdExpiresAt || holdState.hasValidHold) return;
    clearClassHold(programId);
  }, [hold?.holdExpiresAt, holdState.hasValidHold, programId]);

  useEffect(() => {
    if (!isStudent) return;

    const onPageHide = () => {
      void releaseProgramClassHoldOnExit(programId, { keepalive: true });
    };

    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      void releaseProgramClassHoldOnExit(programId);
    };
  }, [isStudent, programId]);

  const selectClass = useCallback(
    async (classId: string) => {
      setPreferredClassId(programId, classId);

      if (!isStudent) {
        setHold({
          classId,
          holdExpiresAt: "",
          programEnrollmentId: "",
        });
        return;
      }

      if (
        hold &&
        isClassHoldActive(hold) &&
        hold.classId === classId &&
        hold.programEnrollmentId
      ) {
        return;
      }

      if (
        enrollment?.status === "Active" ||
        enrollment?.status === "Completed"
      ) {
        showAppErrorFromUnknown(
          new Error("Bạn đã ghi danh chương trình này."),
          "programs.selectClass",
        );
        return;
      }

      const generation = ++selectGenerationRef.current;
      setSelectingClassId(classId);

      try {
        const result = await selectProgramClass(programId, { classId });
        if (generation !== selectGenerationRef.current) return;

        const session = result?.data;
        if (!session) {
          throw new Error("Không nhận được thông tin giữ ghế.");
        }

        const nextHold: ClassHold = {
          classId: session.classId,
          holdExpiresAt: session.holdExpiresAt,
          programEnrollmentId: session.programEnrollmentId,
        };
        setHold(nextHold);
        saveClassHold(programId, nextHold);
        refreshEnrollment();
      } catch (error) {
        if (generation !== selectGenerationRef.current) return;

        clearClassHold(programId);
        setHold({
          classId,
          holdExpiresAt: "",
          programEnrollmentId: "",
        });

        showAppErrorFromUnknown(error, "programs.selectClass");
        throw error;
      } finally {
        if (generation === selectGenerationRef.current) {
          setSelectingClassId(null);
        }
      }
    },
    [enrollment?.status, hold, isStudent, programId, refreshEnrollment],
  );

  const value = useMemo<ProgramSelectedClassContextValue>(
    () => ({
      ...holdState,
      isHoldExpired,
      selectingClassId,
      selectClass,
    }),
    [holdState, isHoldExpired, selectClass, selectingClassId],
  );

  return (
    <ProgramSelectedClassContext.Provider value={value}>
      {children}
    </ProgramSelectedClassContext.Provider>
  );
}

export function useProgramSelectedClass(): ProgramSelectedClassContextValue {
  const context = useContext(ProgramSelectedClassContext);
  if (!context) {
    throw new Error(
      "useProgramSelectedClass must be used within ProgramSelectedClassProvider",
    );
  }
  return context;
}

export function useOptionalProgramSelectedClass():
  | ProgramSelectedClassContextValue
  | null {
  return useContext(ProgramSelectedClassContext);
}
