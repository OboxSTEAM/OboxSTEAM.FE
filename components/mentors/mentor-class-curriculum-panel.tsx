"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  ClipboardList,
  ListTree,
  MapPin,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { MentorActivityAttendancePanel } from "@/components/mentors/mentor-activity-attendance-panel";
import { MentorClassQuizSetPanel } from "@/components/mentors/mentor-class-quiz-set-panel";
import {
  MentorCurriculumTree,
  type MentorCurriculumSelection,
} from "@/components/mentors/mentor-curriculum-tree";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  forceCompleteActivity,
  getAssignments,
  getClassSessionWithStudents,
  getProgramById,
  getResearchMilestonesByModule,
  hydrateProgramCurriculum,
  mentorCompleteActivityBulk,
  updateSessionAttendance,
  type Activity,
  type AssignmentListItem,
  type AssignmentType,
  type ClassSession,
  type ClassSessionStudent,
  type ClassStudentRoster,
  type Module,
  type ResearchMilestone,
  type SessionAttendanceStatus,
} from "@/lib/api";
import {
  formatClassSessionSchedule,
  getNextSessionForActivity,
  getSessionsForActivity,
} from "@/lib/classes/session-helpers";
import {
  ACTIVITY_TYPE_LABELS,
  ASSIGNMENT_TYPE_LABELS,
} from "@/lib/curriculum/constants";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "HV";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

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

function resolveAssignmentType(
  assignmentId: string,
  assignments: AssignmentListItem[],
  milestonesByModule: Record<string, ResearchMilestone[]> | undefined,
): AssignmentType | null {
  const fromList = assignments.find((item) => item.id === assignmentId);
  if (fromList) return fromList.assignmentType;

  for (const list of Object.values(milestonesByModule ?? {})) {
    for (const milestone of list) {
      if (milestone.assignmentId === assignmentId) {
        return milestone.assignment?.assignmentType ?? "FileUpload";
      }
    }
  }
  return null;
}

type MentorClassCurriculumPanelProps = {
  classId: string;
  programId: string;
  roster: ClassStudentRoster[];
  sessions: ClassSession[];
  initialActivityId?: string | null;
  initialSessionId?: string | null;
  initialAssignmentId?: string | null;
  onOpenGrading?: (assignmentId: string) => void;
};

export function MentorClassCurriculumPanel({
  classId,
  programId,
  roster,
  sessions,
  initialActivityId = null,
  initialSessionId = null,
  initialAssignmentId = null,
  onOpenGrading,
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
  const [forceCompletingId, setForceCompletingId] = useState<string | null>(null);
  const [bulkForceBusy, setBulkForceBusy] = useState(false);
  const [isForceCompleteOpen, setIsForceCompleteOpen] = useState(false);
  const reduceMotion = useReducedMotion();

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
    if (initialSessionId) setSessionId(initialSessionId);
  }, [initialSessionId]);

  const selectedActivityId =
    selection?.kind === "activity" ? selection.activityId : null;

  useEffect(() => {
    setIsForceCompleteOpen(false);
  }, [selectedActivityId]);

  const { data: programResult, isLoading: isProgramLoading } = useClientFetch({
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

  const selectedActivity =
    selection?.kind === "activity"
      ? findActivityInModules(modules, selection.activityId)
      : null;

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

  const sessionSchedule = useMemo(() => {
    if (!selectedSession) return null;
    return formatClassSessionSchedule(
      selectedSession.startTime,
      selectedSession.endTime,
    );
  }, [selectedSession]);

  const handleSelect = useCallback(
    (next: MentorCurriculumSelection) => {
      if (next.kind === "assignment") {
        const assignmentType = resolveAssignmentType(
          next.assignmentId,
          assignments,
          milestonesByModule ?? undefined,
        );
        if (assignmentType && assignmentType !== "Quiz" && onOpenGrading) {
          onOpenGrading(next.assignmentId);
          return;
        }
        setSessionId("");
      }
      setSelection(next);
    },
    [assignments, milestonesByModule, onOpenGrading],
  );

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
    } catch (error) {
      showAppErrorFromUnknown(error, "activityProgress.mentorCompleteBulk");
    } finally {
      setIsMentorCompleting(false);
    }
  }, [effectiveSessionId, isMentorCompleting, retryAttendance, selectedActivity]);

  const handleForceComplete = useCallback(
    async (student: ClassStudentRoster, activityId: string) => {
      setForceCompletingId(student.studentId);
      try {
        await forceCompleteActivity({
          studentId: student.studentId,
          activityId,
        });
        showAppSuccess({
          title: "Force complete (test)",
          description: `${student.studentName || student.studentCode || "Học viên"} đã được đánh dấu Done.`,
        });
      } catch (error) {
        showAppErrorFromUnknown(error, "activityProgress.forceComplete");
      } finally {
        setForceCompletingId(null);
      }
    },
    [],
  );

  const handleBulkForceComplete = useCallback(
    async (activityId: string) => {
      const active = roster.filter((s) => s.enrollmentStatus === "Active");
      if (active.length === 0) return;
      setBulkForceBusy(true);
      let ok = 0;
      for (const student of active) {
        try {
          await forceCompleteActivity({
            studentId: student.studentId,
            activityId,
          });
          ok += 1;
        } catch {
          /* continue remaining students */
        }
      }
      setBulkForceBusy(false);
      showAppSuccess({
        title: "Force complete hàng loạt (test)",
        description: `Đã xử lý ${ok}/${active.length} học viên active.`,
      });
    },
    [roster],
  );

  const forceCompleteColumns: ColumnDef<ClassStudentRoster>[] = useMemo(
    () => [
      {
        header: "Học viên",
        render: (student) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-9 border border-border">
              <AvatarImage src={student.avatarUrl || undefined} alt="" />
              <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                {getInitials(student.studentName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {student.studentName || "Chưa cập nhật tên"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {student.studentCode || student.email || "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "",
        sticky: "right",
        className: "w-40 text-right",
        render: (student) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              forceCompletingId === student.studentId ||
              bulkForceBusy ||
              !selectedActivity
            }
            className="h-7 gap-1 rounded-md text-xs"
            onClick={() => {
              if (!selectedActivity) return;
              void handleForceComplete(student, selectedActivity.id);
            }}
          >
            <Zap className="size-3.5" />
            {forceCompletingId === student.studentId
              ? "Đang lưu…"
              : "Force complete"}
          </Button>
        ),
      },
    ],
    [
      bulkForceBusy,
      forceCompletingId,
      handleForceComplete,
      selectedActivity,
    ],
  );

  const isTreeLoading = isProgramLoading || isAssignmentsLoading;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex h-[min(720px,calc(100dvh-14rem))] min-h-[480px] flex-col lg:flex-row">
        <aside className="flex min-h-0 w-full shrink-0 flex-col border-b border-border bg-muted/25 max-lg:max-h-[45%] lg:h-full lg:w-[min(320px,34%)] lg:min-w-[240px] lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-border px-4 py-3">
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
              />
            )}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {!selection ? (
            <div className="flex min-h-full items-center justify-center p-6">
              <ManagerEmptyState
                title="Chọn một mục trong cây chương trình"
                description="Xem hoạt động để điểm danh / force-complete, hoặc chọn bài Quiz để kéo và chỉnh bộ đề lớp."
                icon={ListTree}
              />
            </div>
          ) : selection.kind === "assignment" && selectedAssignment ? (
            selectedAssignment.assignmentType === "Quiz" ? (
              <MentorClassQuizSetPanel
                assignmentId={selectedAssignment.id}
                classId={classId}
                assignmentTitle={selectedAssignment.title}
              />
            ) : (
              <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6">
                <Badge variant="secondary">
                  {ASSIGNMENT_TYPE_LABELS[selectedAssignment.assignmentType]}
                </Badge>
                <ManagerEmptyState
                  title={selectedAssignment.title?.trim() || "Bài tập"}
                  description="Chấm bài và xem nộp nằm ở tab Chấm bài. Bộ đề kéo/chỉnh chỉ áp dụng cho Quiz."
                  icon={ClipboardList}
                />
              </div>
            )
          ) : selection.kind === "activity" && selectedActivity ? (
            <>
              <div className="border-b border-border bg-muted/30 px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
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
                </div>

                {selectedActivity.activityType === "LiveOnline" ||
                selectedActivity.activityType === "Offline" ? (
                  sessionSchedule ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-primary/25 bg-card">
                      <div className="flex items-center gap-2 border-b border-border bg-primary/[0.06] px-3 py-2">
                        <CalendarClock
                          className="size-4 shrink-0 text-primary"
                          aria-hidden
                        />
                        <p className="text-[11px] font-bold tracking-[0.12em] text-primary uppercase">
                          Thời gian buổi học
                        </p>
                        {sessionSchedule.relative ? (
                          <span className="ml-auto rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
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
                      {selectedSession?.location?.trim() ? (
                        <p className="flex items-center gap-1.5 border-t border-border px-4 py-2 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" aria-hidden />
                          <span className="truncate">
                            {selectedSession.location.trim()}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                      Chưa có buổi gắn hoạt động này — không thể điểm danh.
                    </p>
                  )
                ) : null}
              </div>

              {selectedActivity.activityType !== "SelfPaced" &&
              effectiveSessionId ? (
                <MentorActivityAttendancePanel
                  students={attendanceStudents}
                  isLoading={isAttendanceLoading}
                  updatingStudentId={updatingAttendanceId}
                  isCompletingActivity={isMentorCompleting}
                  onStatusChange={handleAttendanceChange}
                  onCompleteActivity={() => {
                    void handleMentorCompleteActivity();
                  }}
                />
              ) : selectedActivity.activityType !== "SelfPaced" ? (
                <div className="p-6">
                  <ManagerEmptyState
                    title="Chưa có buổi học để điểm danh"
                    description="Gắn buổi học với hoạt động này ở lịch lớp, hoặc chọn buổi khác nếu đã có."
                    icon={Users}
                  />
                </div>
              ) : null}

              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsForceCompleteOpen((open) => !open)}
                  aria-expanded={isForceCompleteOpen}
                  className="flex w-full items-center justify-between gap-2 bg-muted/15 px-4 py-2.5 text-left transition-colors hover:bg-muted/30 sm:px-6"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Zap className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Force complete (test)
                    </span>
                    <Badge
                      variant="outline"
                      className="h-5 border-dashed px-1.5 text-[10px] font-medium text-muted-foreground"
                    >
                      Dev only
                    </Badge>
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${
                      isForceCompleteOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isForceCompleteOpen ? (
                    <motion.div
                      key="force-complete-panel"
                      initial={
                        reduceMotion ? false : { height: 0, opacity: 0 }
                      }
                      animate={{ height: "auto", opacity: 1 }}
                      exit={
                        reduceMotion ? undefined : { height: 0, opacity: 0 }
                      }
                      transition={{
                        duration: 0.28,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/10 px-4 py-2 sm:px-6">
                        <p className="text-[11px] text-muted-foreground">
                          Bỏ qua khóa tuần tự — chỉ dùng khi kiểm thử
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={bulkForceBusy || roster.length === 0}
                          className="h-7 gap-1.5 rounded-md text-[11px]"
                          onClick={() =>
                            void handleBulkForceComplete(selectedActivity.id)
                          }
                        >
                          <Sparkles className="size-3.5" />
                          {bulkForceBusy
                            ? "Đang force…"
                            : "Force complete cả lớp"}
                        </Button>
                      </div>
                      <div className="overflow-x-auto p-4 sm:p-6">
                        <ManagerDataTable
                          columns={forceCompleteColumns}
                          data={roster}
                          emptyState={
                            <ManagerEmptyState
                              title="Chưa có học viên"
                              description="Roster lớp trống."
                              icon={Users}
                            />
                          }
                        />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
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
