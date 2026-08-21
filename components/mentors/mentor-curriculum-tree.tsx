"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Beaker,
  ChevronRight,
  ClipboardList,
  FileUp,
  ListChecks,
  Lock,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { Activity } from "@/lib/api/entities/activity";
import type {
  AssignmentListItem,
  AssignmentType,
} from "@/lib/api/entities/assignment";
import type { Module } from "@/lib/api/entities/module";
import type { ResearchMilestone } from "@/lib/api/entities/research-milestone";
import {
  ACTIVITY_TYPE_LABELS,
  ASSIGNMENT_TYPE_LABELS,
} from "@/lib/curriculum/constants";
import { MODULE_TYPE_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

export type MentorCurriculumSelection =
  | { kind: "activity"; activityId: string }
  | { kind: "assignment"; assignmentId: string };

type MentorCurriculumTreeProps = {
  modules: Module[];
  assignmentsByModule: Record<string, AssignmentListItem[]>;
  milestonesByModule: Record<string, ResearchMilestone[]>;
  selection: MentorCurriculumSelection | null;
  onSelect: (next: MentorCurriculumSelection) => void;
  /** Class-aggregate progress from `GET /api/classes/{classId}/curriculum-progress`. */
  progress?: MentorCurriculumTreeProgress | null;
  className?: string;
};

/** Flat lookup maps derived in the panel from `ClassCurriculumProgress`. */
export type MentorCurriculumTreeProgress = {
  totalStudents: number;
  activitiesById: Record<
    string,
    { completedCount: number; inProgressCount: number }
  >;
  assignmentsById: Record<
    string,
    { submittedCount: number; gradedCount: number }
  >;
};

type AssignmentRowData = Pick<
  AssignmentListItem,
  "id" | "title" | "assignmentType" | "moduleId" | "programId"
> & { code?: string | null };

/** Same hierarchy cues as student `CurriculumNav` — vertical spine + horizontal ticks. */
const TREE_LINE = "bg-muted-foreground/35";

const ASSIGNMENT_TYPE_ICON: Record<AssignmentType, LucideIcon> = {
  FileUpload: FileUp,
  Quiz: ListChecks,
  Retrospective: RotateCcw,
};

function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => a.activityOrder - b.activityOrder);
}

function formatModuleIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function formatActivityOrdinal(
  courseIndex: number,
  activityIndex: number,
): string {
  return `${courseIndex + 1}.${activityIndex + 1}`;
}

function countActivitiesInCourses(
  courses: { activities?: Activity[] | null }[],
): number {
  return courses.reduce(
    (sum, course) => sum + (course.activities?.length ?? 0),
    0,
  );
}

function collectActivityIds(
  courses: { activities?: Activity[] | null }[],
): string[] {
  const ids: string[] = [];
  for (const course of courses) {
    for (const activity of course.activities ?? []) {
      ids.push(activity.id);
    }
  }
  return ids;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function moduleActivityProgressPercent(
  activityIds: string[],
  progress: MentorCurriculumTreeProgress | null | undefined,
): number | null {
  if (!progress || progress.totalStudents <= 0 || activityIds.length === 0) {
    return null;
  }
  let completed = 0;
  for (const id of activityIds) {
    completed += progress.activitiesById[id]?.completedCount ?? 0;
  }
  return clampPercent(
    (completed / (activityIds.length * progress.totalStudents)) * 100,
  );
}

function ModuleProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const value = clampPercent(percent);
  const isComplete = value >= 100;

  return (
    <div
      className={cn(
        "mt-2 h-1.5 overflow-hidden rounded-full bg-border",
        className,
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Tiến độ hoạt động ${value}%`}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
          isComplete ? "bg-[#7CB342]" : "bg-accent",
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function TreeBranch({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative ml-3 pl-4", className)}>
      <span
        className={cn(
          "pointer-events-none absolute top-0 bottom-0 left-0 w-px",
          TREE_LINE,
        )}
        aria-hidden
      />
      {children}
    </div>
  );
}

function TreeNode({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <span
        className={cn(
          "pointer-events-none absolute top-[1.375rem] left-0 h-px w-4 -translate-x-4",
          TREE_LINE,
        )}
        aria-hidden
      />
      {children}
    </div>
  );
}

function TreeLeaf({ children }: { children: ReactNode }) {
  return (
    <div className="relative py-0.5">
      <span
        className={cn(
          "pointer-events-none absolute top-[1.375rem] left-0 h-px w-4 -translate-x-4",
          TREE_LINE,
        )}
        aria-hidden
      />
      {children}
    </div>
  );
}

function CourseGroupHeader({
  name,
  activityCount,
  isOpen,
  onToggle,
}: {
  name: string;
  activityCount: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
        isOpen ? "border-b border-border bg-muted/35" : "bg-muted/25",
      )}
      aria-expanded={isOpen}
    >
      <ChevronRight
        className={cn(
          "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
          isOpen && "rotate-90",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Khóa học
        </span>
        <span className="mt-0.5 flex items-baseline gap-2">
          <span className="min-w-0 truncate font-heading text-[15px] leading-snug font-semibold text-foreground">
            {name}
          </span>
          <span className="shrink-0 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
            {activityCount}
          </span>
        </span>
      </span>
    </button>
  );
}

function ActivityRow({
  activity,
  ordinal,
  isSelected,
  onSelect,
  completedCount,
  totalStudents,
}: {
  activity: Activity;
  ordinal: string;
  isSelected: boolean;
  onSelect: () => void;
  completedCount?: number;
  totalStudents?: number;
}) {
  const showProgress =
    typeof completedCount === "number" &&
    typeof totalStudents === "number" &&
    totalStudents > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-11 w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
        isSelected
          ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-border"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
      aria-current={isSelected ? "true" : undefined}
    >
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/60 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border/60">
        {ordinal}
      </span>
      <span className="min-w-0 flex-1 leading-snug">
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1 text-foreground">{activity.name}</span>
          {showProgress ? (
            <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
              {completedCount}/{totalStudents}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
          {ACTIVITY_TYPE_LABELS[activity.activityType]}
        </span>
      </span>
    </button>
  );
}

function AssignmentStratum({
  assignments,
  selection,
  onSelect,
  progress,
}: {
  assignments: AssignmentRowData[];
  selection: MentorCurriculumSelection | null;
  onSelect: (next: MentorCurriculumSelection) => void;
  progress?: MentorCurriculumTreeProgress | null;
}) {
  if (assignments.length === 0) return null;

  return (
    <TreeNode>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1 pt-1">
          <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
            Bài tập · {assignments.length}
          </span>
          <span className="h-px flex-1 bg-border" aria-hidden />
        </div>
        <ul className="space-y-1">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <AssignmentRow
                assignment={assignment}
                selection={selection}
                onSelect={onSelect}
                emphasized
                assignmentProgress={
                  progress?.assignmentsById[assignment.id] ?? null
                }
                totalStudents={progress?.totalStudents}
              />
            </li>
          ))}
        </ul>
      </div>
    </TreeNode>
  );
}

export function MentorCurriculumTree({
  modules,
  assignmentsByModule,
  milestonesByModule,
  selection,
  onSelect,
  progress = null,
  className,
}: MentorCurriculumTreeProps) {
  const reduceMotion = useReducedMotion();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const orderedModules = useMemo(
    () => [...modules].sort((a, b) => a.moduleOrder - b.moduleOrder),
    [modules],
  );

  const defaultOpen = orderedModules[0]?.id ? [orderedModules[0].id] : [];

  const isGroupOpen = (key: string) => openGroups[key] ?? true;

  const toggleGroup = (key: string) => {
    setOpenGroups((current) => ({
      ...current,
      [key]: !(current[key] ?? true),
    }));
  };

  if (orderedModules.length === 0) {
    return (
      <p
        className={cn(
          "px-3 py-8 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        Chương trình chưa có module.
      </p>
    );
  }

  return (
    <div className={cn("space-y-2 p-2.5", className)}>
      <Accordion multiple defaultValue={defaultOpen} className="space-y-2">
        {orderedModules.map((module, moduleIndex) => {
          const courses = [...(module.courses ?? [])];
          const assignments = assignmentsByModule[module.id] ?? [];
          const milestones = [...(milestonesByModule[module.id] ?? [])].sort(
            (a, b) => a.milestoneOrder - b.milestoneOrder,
          );
          const isResearch = module.moduleType === "Research";
          const milestoneAssignmentCount = milestones.filter(
            (m) => m.assignmentId,
          ).length;
          const activityCount = countActivitiesInCourses(courses);
          const activityIds = collectActivityIds(courses);
          const modulePercent = moduleActivityProgressPercent(
            activityIds,
            progress,
          );
          const hasContent =
            courses.length > 0 ||
            assignments.length > 0 ||
            milestones.length > 0;

          const metaParts = [
            MODULE_TYPE_LABELS[module.moduleType],
            courses.length > 0 ? `${courses.length} khóa` : null,
            activityCount > 0 ? `${activityCount} hoạt động` : null,
            isResearch && milestones.length > 0
              ? `${milestones.length} mốc`
              : null,
            modulePercent != null ? `${modulePercent}%` : null,
          ].filter(Boolean);

          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="overflow-hidden rounded-xl border border-border bg-muted/25"
            >
              <AccordionTrigger className="gap-2 px-3 py-3 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-start gap-3 text-left">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-card font-mono text-[11px] font-semibold tabular-nums text-foreground shadow-sm ring-1 ring-border">
                    {formatModuleIndex(moduleIndex)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className="block min-w-0 flex-1 font-medium leading-snug text-foreground">
                        {module.name}
                      </span>
                      {assignments.length > 0 ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-accent/25 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent">
                          <ClipboardList className="size-3" aria-hidden />
                          {assignments.length}
                        </span>
                      ) : null}
                      {isResearch && milestoneAssignmentCount > 0 ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground">
                          <Beaker
                            className="size-3 text-[#7CB342]"
                            aria-hidden
                          />
                          {milestoneAssignmentCount}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {metaParts.join(" · ")}
                    </span>
                    {modulePercent != null ? (
                      <ModuleProgressBar percent={modulePercent} />
                    ) : null}
                  </span>
                </span>
              </AccordionTrigger>

              <AccordionContent className="space-y-1 bg-card/60 px-2.5 pb-3 pt-1">
                {!hasContent ? (
                  <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                    Module chưa có nội dung.
                  </p>
                ) : (
                  <TreeBranch className="space-y-1.5 py-1">
                    {courses.map((course, courseIndex) => {
                      const activities = sortActivities(
                        course.activities ?? [],
                      );
                      const open = isGroupOpen(course.id);

                      return (
                        <TreeNode key={course.id}>
                          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                            <CourseGroupHeader
                              name={course.name}
                              activityCount={activities.length}
                              isOpen={open}
                              onToggle={() => toggleGroup(course.id)}
                            />
                            <AnimatePresence initial={false}>
                              {open ? (
                                <motion.div
                                  key={`${course.id}-children`}
                                  initial={
                                    reduceMotion
                                      ? false
                                      : { height: 0, opacity: 0 }
                                  }
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={
                                    reduceMotion
                                      ? undefined
                                      : { height: 0, opacity: 0 }
                                  }
                                  transition={{
                                    duration: 0.26,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="space-y-0.5 bg-muted/15 p-1.5">
                                    {activities.length === 0 ? (
                                      <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                                        Chưa có hoạt động
                                      </p>
                                    ) : (
                                      activities.map(
                                        (activity, activityIndex) => {
                                          const isSelected =
                                            selection?.kind === "activity" &&
                                            selection.activityId ===
                                              activity.id;

                                          return (
                                            <ActivityRow
                                              key={activity.id}
                                              activity={activity}
                                              ordinal={formatActivityOrdinal(
                                                courseIndex,
                                                activityIndex,
                                              )}
                                              isSelected={isSelected}
                                              onSelect={() =>
                                                onSelect({
                                                  kind: "activity",
                                                  activityId: activity.id,
                                                })
                                              }
                                              completedCount={
                                                progress?.activitiesById[
                                                  activity.id
                                                ]?.completedCount
                                              }
                                              totalStudents={
                                                progress?.totalStudents
                                              }
                                            />
                                          );
                                        },
                                      )
                                    )}
                                  </div>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        </TreeNode>
                      );
                    })}

                    {isResearch
                      ? milestones.map((milestone) => {
                          const open = isGroupOpen(milestone.id);
                          const title =
                            milestone.title || milestone.code || "Milestone";

                          return (
                            <div key={milestone.id}>
                              <TreeNode>
                                <button
                                  type="button"
                                  onClick={() => toggleGroup(milestone.id)}
                                  className="flex w-full items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                                  aria-expanded={open}
                                >
                                  <ChevronRight
                                    className={cn(
                                      "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                                      open && "rotate-90",
                                    )}
                                    aria-hidden
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                                      Mốc · bài nộp
                                    </span>
                                    <span className="mt-0.5 flex items-center gap-1.5 font-heading text-[15px] leading-snug font-semibold text-foreground">
                                      {milestone.isCapstone ? (
                                        <Lock
                                          className="size-3.5 shrink-0 text-foreground"
                                          aria-hidden
                                        />
                                      ) : (
                                        <Beaker
                                          className="size-3.5 shrink-0 text-[#7CB342]"
                                          aria-hidden
                                        />
                                      )}
                                      <span className="truncate">{title}</span>
                                    </span>
                                  </span>
                                  {milestone.assignmentId ? (
                                    <Badge
                                      variant="secondary"
                                      className="mt-0.5 shrink-0 border border-border bg-card text-[10px] text-foreground"
                                    >
                                      Chấm
                                    </Badge>
                                  ) : null}
                                </button>
                              </TreeNode>
                              <AnimatePresence initial={false}>
                                {open && milestone.assignmentId ? (
                                  <motion.div
                                    key={`${milestone.id}-assignment`}
                                    initial={
                                      reduceMotion
                                        ? false
                                        : { height: 0, opacity: 0 }
                                    }
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={
                                      reduceMotion
                                        ? undefined
                                        : { height: 0, opacity: 0 }
                                    }
                                    transition={{
                                      duration: 0.26,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                    className="overflow-hidden"
                                  >
                                    <TreeLeaf>
                                      <AssignmentRow
                                        assignment={{
                                          id: milestone.assignmentId,
                                          title:
                                            milestone.assignment?.title ??
                                            milestone.title,
                                          assignmentType:
                                            milestone.assignment
                                              ?.assignmentType ?? "FileUpload",
                                          moduleId: module.id,
                                          programId: module.programId,
                                        }}
                                        selection={selection}
                                        onSelect={onSelect}
                                        emphasized
                                        assignmentProgress={
                                          progress?.assignmentsById[
                                            milestone.assignmentId
                                          ] ?? null
                                        }
                                        totalStudents={progress?.totalStudents}
                                      />
                                    </TreeLeaf>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>
                          );
                        })
                      : null}

                    <AssignmentStratum
                      assignments={assignments}
                      selection={selection}
                      onSelect={onSelect}
                      progress={progress}
                    />
                  </TreeBranch>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function AssignmentRow({
  assignment,
  selection,
  onSelect,
  emphasized = false,
  assignmentProgress = null,
  totalStudents,
}: {
  assignment: AssignmentRowData;
  selection: MentorCurriculumSelection | null;
  onSelect: (next: MentorCurriculumSelection) => void;
  emphasized?: boolean;
  assignmentProgress?: {
    submittedCount: number;
    gradedCount: number;
  } | null;
  totalStudents?: number;
}) {
  const isSelected =
    selection?.kind === "assignment" &&
    selection.assignmentId === assignment.id;
  const Icon = ASSIGNMENT_TYPE_ICON[assignment.assignmentType] ?? ClipboardList;
  const isQuiz = assignment.assignmentType === "Quiz";

  const pendingGrading =
    assignmentProgress != null
      ? Math.max(
          0,
          assignmentProgress.submittedCount - assignmentProgress.gradedCount,
        )
      : null;

  let progressMeta: string | null = null;
  if (assignmentProgress != null && (totalStudents ?? 0) > 0) {
    progressMeta =
      pendingGrading && pendingGrading > 0
        ? `${assignmentProgress.submittedCount} nộp · ${pendingGrading} chờ chấm`
        : `${assignmentProgress.submittedCount}/${totalStudents} nộp`;
  }

  return (
    <button
      type="button"
      onClick={() =>
        onSelect({ kind: "assignment", assignmentId: assignment.id })
      }
      className={cn(
        "flex min-h-11 w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
        emphasized &&
          !isSelected &&
          "border border-transparent bg-muted/25 hover:border-border hover:bg-muted/50",
        emphasized &&
          isSelected &&
          "border border-accent/40 bg-accent/10 font-medium text-foreground shadow-sm ring-1 ring-accent/20",
        !emphasized &&
          isSelected &&
          "bg-card font-medium text-foreground shadow-sm ring-1 ring-border",
        !emphasized &&
          !isSelected &&
          "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
      aria-current={isSelected ? "true" : undefined}
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
          isQuiz ? "bg-accent/15 text-accent" : "bg-muted text-foreground",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 leading-snug">
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "h-5 px-1.5 text-[10px] font-semibold",
              isQuiz
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border text-muted-foreground",
            )}
          >
            {ASSIGNMENT_TYPE_LABELS[assignment.assignmentType]}
          </Badge>
        </span>
        <span className="mt-0.5 block font-medium text-foreground">
          {assignment.title?.trim() || "Bài tập"}
        </span>
        <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">
          {progressMeta ??
            (isQuiz ? "Bộ đề lớp · chỉnh / khóa" : "Mở tab Chấm bài")}
        </span>
      </span>
    </button>
  );
}
