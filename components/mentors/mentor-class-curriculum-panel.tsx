"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ListTree,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Users,
} from "lucide-react";

import { MentorActivityAttendancePanel } from "@/components/mentors/mentor-activity-attendance-panel";
import { MentorClassGradingPanel } from "@/components/mentors/mentor-class-grading-panel";
import { MentorClassQuizSetPanel } from "@/components/mentors/mentor-class-quiz-set-panel";
import {
  MentorCurriculumTree,
  type MentorCurriculumSelection,
  type MentorCurriculumTreeProgress,
} from "@/components/mentors/mentor-curriculum-tree";
import { MentorStudentProgressPane } from "@/components/mentors/mentor-student-progress-pane";
import { LiveSessionJoinPanel } from "@/components/curriculum/live-session-join-panel";
import { SessionCheckinQrDialog } from "@/components/mentors/session-checkin-qr-dialog";
import { SessionEvidencePanel } from "@/components/mentors/session-evidence-panel";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useCurriculumSync } from "@/hooks/use-curriculum-sync";
import {
  getAssignments,
  getClassCurriculumProgress,
  getClassSessionWithStudents,
  getProgramById,
  getResearchMilestonesByModule,
  hydrateProgramCurriculum,
  mentorCompleteActivityBulk,
  updateSessionAttendance,
  type Activity,
  type AssignmentListItem,
  type ClassCurriculumProgress,
  type ClassSession,
  type ClassSessionStudent,
  type ClassStudentRoster,
  type Module,
  type ResearchMilestone,
  type SessionAttendanceStatus,
} from "@/lib/api";
import {
  canGenerateSessionCheckinQr,
  formatClassSessionSchedule,
  getNextSessionForActivity,
  getSessionsForActivity,
} from "@/lib/classes/session-helpers";
import {
  ACTIVITY_TYPE_LABELS,
  ASSIGNMENT_TYPE_LABELS,
} from "@/lib/curriculum/constants";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

const CURRICULUM_TREE_WIDTH_PX = 280;

function findActivityInModules(
  modules: Module[],
  activityId: string,
): Activity | null {
  for (const module of modules) {
    for (const course of module.courses ?? []) {
      const found = (course.activities ?? []).find((a) => a.id === activityId);
      if (found) return found;
    }
  }
  return null;
}

function toTreeProgress(
  data: ClassCurriculumProgress | null | undefined,
): MentorCurriculumTreeProgress | null {
  if (!data) return null;

  const activitiesById: MentorCurriculumTreeProgress["activitiesById"] = {};
  const assignmentsById: MentorCurriculumTreeProgress["assignmentsById"] = {};

  for (const module of data.modules ?? []) {
    for (const activity of module.activities ?? []) {
      activitiesById[activity.activityId] = {
        status: activity.status,
        completedCount: activity.completedCount,
        inProgressCount: activity.inProgressCount,
        classSessionId: activity.classSessionId,
        sessionStatus: activity.sessionStatus,
      };
    }
    for (const assignment of module.assignments ?? []) {
      assignmentsById[assignment.assignmentId] = {
        status: assignment.status,
        submittedCount: assignment.submittedCount,
        gradedCount: assignment.gradedCount,
      };
    }
  }

  return {
    totalStudents: data.totalStudents,
    currentActivityId: data.currentActivityId,
    activitiesById,
    assignmentsById,
  };
}

type MentorClassCurriculumPanelProps = {
  classId: string;
  programId: string;
  roster: ClassStudentRoster[];
  sessions: ClassSession[];
  initialActivityId?: string | null;
  initialSessionId?: string | null;
  initialAssignmentId?: string | null;
};

export function MentorClassCurriculumPanel({
  classId,
  programId,
  roster: _roster,
  sessions,
  initialActivityId = null,
  initialSessionId = null,
  initialAssignmentId = null,
}: MentorClassCurriculumPanelProps) {
  const [selection, setSelection] = useState<MentorCurriculumSelection | null>(
    () => {
      if (initialAssignmentId) {
        return { kind: "assignment", assignmentId: initialAssignmentId };
      }
      if (initialActivityId) {
        return { kind: "activity", activityId: initialActivityId };
      }
      return null;
    },
  );
  const [sessionId, setSessionId] = useState(initialSessionId ?? "");
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState<string | null>(
    null,
  );
  const [isMentorCompleting, setIsMentorCompleting] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [isTreeOpen, setIsTreeOpen] = useState(true);

  useEffect(() => {
    if (initialAssignmentId) {
      setSelection({ kind: "assignment", assignmentId: initialAssignmentId });
      return;
    }
    if (initialActivityId) {
      setSelection({ kind: "activity", activityId: initialActivityId });
    }
  }, [initialActivityId, initialAssignmentId]);

  useEffect(() => {
    if (initialActivityId || !initialSessionId || sessions.length === 0) return;
    const session = sessions.find((item) => item.id === initialSessionId);
    if (session?.activityId) {
      setSelection({ kind: "activity", activityId: session.activityId });
    }
  }, [initialActivityId, initialSessionId, sessions]);

  useEffect(() => {
    if (initialSessionId) setSessionId(initialSessionId);
  }, [initialSessionId]);

  const selectedActivityId =
    selection?.kind === "activity" ? selection.activityId : null;

  useEffect(() => {
    setIsQrOpen(false);
    setEvidenceCount(0);
  }, [selectedActivityId]);

  const { data: programResult, isLoading: isProgramLoading, retry: retryProgram } = useClientFetch({
    fetcher: async () => {
      const result = await getProgramById(programId);
      const program = result?.data ?? null;
      if (!program) return null;
      return hydrateProgramCurriculum(program);
    },
    deps: [programId],
    onError: (error) => showAppErrorFromUnknown(error, "programs.detail"),
  });

  const modules = programResult?.modules ?? [];

  const handleProgramSync = useCallback(() => {
    retryProgram();
  }, [retryProgram]);

  useCurriculumSync(programId, handleProgramSync);

  const { data: assignmentsData, isLoading: isAssignmentsLoading } =
    useClientFetch({
      fetcher: async () => {
        const result = await getAssignments({
          programId,
          page: 1,
          pageSize: 100,
          sortBy: "title",
          isDescending: false,
        });
        return result?.data?.items ?? [];
      },
      deps: [programId],
      onError: (error) =>
        showAppErrorFromUnknown(error, "assignments.submissions.list"),
    });

  const assignments = assignmentsData ?? [];

  const researchIdsKey = modules
    .filter((m) => m.moduleType === "Research")
    .map((m) => m.id)
    .join(",");

  const { data: milestonesByModule } = useClientFetch({
    enabled: Boolean(researchIdsKey),
    fetcher: async (): Promise<Record<string, ResearchMilestone[]>> => {
      const ids = researchIdsKey.split(",").filter(Boolean);
      const entries = await Promise.all(
        ids.map(async (moduleId) => {
          try {
            const result = await getResearchMilestonesByModule(moduleId);
            return [moduleId, result?.data ?? []] as const;
          } catch {
            return [moduleId, []] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    deps: [researchIdsKey],
  });

  const assignmentsByModule = useMemo(() => {
    const milestoneAssignmentIds = new Set<string>();
    for (const list of Object.values(milestonesByModule ?? {})) {
      for (const milestone of list) {
        if (milestone.assignmentId) {
          milestoneAssignmentIds.add(milestone.assignmentId);
        }
      }
    }

    const map: Record<string, AssignmentListItem[]> = {};
    for (const item of assignments) {
      if (milestoneAssignmentIds.has(item.id)) continue;
      const list = map[item.moduleId] ?? [];
      list.push(item);
      map[item.moduleId] = list;
    }
    return map;
  }, [assignments, milestonesByModule]);

  const {
    data: curriculumProgressValue,
    retry: retryCurriculumProgress,
  } = useClientFetch({
    fetcher: async () => {
      const result = await getClassCurriculumProgress(classId);
      return result?.data ?? null;
    },
    deps: [classId],
    onError: (error) =>
      showAppErrorFromUnknown(error, "classes.curriculumProgress"),
  });

  const treeProgress = useMemo(
    () => toTreeProgress(curriculumProgressValue),
    [curriculumProgressValue],
  );

  const selectedActivity =
    selection?.kind === "activity"
      ? findActivityInModules(modules, selection.activityId)
      : null;
  const isOfflineActivity = selectedActivity?.activityType === "Offline";

  const selectedAssignment =
    selection?.kind === "assignment"
      ? assignments.find((item) => item.id === selection.assignmentId) ?? null
      : null;

  const activitySessions = useMemo(() => {
    if (!selectedActivity) return [];
    return getSessionsForActivity(sessions, selectedActivity.id);
  }, [selectedActivity, sessions]);

  useEffect(() => {
    if (!selectedActivity) return;
    if (
      sessionId &&
      activitySessions.some((session) => session.id === sessionId)
    ) {
      return;
    }
    const next =
      getNextSessionForActivity(sessions, selectedActivity.id)?.id ||
      activitySessions.find((s) => s.requiresAttendance)?.id ||
      activitySessions[0]?.id ||
      "";
    setSessionId(next);
  }, [selectedActivity, activitySessions, sessions, sessionId]);

  const effectiveSessionId =
    selection?.kind === "activity" &&
    selectedActivity &&
    (selectedActivity.activityType === "LiveOnline" ||
      selectedActivity.activityType === "Offline")
      ? sessionId
      : "";

  useEffect(() => {
    setIsQrOpen(false);
  }, [effectiveSessionId]);

  const {
    data: attendanceData,
    isLoading: isAttendanceLoading,
    retry: retryAttendance,
  } = useClientFetch({
    enabled: Boolean(effectiveSessionId),
    fetcher: () => getClassSessionWithStudents(classId, effectiveSessionId),
    deps: [classId, effectiveSessionId],
    onError: (error) => showAppErrorFromUnknown(error, "attendance.list"),
  });

  const attendanceStudents = attendanceData?.data?.students ?? [];
  const selectedSession =
    activitySessions.find((session) => session.id === effectiveSessionId) ??
    null;

  useEffect(() => {
    setEvidenceCount(0);
  }, [effectiveSessionId]);

  const sessionSchedule = useMemo(() => {
    if (!selectedSession) return null;
    return formatClassSessionSchedule(
      selectedSession.startTime,
      selectedSession.endTime,
    );
  }, [selectedSession]);

  const handleSelect = useCallback((next: MentorCurriculumSelection) => {
    if (next.kind === "assignment") {
      setSessionId("");
    }
    setSelection(next);
  }, []);

  const handleAttendanceChange = useCallback(
    async (student: ClassSessionStudent, status: SessionAttendanceStatus) => {
      if (!effectiveSessionId || student.attendanceStatus === status) return;
      setUpdatingAttendanceId(student.studentId);
      try {
        await updateSessionAttendance(
          classId,
          effectiveSessionId,
          student.studentId,
          { status },
        );
        showAppSuccess({
          title: "Đã cập nhật điểm danh",
          description: student.studentName || student.studentCode || "Học viên",
        });
        retryAttendance();
      } catch (error) {
        showAppErrorFromUnknown(error, "attendance.update");
      } finally {
        setUpdatingAttendanceId(null);
      }
    },
    [classId, effectiveSessionId, retryAttendance],
  );

  const handleMentorCompleteActivity = useCallback(async () => {
    if (!selectedActivity || !effectiveSessionId || isMentorCompleting) return;

    setIsMentorCompleting(true);
    try {
      const result = await mentorCompleteActivityBulk({
        classSessionId: effectiveSessionId,
        activityId: selectedActivity.id,
      });
      const outcomes = result?.data?.results ?? [];
      const completed = outcomes.filter((row) => row.outcome === "Completed").length;
      const alreadyDone = outcomes.filter(
        (row) => row.outcome === "AlreadyDone",
      ).length;
      const skipped = outcomes.filter((row) => row.outcome === "Skipped").length;

      showAppSuccess({
        title: "Đã hoàn thành hoạt động",
        description: `Hoàn thành ${completed} · Đã Done ${alreadyDone} · Bỏ qua ${skipped}.`,
      });
      retryAttendance();
      retryCurriculumProgress();
    } catch (error) {
      showAppErrorFromUnknown(error, "activityProgress.mentorCompleteBulk");
    } finally {
      setIsMentorCompleting(false);
    }
  }, [
    effectiveSessionId,
    isMentorCompleting,
    retryAttendance,
    retryCurriculumProgress,
    selectedActivity,
  ]);

  const isTreeLoading = isProgramLoading || isAssignmentsLoading;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex h-[min(720px,calc(100dvh-14rem))] min-h-[480px] flex-col lg:flex-row">
        <aside
          id="mentor-curriculum-tree"
          className={cn(
            "flex min-h-0 shrink-0 flex-col overflow-hidden border-border bg-muted/25 transition-[width,max-height,opacity,border-width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
            isTreeOpen
              ? "w-full max-h-[45%] border-b opacity-100 lg:max-h-none lg:w-[280px] lg:min-w-[280px] lg:border-b-0 lg:border-r"
              : "pointer-events-none max-h-0 w-0 border-0 opacity-0 lg:max-h-none",
          )}
          aria-hidden={!isTreeOpen}
        >
          <div
            className="flex h-full w-full flex-col"
            style={{ minWidth: CURRICULUM_TREE_WIDTH_PX }}
          >
            <div className="shrink-0 border-b border-border px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ListTree className="size-4 text-primary" />
                    Chương trình
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {isTreeLoading
                      ? "Đang tải…"
                      : `${modules.length} module · ${assignments.length} bài tập`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground lg:hidden"
                  onClick={() => setIsTreeOpen(false)}
                  aria-label="Thu gọn cây chương trình"
                  aria-expanded={isTreeOpen}
                  aria-controls="mentor-curriculum-tree"
                >
                  <PanelLeftClose className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {isTreeLoading && modules.length === 0 ? (
                <div className="space-y-2 p-3">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : (
                <MentorCurriculumTree
                  modules={modules}
                  assignmentsByModule={assignmentsByModule}
                  milestonesByModule={milestonesByModule ?? {}}
                  selection={selection}
                  onSelect={handleSelect}
                  focusActivityId={selectedActivityId}
                  progress={treeProgress}
                />
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/10 px-3 py-2 sm:px-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-lg px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsTreeOpen((open) => !open)}
              aria-expanded={isTreeOpen}
              aria-controls="mentor-curriculum-tree"
            >
              {isTreeOpen ? (
                <PanelLeftClose className="size-4" aria-hidden />
              ) : (
                <PanelLeftOpen className="size-4" aria-hidden />
              )}
              {isTreeOpen ? "Ẩn chương trình" : "Hiện chương trình"}
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {!selection ? (
            <div className="flex min-h-full items-center justify-center p-6">
              <ManagerEmptyState
                title="Chọn một mục trong cây chương trình"
                description="Xem hoạt động để điểm danh / theo dõi tiến độ, hoặc chọn bài tập để chấm ngay tại đây."
                icon={ListTree}
              />
            </div>
          ) : selection.kind === "assignment" && selectedAssignment ? (
            <div className="flex min-h-full flex-col">
              <div className="border-b border-border bg-muted/30 px-4 py-3 sm:px-6">
                <p className="text-xs text-muted-foreground">
                  {ASSIGNMENT_TYPE_LABELS[selectedAssignment.assignmentType]}
                </p>
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {selectedAssignment.title?.trim() || "Bài tập"}
                </h2>
              </div>

              <MentorStudentProgressPane
                classId={classId}
                kind="assignment"
                targetId={selectedAssignment.id}
                onProgressMutated={retryCurriculumProgress}
              />

              {selectedAssignment.assignmentType === "Quiz" ? (
                <MentorClassQuizSetPanel
                  assignmentId={selectedAssignment.id}
                  classId={classId}
                  assignmentTitle={selectedAssignment.title}
                />
              ) : (
                <MentorClassGradingPanel
                  classId={classId}
                  programId={programId}
                  initialAssignmentId={selectedAssignment.id}
                  embedded
                />
              )}
            </div>
          ) : selection.kind === "activity" && selectedActivity ? (
            <>
              <div className="border-b border-border bg-muted/30 px-4 py-3 sm:px-6">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {ACTIVITY_TYPE_LABELS[selectedActivity.activityType]}
                  </p>
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    {selectedActivity.name}
                  </h2>
                  {selectedActivity.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {selectedActivity.description}
                    </p>
                  ) : null}
                </div>

                {selectedActivity.activityType === "LiveOnline" ||
                selectedActivity.activityType === "Offline" ? (
                  sessionSchedule ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-primary/25 bg-card">
                      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/[0.06] px-3 py-2">
                        <CalendarClock
                          className="size-4 shrink-0 text-primary"
                          aria-hidden
                        />
                        <p className="text-[11px] font-bold tracking-[0.12em] text-primary uppercase">
                          Thời gian buổi học
                        </p>
                        {sessionSchedule.relative ? (
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary sm:ml-auto">
                            {sessionSchedule.relative}
                          </span>
                        ) : null}
                      </div>
                      <div className="grid gap-0 sm:grid-cols-2">
                        <div className="border-b border-border px-4 py-3 sm:border-r sm:border-b-0">
                          <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Bắt đầu
                          </p>
                          <p className="mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
                            {sessionSchedule.start.time}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                            {sessionSchedule.start.date}
                          </p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Kết thúc
                          </p>
                          <p className="mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
                            {sessionSchedule.end?.time ?? "—"}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                            {sessionSchedule.end?.date ??
                              (sessionSchedule.spansMultipleDays
                                ? "—"
                                : sessionSchedule.start.date)}
                          </p>
                        </div>
                      </div>
                      {selectedActivity.activityType === "LiveOnline" &&
                      selectedSession ? (
                        <div className="border-t border-border px-3 py-3 sm:px-4">
                          <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Phòng học online
                          </p>
                          <LiveSessionJoinPanel
                            session={selectedSession}
                            variant="app"
                            meetingHeight="min(360px, 40dvh)"
                            onJoined={() => retryAttendance()}
                            onLeft={() => retryAttendance()}
                          />
                        </div>
                      ) : null}
                      {isOfflineActivity &&
                      selectedSession?.location?.trim() ? (
                        <p className="flex items-center gap-1.5 border-t border-border px-4 py-2 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" aria-hidden />
                          <span className="truncate">
                            {selectedSession.location.trim()}
                          </span>
                        </p>
                      ) : null}
                      {selectedSession &&
                      canGenerateSessionCheckinQr(selectedSession) ? (
                        <div className="border-t border-primary/20 bg-primary/[0.08] px-3 py-3 sm:px-4">
                          <Button
                            type="button"
                            onClick={() => setIsQrOpen(true)}
                            className="h-11 w-full gap-2 rounded-xl text-sm font-semibold shadow-sm"
                            aria-label={`QR check-in ${selectedSession.title || selectedActivity.name}`}
                          >
                            <QrCode className="size-4" aria-hidden />
                            Tạo mã QR check-in
                          </Button>
                          <p className="mt-2 text-center text-[11px] text-muted-foreground">
                            Field Trip — học viên quét mã để điểm danh tại chỗ
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                      Chưa có buổi gắn hoạt động này — không thể điểm danh.
                    </p>
                  )
                ) : null}
              </div>

              <MentorStudentProgressPane
                classId={classId}
                kind="activity"
                targetId={selectedActivity.id}
                enableForceComplete
                onProgressMutated={retryCurriculumProgress}
              />

              {selectedActivity.activityType !== "SelfPaced" &&
              effectiveSessionId ? (
                <>
                  {isOfflineActivity ? (
                    <SessionEvidencePanel
                      sessionId={effectiveSessionId}
                      requireMediaEvidence={
                        selectedActivity.requireMediaEvidence
                      }
                      onCountChange={setEvidenceCount}
                    />
                  ) : null}
                  <MentorActivityAttendancePanel
                    students={attendanceStudents}
                    isLoading={isAttendanceLoading}
                    updatingStudentId={updatingAttendanceId}
                    isCompletingActivity={isMentorCompleting}
                    requireMediaEvidence={
                      isOfflineActivity
                        ? selectedActivity.requireMediaEvidence
                        : false
                    }
                    evidenceCount={isOfflineActivity ? evidenceCount : 0}
                    onStatusChange={handleAttendanceChange}
                    onCompleteActivity={() => {
                      void handleMentorCompleteActivity();
                    }}
                  />
                </>
              ) : selectedActivity.activityType !== "SelfPaced" ? (
                <div className="p-6">
                  <ManagerEmptyState
                    title="Chưa có buổi học để điểm danh"
                    description="Gắn buổi học với hoạt động này ở lịch lớp, hoặc chọn buổi khác nếu đã có."
                    icon={Users}
                  />
                </div>
              ) : null}

              <SessionCheckinQrDialog
                open={isQrOpen}
                onOpenChange={setIsQrOpen}
                sessionId={selectedSession?.id ?? ""}
                sessionTitle={selectedSession?.title ?? selectedActivity.name}
              />
            </>
          ) : (
            <div className="flex min-h-full items-center justify-center p-6">
              <ManagerEmptyState
                title="Không tìm thấy mục đã chọn"
                description="Cây chương trình có thể đã thay đổi. Chọn lại một hoạt động hoặc bài tập."
                icon={ListTree}
              />
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
