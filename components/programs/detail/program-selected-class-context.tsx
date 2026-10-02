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
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/hooks/use-current-user";
import { selectProgramClass } from "@/lib/api/programs";
import { isStudentRole } from "@/lib/auth/roles";
import { showAppErrorFromUnknown, subscribeApiErrorCode } from "@/lib/errors";
import {
  clearClassHold,
  getClassHold,
  getHoldRemainingMs,
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
  /** Cancel before Stripe redirect — frees the seat server-side immediately. */
  releaseHold: () => Promise<void>;
  /** Increments after a hold is released server-side (expiry or cancel) — refetch seat counts. */
  holdReleaseCount: number;
};

const ProgramSelectedClassContext =
  createContext<ProgramSelectedClassContextValue | null>(null);

function applyHoldState(
  hold: ClassHold | null,
  now: number,
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

  const active = isClassHoldActive(hold, now);
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
  const router = useRouter();
  const { isAuthenticated, isHydrated, profile } = useCurrentUser();
  const { enrollment, refresh: refreshEnrollment } = useProgramEnrollmentLookup();
  const isStudent =
    isHydrated && isAuthenticated && isStudentRole(profile?.role);

  const [hold, setHold] = useState<ClassHold | null>(null);
  const [selectingClassId, setSelectingClassId] = useState<string | null>(null);
  const selectGenerationRef = useRef(0);
  /** Avoid putting enrollment in effect deps (would release mid-checkout). */
  const shouldForceReleaseRef = useRef(false);

  /** Re-evaluated by the expiry timer — `hasValidHold` must flip without user input. */
  const [now, setNow] = useState(() => Date.now());
  const [hasExpiredNotice, setHasExpiredNotice] = useState(false);
  const [holdReleaseCount, setHoldReleaseCount] = useState(0);

  const holdState = useMemo(() => applyHoldState(hold, now), [hold, now]);
  /** Completed (not superseded) may rebuy; only a live or superseded attempt blocks select-class. */
  const blocksClassSelection =
    enrollment?.status === "Active" ||
    (enrollment?.status === "Completed" && enrollment.isSuperseded);
  const isHoldExpired =
    hasExpiredNotice ||
    Boolean(hold?.holdExpiresAt && !holdState.hasValidHold);

  shouldForceReleaseRef.current =
    enrollment?.status === "PendingPayment" ||
    Boolean(hold?.programEnrollmentId?.trim()) ||
    Boolean(getClassHold(programId)?.programEnrollmentId?.trim());

  useLayoutEffect(() => {
    setHold(null);
    setSelectingClassId(null);
    setHasExpiredNotice(false);
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
      // Local hold expired — still release BE PendingPayment (do not orphan).
      void releaseProgramClassHoldOnExit(programId);
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
    if (!isStudent) return;

    const onPageHide = () => {
      void releaseProgramClassHoldOnExit(programId, {
        keepalive: true,
        forceRelease: shouldForceReleaseRef.current,
      });
    };

    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      void releaseProgramClassHoldOnExit(programId, {
        forceRelease: shouldForceReleaseRef.current,
      });
    };
  }, [isStudent, programId]);

  useEffect(
    () =>
      subscribeApiErrorCode("PROGRAM_NOT_AVAILABLE", () => {
        selectGenerationRef.current += 1;
        clearClassHold(programId);
        setHold(null);
        setSelectingClassId(null);
        setHoldReleaseCount((count) => count + 1);
        refreshEnrollment();
        router.refresh();
      }),
    [programId, refreshEnrollment, router],
  );

  useEffect(() => {
    if (!hold?.holdExpiresAt) return;
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      getHoldRemainingMs(hold.holdExpiresAt) + 250,
    );
    return () => window.clearTimeout(timer);
  }, [hold?.holdExpiresAt]);

  useEffect(() => {
    if (!hold?.holdExpiresAt || holdState.hasValidHold) return;

    let cancelled = false;
    void releaseProgramClassHoldOnExit(programId, {
      forceRelease: Boolean(hold.programEnrollmentId?.trim()),
    }).then(() => {
      if (cancelled) return;
      setHold(null);
      setHasExpiredNotice(true);
      setHoldReleaseCount((count) => count + 1);
      refreshEnrollment();
    });

    return () => {
      cancelled = true;
    };
  }, [
    hold?.holdExpiresAt,
    hold?.programEnrollmentId,
    holdState.hasValidHold,
    programId,
    refreshEnrollment,
  ]);

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

      if (blocksClassSelection) {
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
        setHasExpiredNotice(false);
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
    [blocksClassSelection, hold, isStudent, programId, refreshEnrollment],
  );

  const releaseHold = useCallback(async () => {
    selectGenerationRef.current += 1;
    setSelectingClassId(null);
    setHold(null);
    await releaseProgramClassHoldOnExit(programId, { forceRelease: true });
    setHoldReleaseCount((count) => count + 1);
    refreshEnrollment();
  }, [programId, refreshEnrollment]);

  const value = useMemo<ProgramSelectedClassContextValue>(
    () => ({
      ...holdState,
      isHoldExpired,
      selectingClassId,
      selectClass,
      releaseHold,
      holdReleaseCount,
    }),
    [
      holdReleaseCount,
      holdState,
      isHoldExpired,
      releaseHold,
      selectClass,
      selectingClassId,
    ],
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
