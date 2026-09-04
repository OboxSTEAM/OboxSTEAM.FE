"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  ManagerDataTable,
  type ColumnDef,
} from "@/components/manager/shared/data-table";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  forceCompleteActivity,
  getClassActivityStudentProgress,
  getClassAssignmentStudentProgress,
  type ActivityProgressStatus,
  type AssignmentSubmissionStatus,
  type ClassActivityStudentProgressItem,
  type ClassAssignmentStudentProgressItem,
  type SessionAttendanceStatus,
} from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type MentorStudentProgressPaneProps = {
  classId: string;
  kind: "activity" | "assignment";
  targetId: string;
  /** When kind=activity, enable force-complete (test) actions. */
  enableForceComplete?: boolean;
  onProgressMutated?: () => void;
  className?: string;
};

const ACTIVITY_STATUS_LABEL: Record<ActivityProgressStatus, string> = {
  NotStart: "Chưa bắt đầu",
  InProgress: "Đang học",
  Done: "Hoàn thành",
};

const SUBMISSION_STATUS_LABEL: Record<AssignmentSubmissionStatus, string> = {
  Pending: "Chưa nộp",
  TurnedIn: "Đã nộp",
  Graded: "Đã chấm",
  ReturnedForRevision: "Trả sửa",
};

const ATTENDANCE_STATUS_LABEL: Record<SessionAttendanceStatus, string> = {
  Expected: "Chờ",
  Present: "Có mặt",
  Absent: "Vắng",
  Excused: "Có phép",
  Late: "Muộn",
};

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "HV";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StudentIdentity({
  name,
  code,
  email,
  avatarUrl,
}: {
  name: string | null;
  code: string | null;
  email: string | null;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8 border border-border">
        <AvatarImage src={avatarUrl || undefined} alt="" />
        <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {name?.trim() || "Chưa cập nhật tên"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {code || email || "—"}
        </p>
      </div>
    </div>
  );
}

type StatusSegment = {
  key: string;
  label: string;
  value: number;
  tone: "success" | "accent" | "muted" | "warning";
};

const SEGMENT_TONE: Record<
  StatusSegment["tone"],
  { bar: string; dot: string; text: string }
> = {
  success: {
    bar: "bg-[#7CB342]",
    dot: "bg-[#7CB342]",
    text: "text-[#3d5c22] dark:text-[#b8e086]",
  },
  accent: {
    bar: "bg-accent",
    dot: "bg-accent",
    text: "text-accent",
  },
  muted: {
    bar: "bg-muted-foreground/35",
    dot: "bg-muted-foreground/45",
    text: "text-muted-foreground",
  },
  warning: {
    bar: "bg-[#FDD835]",
    dot: "bg-[#c9a400]",
    text: "text-[#8a6d00] dark:text-[#FDD835]",
  },
};

function ProgressStatusSummary({
  total,
  segments,
}: {
  total: number;
  segments: StatusSegment[];
}) {
  const safeTotal = Math.max(0, total);
  const segmentSum = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const barTotal = Math.max(safeTotal, segmentSum, 1);
  const primary = segments[0];
  const primaryPct =
    safeTotal > 0 && primary
      ? Math.round((Math.max(0, primary.value) / safeTotal) * 100)
      : 0;

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">
          Học viên trong lớp
        </p>
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-heading text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {safeTotal}
          </span>
          <span className="text-sm text-muted-foreground">học viên</span>
        </p>
      </div>

      <div className="min-w-0 flex-1 sm:max-w-md">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Phân bố trạng thái
          </p>
          {primary ? (
            <p
              className={cn(
                "font-mono text-xs font-semibold tabular-nums",
                SEGMENT_TONE[primary.tone].text,
              )}
            >
              {primaryPct}% {primary.label.toLowerCase()}
            </p>
          ) : null}
        </div>

        <div
          className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={segments
            .map((s) => `${s.label}: ${s.value}`)
            .join(", ")}
        >
          {segments.map((segment) => {
            const value = Math.max(0, segment.value);
            if (value === 0) return null;
            return (
              <div
                key={segment.key}
                className={cn(
                  "h-full min-w-0 transition-[width] duration-300 motion-reduce:transition-none",
                  SEGMENT_TONE[segment.tone].bar,
                )}
                style={{ width: `${(value / barTotal) * 100}%` }}
                title={`${segment.label}: ${value}`}
              />
            );
          })}
        </div>

        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {segments.map((segment) => (
            <li
              key={segment.key}
              className="inline-flex items-center gap-1.5 text-xs"
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  SEGMENT_TONE[segment.tone].dot,
                )}
                aria-hidden
              />
              <span className="text-muted-foreground">{segment.label}</span>
              <span
                className={cn(
                  "font-mono font-semibold tabular-nums",
                  SEGMENT_TONE[segment.tone].text,
                )}
              >
                {Math.max(0, segment.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MentorStudentProgressPane({
  classId,
  kind,
  targetId,
  enableForceComplete = false,
  onProgressMutated,
  className,
}: MentorStudentProgressPaneProps) {
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(true);
  const [forceCompletingId, setForceCompletingId] = useState<string | null>(
    null,
  );
  const [bulkForceBusy, setBulkForceBusy] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, [kind, targetId]);

  const {
    data: activityData,
    isLoading: isActivityLoading,
    retry: retryActivity,
  } = useClientFetch({
    enabled: kind === "activity" && Boolean(targetId),
    fetcher: async () => {
      const result = await getClassActivityStudentProgress(classId, targetId);
      return result?.data ?? null;
    },
    deps: [classId, targetId, kind],
    onError: (error) =>
      showAppErrorFromUnknown(error, "classes.curriculumProgress"),
  });

  const {
    data: assignmentData,
    isLoading: isAssignmentLoading,
    retry: retryAssignment,
  } = useClientFetch({
    enabled: kind === "assignment" && Boolean(targetId),
    fetcher: async () => {
      const result = await getClassAssignmentStudentProgress(classId, targetId);
      return result?.data ?? null;
    },
    deps: [classId, targetId, kind],
    onError: (error) =>
      showAppErrorFromUnknown(error, "classes.curriculumProgress"),
  });

  const isLoading =
    kind === "activity" ? isActivityLoading : isAssignmentLoading;

  const handleForceComplete = async (studentId: string, studentLabel: string) => {
    if (kind !== "activity") return;
    setForceCompletingId(studentId);
    try {
      await forceCompleteActivity({ studentId, activityId: targetId });
      showAppSuccess({
        title: "Force complete (test)",
        description: `${studentLabel} đã được đánh dấu Done.`,
      });
      retryActivity();
      onProgressMutated?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "activityProgress.forceComplete");
    } finally {
      setForceCompletingId(null);
    }
  };

  const handleBulkForceComplete = async () => {
    if (kind !== "activity" || !activityData) return;
    const students = activityData.students ?? [];
    if (students.length === 0) return;
    setBulkForceBusy(true);
    let ok = 0;
    for (const student of students) {
      if (student.activityStatus === "Done") {
        ok += 1;
        continue;
      }
      try {
        await forceCompleteActivity({
          studentId: student.studentId,
          activityId: targetId,
        });
        ok += 1;
      } catch {
        /* continue remaining */
      }
    }
    setBulkForceBusy(false);
    showAppSuccess({
      title: "Force complete hàng loạt (test)",
      description: `Đã xử lý ${ok}/${students.length} học viên.`,
    });
    retryActivity();
    onProgressMutated?.();
  };

  const activityColumns: ColumnDef<ClassActivityStudentProgressItem>[] =
    useMemo(
      () => [
        {
          header: "Học viên",
          render: (student) => (
            <StudentIdentity
              name={student.studentName}
              code={student.studentCode}
              email={student.email}
              avatarUrl={student.avatarUrl}
            />
          ),
        },
        {
          header: "Tiến độ",
          className: "w-32",
          render: (student) => (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
              {student.activityStatus === "Done" ? (
                <CheckCircle2 className="size-3.5 text-[#7CB342]" aria-hidden />
              ) : student.activityStatus === "InProgress" ? (
                <ClipboardList className="size-3.5 text-accent" aria-hidden />
              ) : (
                <Circle className="size-3.5 text-muted-foreground/50" aria-hidden />
              )}
              {ACTIVITY_STATUS_LABEL[student.activityStatus]}
            </span>
          ),
        },
        {
          header: "Điểm danh",
          className: "w-28 text-xs text-muted-foreground",
          render: (student) =>
            student.attendanceStatus
              ? ATTENDANCE_STATUS_LABEL[student.attendanceStatus]
              : "—",
        },
        {
          header: "Cập nhật",
          className: "w-36 text-xs text-muted-foreground",
          render: (student) =>
            formatApiDateTimeDisplay(
              student.completedAt ?? student.lastAccessedAt,
            ) || "—",
        },
        ...(enableForceComplete
          ? [
              {
                header: "",
                sticky: "right" as const,
                className: "w-36 text-right",
                render: (student: ClassActivityStudentProgressItem) => (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      forceCompletingId === student.studentId ||
                      bulkForceBusy ||
                      student.activityStatus === "Done"
                    }
                    className="h-7 gap-1 rounded-md text-xs"
                    onClick={() =>
                      void handleForceComplete(
                        student.studentId,
                        student.studentName ||
                          student.studentCode ||
                          "Học viên",
                      )
                    }
                  >
                    <Zap className="size-3.5" />
                    {forceCompletingId === student.studentId
                      ? "Đang lưu…"
                      : "Force"}
                  </Button>
                ),
              },
            ]
          : []),
      ],
      [bulkForceBusy, enableForceComplete, forceCompletingId],
    );

  const assignmentColumns: ColumnDef<ClassAssignmentStudentProgressItem>[] =
    useMemo(
      () => [
        {
          header: "Học viên",
          render: (student) => (
            <StudentIdentity
              name={student.studentName}
              code={student.studentCode}
              email={student.email}
              avatarUrl={student.avatarUrl}
            />
          ),
        },
        {
          header: "Trạng thái",
          className: "w-32",
          render: (student) => (
            <span className="text-xs font-medium text-foreground">
              {student.submissionStatus
                ? SUBMISSION_STATUS_LABEL[student.submissionStatus]
                : "Chưa bắt đầu"}
            </span>
          ),
        },
        {
          header: "Điểm",
          className: "w-24 font-mono text-xs tabular-nums",
          render: (student) =>
            student.assignedGrade != null ? String(student.assignedGrade) : "—",
        },
        {
          header: "Nộp / chấm",
          className: "w-40 text-xs text-muted-foreground",
          render: (student) => {
            const submitted = formatApiDateTimeDisplay(student.submittedAt);
            const graded = formatApiDateTimeDisplay(student.gradedAt);
            if (!submitted && !graded) return "—";
            return [submitted, graded].filter(Boolean).join(" · ");
          },
        },
      ],
      [],
    );

  const statusSummary =
    kind === "activity" && activityData
      ? {
          total: activityData.totalStudents,
          segments: [
            {
              key: "done",
              label: "Hoàn thành",
              value: activityData.completedCount,
              tone: "success" as const,
            },
            {
              key: "in-progress",
              label: "Đang học",
              value: activityData.inProgressCount,
              tone: "accent" as const,
            },
            {
              key: "not-started",
              label: "Chưa bắt đầu",
              value: activityData.notStartedCount,
              tone: "muted" as const,
            },
          ],
        }
      : kind === "assignment" && assignmentData
        ? {
            total: assignmentData.totalStudents,
            segments: [
              {
                key: "graded",
                label: "Đã chấm",
                value: assignmentData.gradedCount,
                tone: "success" as const,
              },
              {
                key: "submitted",
                label: "Đã nộp",
                value: Math.max(
                  0,
                  assignmentData.submittedCount - assignmentData.gradedCount,
                ),
                tone: "accent" as const,
              },
              {
                key: "not-started",
                label: "Chưa nộp",
                value: assignmentData.notStartedCount,
                tone: "muted" as const,
              },
            ],
          }
        : null;

  return (
    <div className={cn("border-b border-border", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 bg-muted/20 px-4 py-2.5 text-left transition-colors hover:bg-muted/35 sm:px-6"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <Users className="size-3.5 shrink-0 text-primary" aria-hidden />
          <span className="text-xs font-semibold text-foreground">
            Tiến độ lớp
          </span>
          {isLoading && !statusSummary ? (
            <Skeleton className="h-4 w-24" />
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key={`${kind}-${targetId}-progress`}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border"
          >
            {kind === "activity" && enableForceComplete ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-border bg-muted/10 px-4 py-2 sm:px-6">
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Zap className="size-3.5" aria-hidden />
                  Force complete (test)
                  <Badge
                    variant="outline"
                    className="h-5 border-dashed px-1.5 text-[10px] font-medium text-muted-foreground"
                  >
                    Dev only
                  </Badge>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    bulkForceBusy || (activityData?.students.length ?? 0) === 0
                  }
                  className="h-7 gap-1.5 rounded-md text-[11px]"
                  onClick={() => void handleBulkForceComplete()}
                >
                  <Sparkles className="size-3.5" />
                  {bulkForceBusy ? "Đang force…" : "Force cả lớp"}
                </Button>
              </div>
            ) : null}

            <div className="overflow-x-auto p-4 sm:px-6 sm:py-4">
              {isLoading && !statusSummary ? (
                <div className="mb-4 space-y-3">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-2.5 w-full rounded-full" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ) : statusSummary ? (
                <ProgressStatusSummary
                  total={statusSummary.total}
                  segments={statusSummary.segments}
                />
              ) : null}

              {kind === "activity" ? (
                <ManagerDataTable
                  columns={activityColumns}
                  data={activityData?.students ?? []}
                  isLoading={isLoading}
                  emptyState={
                    <ManagerEmptyState
                      title="Chưa có học viên"
                      description="Roster lớp trống hoặc chưa tải được tiến độ."
                      icon={Users}
                    />
                  }
                />
              ) : (
                <ManagerDataTable
                  columns={assignmentColumns}
                  data={assignmentData?.students ?? []}
                  isLoading={isLoading}
                  emptyState={
                    <ManagerEmptyState
                      title="Chưa có học viên"
                      description="Roster lớp trống hoặc chưa tải được tiến độ bài tập."
                      icon={Users}
                    />
                  }
                />
              )}
            </div>

            {!isLoading &&
            ((kind === "activity" && !activityData) ||
              (kind === "assignment" && !assignmentData)) ? (
              <div className="border-t border-border px-4 py-3 text-center sm:px-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    kind === "activity" ? retryActivity() : retryAssignment()
                  }
                >
                  Thử tải lại
                </Button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
