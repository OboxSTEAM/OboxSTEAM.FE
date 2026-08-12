"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  ListTree,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

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
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  forceCompleteActivity,
  getAssignments,
  getClassSessionWithStudents,
  getProgramById,
  getResearchMilestonesByModule,
  hydrateProgramCurriculum,
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
  getNextSessionForActivity,
  getSessionsForActivity,
} from "@/lib/classes/session-helpers";
import {
  ACTIVITY_TYPE_LABELS,
  ASSIGNMENT_TYPE_LABELS,
} from "@/lib/curriculum/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

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
  const [forceCompletingId, setForceCompletingId] = useState<string | null>(null);
  const [bulkForceBusy, setBulkForceBusy] = useState(false);

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
    markLoading: markAttendanceLoading,
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={bulkForceBusy || roster.length === 0}
                    className="h-8 gap-1.5 rounded-lg text-xs"
                    onClick={() =>
                      void handleBulkForceComplete(selectedActivity.id)
                    }
                  >
                    <Sparkles className="size-3.5" />
                    {bulkForceBusy
                      ? "Đang force…"
                      : "Force complete cả lớp (test)"}
                  </Button>
                </div>

                {selectedActivity.activityType !== "SelfPaced" ? (
                  <div className="mt-3 max-w-md space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Buổi học liên kết
                    </p>
                    <Select
                      value={effectiveSessionId || null}
                      onValueChange={(value) => {
                        markAttendanceLoading();
                        setSessionId(value ?? "");
                      }}
                      disabled={activitySessions.length === 0}
                    >
                      <SelectTrigger
                        className={cn(THEME_SELECT_TRIGGER, "w-full")}
                      >
                        <span className="truncate">
                          {selectedSession
                            ? selectedSession.title || "Buổi học"
                            : activitySessions.length === 0
                              ? "Chưa có buổi gắn hoạt động này"
                              : "Chọn buổi học"}
                        </span>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        alignItemWithTrigger={false}
                        sideOffset={8}
                        className={THEME_SELECT_CONTENT}
                      >
                        {activitySessions.map((session) => (
                          <SelectItem
                            key={session.id}
                            value={session.id}
                            className={THEME_SELECT_ITEM}
                          >
                            {session.title || "Buổi học"}
                            {!session.requiresAttendance ? (
                              <span className="ml-2 text-[11px] text-muted-foreground">
                                (không điểm danh)
                              </span>
                            ) : null}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSession ? (
                      <p className="text-xs text-muted-foreground">
                        {formatApiDateTimeDisplay(selectedSession.startTime)}
                        {" → "}
                        {formatApiDateTimeDisplay(selectedSession.endTime)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {selectedActivity.activityType !== "SelfPaced" &&
              effectiveSessionId ? (
                <MentorActivityAttendancePanel
                  students={attendanceStudents}
                  isLoading={isAttendanceLoading}
                  updatingStudentId={updatingAttendanceId}
                  onStatusChange={handleAttendanceChange}
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
                <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/20 px-4 py-2.5 sm:px-6">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Zap className="size-4 text-primary" />
                    Force complete học viên (test)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Bỏ qua khóa tuần tự — chỉ dùng khi kiểm thử
                  </p>
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
