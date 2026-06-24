"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getEnrollmentCurriculum,
  getProgramEnrollmentsByStudentId,
  type EnrollmentCurriculum,
  type ProgramEnrollment,
} from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { resolveInitialActivityId } from "@/lib/curriculum/helpers";
import { showAppErrorFromUnknown } from "@/lib/errors";

import { CurriculumShell } from "./curriculum-shell";

type CurriculumLearnContentProps = {
  programId: string;
};

const ENROLLMENT_GATE_STATUSES = new Set<ProgramEnrollment["status"]>([
  "Active",
  "Completed",
]);

function LearnSkeleton() {
  return (
    <div className="learn-shell min-h-dvh animate-pulse bg-learn-bg pt-[4.5rem] sm:pt-20">
      <div className="h-[4.5rem] border-b border-learn-border bg-learn-surface sm:h-20" />
      <div className="grid lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="hidden h-[calc(100dvh-4.5rem)] bg-learn-surface-2/60 sm:h-[calc(100dvh-5rem)] lg:block" />
        <div className="m-4 h-[70vh] rounded-2xl bg-learn-surface-2/60" />
      </div>
    </div>
  );
}

export function CurriculumLearnContent({ programId }: CurriculumLearnContentProps) {
  const router = useRouter();
  const { profile, isAuthenticated, isHydrated, isLoading: isUserLoading } = useCurrentUser();
  const [curriculum, setCurriculum] = useState<EnrollmentCurriculum | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCurriculum = useCallback(
    async (enrollmentId: string, seedActivityId?: string | null) => {
      const result = await getEnrollmentCurriculum(enrollmentId);
      if (!result?.data) {
        throw new Error("Enrollment curriculum response missing data.");
      }
      const nextCurriculum = result.data;
      setCurriculum(nextCurriculum);
      setSelectedActivityId((current) => {
        if (seedActivityId) return seedActivityId;
        if (current && resolveInitialActivityId(nextCurriculum) === current) return current;
        return resolveInitialActivityId(nextCurriculum);
      });
      return nextCurriculum;
    },
    [],
  );

  useEffect(() => {
    if (!isHydrated || isUserLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!profile?.id) return;

    let cancelled = false;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setLoadError(null);

      try {
        const enrollmentsResult = await getProgramEnrollmentsByStudentId(profile.id, {
          page: 1,
          pageSize: 50,
        });

        if (!enrollmentsResult?.data) {
          throw new Error("Program enrollments response missing data.");
        }

        const enrollment = enrollmentsResult.data.items.find(
          (item) =>
            item.programId === programId && ENROLLMENT_GATE_STATUSES.has(item.status),
        );

        if (!enrollment) {
          router.replace(`/programs/${programId}`);
          return;
        }

        if (cancelled) return;

        await loadCurriculum(enrollment.id);
      } catch (error) {
        if (cancelled) return;
        showAppErrorFromUnknown(error, "generic");
        setLoadError("Không tải được nội dung học. Vui lòng thử lại.");
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    isHydrated,
    isUserLoading,
    loadCurriculum,
    profile?.id,
    programId,
    router,
  ]);

  const handleCurriculumRefresh = useCallback(async () => {
    if (!curriculum) return;
    await loadCurriculum(curriculum.enrollmentId, selectedActivityId);
  }, [curriculum, loadCurriculum, selectedActivityId]);

  if (!isHydrated || isUserLoading || isBootstrapping) {
    return <LearnSkeleton />;
  }

  if (loadError) {
    return (
      <div className="learn-shell flex min-h-dvh items-center justify-center bg-learn-bg px-4 pt-[4.5rem] sm:pt-20">
        <div className="max-w-md rounded-2xl border border-learn-border bg-learn-surface p-6 text-center shadow-sm">
          <p className="font-heading text-lg font-semibold text-learn-text-strong">
            Không mở được trang học
          </p>
          <p className="mt-2 text-sm text-learn-muted">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return <LearnSkeleton />;
  }

  return (
    <CurriculumShell
      curriculum={curriculum}
      selectedActivityId={selectedActivityId}
      onSelectActivity={setSelectedActivityId}
      onCurriculumRefresh={handleCurriculumRefresh}
    />
  );
}
