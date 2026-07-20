"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ClassPickerDialog } from "@/components/classes/class-picker-dialog";
import { Button } from "@/components/ui/button";
import {
  getClassSessions,
  getClassWithStudents,
  getEnrollmentCurriculum,
  getProgramEnrollmentClass,
  getUserProfileById,
  type EnrollmentCurriculum,
  type ProgramEnrollment,
  type UserProfile,
} from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { CLASS_SESSIONS_QUERY } from "@/lib/classes/constants";
import { resolveActiveProgramEnrollment } from "@/lib/curriculum/active-enrollment";
import { findFlatAssignment } from "@/lib/curriculum/assignment-helpers";
import type { CurriculumClassContext } from "@/lib/curriculum/class-context";
import {
  findFlatActivity,
  resolveInitialActivityId,
} from "@/lib/curriculum/helpers";
import { showAppErrorFromUnknown } from "@/lib/errors";

import { CurriculumShell } from "./curriculum-shell";

type CurriculumLearnContentProps = {
  programId: string;
};

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

function buildClassContext(
  classWithStudentsResult: Awaited<ReturnType<typeof getClassWithStudents>>,
  sessionsResult: Awaited<ReturnType<typeof getClassSessions>>,
  mentor: UserProfile | null,
): CurriculumClassContext | null {
  const classWithStudents = classWithStudentsResult?.data;
  if (!classWithStudents) return null;

  return {
    classId: classWithStudents.id,
    classCode: classWithStudents.code,
    className: classWithStudents.name,
    seatsTaken: classWithStudents.seatsTaken,
    maxCapacity: classWithStudents.maxCapacity,
    mentor,
    roster: classWithStudents.students,
    sessions: sessionsResult?.data?.items ?? [],
  };
}

async function loadMentorProfile(mentorId: string): Promise<UserProfile | null> {
  try {
    const result = await getUserProfileById(mentorId);
    return result?.data ?? null;
  } catch {
    return null;
  }
}

function applyCurriculumSelection(
  nextCurriculum: EnrollmentCurriculum,
  seed: {
    activityId?: string | null;
    assignmentId?: string | null;
  },
): {
  activityId: string | null;
  assignmentId: string | null;
} {
  if (seed.assignmentId && findFlatAssignment(nextCurriculum, seed.assignmentId)) {
    return { activityId: null, assignmentId: seed.assignmentId };
  }

  if (seed.activityId && findFlatActivity(nextCurriculum, seed.activityId)) {
    return { activityId: seed.activityId, assignmentId: null };
  }

  return {
    activityId: resolveInitialActivityId(nextCurriculum),
    assignmentId: null,
  };
}

export function CurriculumLearnContent({ programId }: CurriculumLearnContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seedActivityId = searchParams.get("activityId");
  const seedAssignmentId = searchParams.get("assignmentId");
  const initialView =
    searchParams.get("view") === "mind-map" ? "mind-map" : "content";
  const { isAuthenticated, isHydrated, isLoading: isUserLoading } = useCurrentUser();
  const [curriculum, setCurriculum] = useState<EnrollmentCurriculum | null>(null);
  const [classContext, setClassContext] = useState<CurriculumClassContext | null>(null);
  const [enrollment, setEnrollment] = useState<ProgramEnrollment | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);

  const loadCurriculum = useCallback(
    async (
      enrollmentId: string,
      seed?: { activityId?: string | null; assignmentId?: string | null },
    ) => {
      const result = await getEnrollmentCurriculum(enrollmentId);
      if (!result?.data) {
        throw new Error("Enrollment curriculum response missing data.");
      }
      const nextCurriculum = result.data;
      setCurriculum(nextCurriculum);

      const selection = applyCurriculumSelection(nextCurriculum, {
        activityId: seed?.activityId,
        assignmentId: seed?.assignmentId,
      });
      setSelectedActivityId(selection.activityId);
      setSelectedAssignmentId(selection.assignmentId);
      return nextCurriculum;
    },
    [],
  );

  const loadClassContext = useCallback(async (classId: string) => {
    const [classWithStudentsResult, sessionsResult] = await Promise.all([
      getClassWithStudents(classId),
      getClassSessions(classId, CLASS_SESSIONS_QUERY),
    ]);

    const mentorId = classWithStudentsResult?.data?.mentorId;
    const mentor = mentorId ? await loadMentorProfile(mentorId) : null;

    const nextClassContext = buildClassContext(
      classWithStudentsResult,
      sessionsResult,
      mentor,
    );
    setClassContext(nextClassContext);
    return nextClassContext;
  }, []);

  const loadLearningState = useCallback(
    async (
      activeEnrollment: ProgramEnrollment,
      seed?: { activityId?: string | null; assignmentId?: string | null },
    ) => {
      const enrollmentClassResult = await getProgramEnrollmentClass(activeEnrollment.id);
      const classId = enrollmentClassResult?.data?.classId ?? null;

      if (!classId) {
        setCurriculum(null);
        setClassContext(null);
        setIsClassPickerOpen(true);
        return;
      }

      await Promise.all([
        loadCurriculum(activeEnrollment.id, seed),
        loadClassContext(classId),
      ]);
    },
    [loadClassContext, loadCurriculum],
  );

  useEffect(() => {
    if (!isHydrated || isUserLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setLoadError(null);

      try {
        const activeEnrollment = await resolveActiveProgramEnrollment(programId);

        if (!activeEnrollment) {
          router.replace(`/programs/${programId}`);
          return;
        }

        if (cancelled) return;

        setEnrollment(activeEnrollment);
        await loadLearningState(activeEnrollment, {
          activityId: seedActivityId,
          assignmentId: seedAssignmentId,
        });
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
    loadLearningState,
    programId,
    router,
    seedActivityId,
    seedAssignmentId,
  ]);

  const handleSelectActivity = useCallback((activityId: string) => {
    setSelectedAssignmentId(null);
    setSelectedActivityId(activityId);
  }, []);

  const handleSelectAssignment = useCallback((assignmentId: string) => {
    setSelectedActivityId(null);
    setSelectedAssignmentId(assignmentId);
  }, []);

  const handleCurriculumRefresh = useCallback(async () => {
    if (!curriculum) return;
    await loadCurriculum(curriculum.enrollmentId, {
      activityId: selectedActivityId,
      assignmentId: selectedAssignmentId,
    });
  }, [
    curriculum,
    loadCurriculum,
    selectedActivityId,
    selectedAssignmentId,
  ]);

  const handleClassEnrolled = useCallback(
    async (classId: string) => {
      if (!enrollment) return;
      setIsBootstrapping(true);
      try {
        await Promise.all([
          loadCurriculum(enrollment.id, {
            activityId: seedActivityId,
            assignmentId: seedAssignmentId,
          }),
          loadClassContext(classId),
        ]);
      } catch (error) {
        showAppErrorFromUnknown(error, "generic");
        setLoadError("Không tải được nội dung học sau khi chọn lớp.");
      } finally {
        setIsBootstrapping(false);
      }
    },
    [
      enrollment,
      loadClassContext,
      loadCurriculum,
      seedActivityId,
      seedAssignmentId,
    ],
  );

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

  if (!enrollment) {
    return <LearnSkeleton />;
  }

  if (!curriculum || !classContext) {
    return (
      <>
        <div className="learn-shell flex min-h-dvh items-center justify-center bg-learn-bg px-4 pt-[4.5rem] sm:pt-20">
          <div className="max-w-lg rounded-2xl border border-learn-border bg-learn-surface p-6 text-center shadow-sm">
            <p className="font-heading text-lg font-semibold text-learn-text-strong">
              Chọn lớp để bắt đầu học
            </p>
            <p className="mt-2 text-sm text-learn-muted">
              Bạn cần chọn một lớp đang mở trong chương trình này trước khi vào nội dung học.
            </p>
            <Button
              type="button"
              className="mt-5"
              onClick={() => setIsClassPickerOpen(true)}
            >
              Chọn lớp học
            </Button>
          </div>
        </div>

        <ClassPickerDialog
          open={isClassPickerOpen}
          onOpenChange={setIsClassPickerOpen}
          programId={programId}
          programEnrollmentId={enrollment.id}
          programName={enrollment.name}
          onEnrolled={(classId) => void handleClassEnrolled(classId)}
        />
      </>
    );
  }

  return (
    <>
      <CurriculumShell
        curriculum={curriculum}
        selectedActivityId={selectedActivityId}
        selectedAssignmentId={selectedAssignmentId}
        onSelectActivity={handleSelectActivity}
        onSelectAssignment={handleSelectAssignment}
        onCurriculumRefresh={handleCurriculumRefresh}
        classContext={classContext}
        initialView={initialView}
      />

      <ClassPickerDialog
        open={isClassPickerOpen}
        onOpenChange={setIsClassPickerOpen}
        programId={programId}
        programEnrollmentId={enrollment.id}
        programName={enrollment.name}
        onEnrolled={(classId) => void handleClassEnrolled(classId)}
      />
    </>
  );
}
