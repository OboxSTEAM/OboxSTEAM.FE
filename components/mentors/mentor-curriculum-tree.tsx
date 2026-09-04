"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Beaker,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Lock,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Activity } from "@/lib/api/entities/activity";
import type {
  AssignmentListItem,
  AssignmentType,
} from "@/lib/api/entities/assignment";
import type {
  ClassCurriculumActivityNavStatus,
  ClassCurriculumAssignmentNavStatus,
} from "@/lib/api/entities/class-curriculum-progress";
import type { ClassSessionStatus } from "@/lib/api/entities/class-session";
import type { Module } from "@/lib/api/entities/module";
import type { ResearchMilestone } from "@/lib/api/entities/research-milestone";
import {
  ACTIVITY_TITLE_PREFIX,
  ASSIGNMENT_TITLE_PREFIX,
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
  /** Scroll to and reveal this activity in the tree (e.g. deep-link). */
  focusActivityId?: string | null;
  /** Class-scoped progress from `GET /api/classes/{classId}/curriculum-progress`. */
  progress?: MentorCurriculumTreeProgress | null;
  className?: string;
};

/** Flat lookup maps derived in the panel from `ClassCurriculumProgress`. */
export type MentorCurriculumTreeProgress = {
  totalStudents: number;
  currentActivityId: string | null;
  activitiesById: Record<
    string,
    {
      status: ClassCurriculumActivityNavStatus;
      completedCount: number;
      inProgressCount: number;
      classSessionId: string | null;
      sessionStatus: ClassSessionStatus | null;
    }
  >;
  assignmentsById: Record<
    string,
    {
      status: ClassCurriculumAssignmentNavStatus;
      submittedCount: number;
      gradedCount: number;
    }
  >;
};

type AssignmentRowData = Pick<
  AssignmentListItem,
  "id" | "title" | "assignmentType" | "moduleId" | "programId"
> & { code?: string | null };

/** Same hierarchy cues as student `CurriculumNav` — vertical spine + horizontal ticks. */
const TREE_LINE = "bg-muted-foreground/35";

function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => a.activityOrder - b.activityOrder);
}

function formatModuleIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function findActivityLocation(
  modules: Module[],
  activityId: string,
): { moduleId: string; courseId: string } | null {
  for (const module of modules) {
    for (const course of module.courses ?? []) {
      if ((course.activities ?? []).some((activity) => activity.id === activityId)) {
        return { moduleId: module.id, courseId: course.id };
      }
    }
  }
  return null;
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

function NavGroupHeader({
  name,
  kind,
  isOpen,
  onToggle,
  isCapstone = false,
}: {
  name: string;
  kind: "course" | "milestone";
  isOpen: boolean;
  onToggle: () => void;
  isCapstone?: boolean;
}) {
  const kindLabel = kind === "course" ? "Khóa học" : "Mốc";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
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
          {kindLabel}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 font-heading text-[15px] leading-snug font-semibold text-foreground">
          {kind === "milestone" ? (
            isCapstone ? (
              <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <Beaker className="size-3.5 shrink-0 text-[#7CB342]" aria-hidden />
            )
          ) : null}
          <span className="min-w-0 truncate">{name}</span>
        </span>
      </span>
    </button>
  );
}

function ActivityStatusIcon({
  status,
}: {
  status: ClassCurriculumActivityNavStatus;
}) {
  if (status === "completed") {
    return (
      <CheckCircle2
        className="size-4 shrink-0 text-[#7CB342]"
        aria-hidden
      />
    );
  }
  if (status === "current") {
    return (
      <span
        className="size-2.5 shrink-0 rounded-full bg-accent"
        aria-hidden
      />
    );
  }
  return <Circle className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />;
}

function AssignmentStatusIcon({
  status,
}: {
  status: ClassCurriculumAssignmentNavStatus;
}) {
  if (status === "completed") {
    return (
      <CheckCircle2
        className="size-4 shrink-0 text-[#7CB342]"
        aria-hidden
      />
    );
  }
  if (status === "submitted") {
    return (
      <ClipboardList className="size-4 shrink-0 text-accent" aria-hidden />
    );
  }
  return <Circle className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />;
}

function ActivityRow({
  activity,
  status,
  isSelected,
  shouldScrollIntoView,
  onSelect,
}: {
  activity: Activity;
  status: ClassCurriculumActivityNavStatus;
  isSelected: boolean;
  shouldScrollIntoView?: boolean;
  onSelect: () => void;
}) {
  const rowRef = useRef<HTMLButtonElement>(null);
  const prefix = ACTIVITY_TITLE_PREFIX[activity.activityType];
  const isCompleted = status === "completed";

  useEffect(() => {
    if (!shouldScrollIntoView) return;
    const timer = window.setTimeout(() => {
      rowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [shouldScrollIntoView, activity.id]);

  return (
    <button
      ref={rowRef}
      type="button"
      data-activity-id={activity.id}
      onClick={onSelect}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
        isSelected
          ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-border"
          : "hover:bg-muted/50",
        isCompleted && !isSelected && "text-muted-foreground",
        !isCompleted && !isSelected && "text-muted-foreground hover:text-foreground",
      )}
      aria-current={isSelected ? "true" : undefined}
    >
      <ActivityStatusIcon status={status} />
      <span className="min-w-0 leading-snug">
        <span className="text-muted-foreground/80">{prefix}: </span>
        <span className={cn(isSelected && "text-foreground")}>{activity.name}</span>
      </span>
    </button>
  );
}

function AssignmentRow({
  assignment,
  status,
  isSelected,
  onSelect,
  titlePrefix,
}: {
  assignment: AssignmentRowData;
  status: ClassCurriculumAssignmentNavStatus;
  isSelected: boolean;
  onSelect: () => void;
  /** Override prefix for milestone deliverables (`Mốc`). */
  titlePrefix?: string;
}) {
  const prefix =
    titlePrefix ??
    ASSIGNMENT_TITLE_PREFIX[assignment.assignmentType as AssignmentType] ??
    "Bài tập";
  const isCompleted = status === "completed";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
        isSelected
          ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-border"
          : "hover:bg-muted/50",
        isCompleted && !isSelected && "text-muted-foreground",
        !isCompleted && !isSelected && "text-muted-foreground hover:text-foreground",
      )}
      aria-current={isSelected ? "true" : undefined}
    >
      <AssignmentStatusIcon status={status} />
      <span className="min-w-0 leading-snug">
        <span className="text-muted-foreground/80">{prefix}: </span>
        <span className={cn(isSelected && "text-foreground")}>
          {assignment.title?.trim() || "Bài tập"}
        </span>
      </span>
    </button>
  );
}

function AssignmentSection({
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
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-1 pt-1">
          <ClipboardList
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
            Bài tập
          </span>
          <span className="h-px flex-1 bg-border" aria-hidden />
        </div>
        <ul className="space-y-0.5 pl-1">
          {assignments.map((assignment) => {
            const isSelected =
              selection?.kind === "assignment" &&
              selection.assignmentId === assignment.id;
            const status =
              progress?.assignmentsById[assignment.id]?.status ?? "available";

            return (
              <li key={assignment.id}>
                <AssignmentRow
                  assignment={assignment}
                  status={status}
                  isSelected={isSelected}
                  onSelect={() =>
                    onSelect({
                      kind: "assignment",
                      assignmentId: assignment.id,
                    })
                  }
                />
              </li>
            );
          })}
        </ul>
      </div>
    </TreeNode>
  );
}

function CollapsibleGroup({
  groupKey,
  isOpen,
  header,
  children,
  reduceMotion,
}: {
  groupKey: string;
  isOpen: boolean;
  header: ReactNode;
  children: ReactNode;
  reduceMotion: boolean | null;
}) {
  return (
    <TreeNode>
      <div className="space-y-1">
        {header}
        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              key={`${groupKey}-children`}
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <TreeBranch className="space-y-0.5 py-0.5">{children}</TreeBranch>
            </motion.div>
          ) : null}
        </AnimatePresence>
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
  focusActivityId = null,
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
  const [openModules, setOpenModules] = useState<string[]>(defaultOpen);

  useEffect(() => {
    if (!focusActivityId || orderedModules.length === 0) return;
    const location = findActivityLocation(orderedModules, focusActivityId);
    if (!location) return;
    setOpenModules((prev) =>
      prev.includes(location.moduleId) ? prev : [...prev, location.moduleId],
    );
    setOpenGroups((prev) => ({ ...prev, [location.courseId]: true }));
  }, [focusActivityId, orderedModules]);

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
      <Accordion
        multiple
        value={openModules}
        onValueChange={setOpenModules}
        className="space-y-2"
      >
        {orderedModules.map((module, moduleIndex) => {
          const courses = [...(module.courses ?? [])];
          const assignments = assignmentsByModule[module.id] ?? [];
          const milestones = [...(milestonesByModule[module.id] ?? [])].sort(
            (a, b) => a.milestoneOrder - b.milestoneOrder,
          );
          const hasContent =
            courses.length > 0 ||
            assignments.length > 0 ||
            milestones.length > 0;

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
                    <span className="block min-w-0 font-medium leading-snug text-foreground">
                      {module.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {MODULE_TYPE_LABELS[module.moduleType]}
                    </span>
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
                    {courses.map((course) => {
                      const activities = sortActivities(course.activities ?? []);
                      const open = isGroupOpen(course.id);

                      return (
                        <CollapsibleGroup
                          key={course.id}
                          groupKey={course.id}
                          isOpen={open}
                          reduceMotion={reduceMotion}
                          header={
                            <NavGroupHeader
                              name={course.name}
                              kind="course"
                              isOpen={open}
                              onToggle={() => toggleGroup(course.id)}
                            />
                          }
                        >
                          {activities.length === 0 ? (
                            <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                              Chưa có hoạt động
                            </p>
                          ) : (
                            activities.map((activity) => {
                              const isSelected =
                                selection?.kind === "activity" &&
                                selection.activityId === activity.id;
                              const status =
                                progress?.activitiesById[activity.id]?.status ??
                                "available";

                              return (
                                <TreeLeaf key={activity.id}>
                                  <ActivityRow
                                    activity={activity}
                                    status={status}
                                    isSelected={isSelected}
                                    shouldScrollIntoView={
                                      focusActivityId === activity.id
                                    }
                                    onSelect={() =>
                                      onSelect({
                                        kind: "activity",
                                        activityId: activity.id,
                                      })
                                    }
                                  />
                                </TreeLeaf>
                              );
                            })
                          )}
                        </CollapsibleGroup>
                      );
                    })}

                    {milestones.map((milestone) => {
                      const open = isGroupOpen(milestone.id);
                      const title =
                        milestone.title || milestone.code || "Milestone";
                      const linkedActivities = [
                        ...(milestone.activities ?? []),
                      ].sort((a, b) => a.displayOrder - b.displayOrder);

                      return (
                        <CollapsibleGroup
                          key={milestone.id}
                          groupKey={milestone.id}
                          isOpen={open}
                          reduceMotion={reduceMotion}
                          header={
                            <NavGroupHeader
                              name={title}
                              kind="milestone"
                              isOpen={open}
                              isCapstone={milestone.isCapstone}
                              onToggle={() => toggleGroup(milestone.id)}
                            />
                          }
                        >
                          {linkedActivities.length === 0 &&
                          !milestone.assignmentId ? (
                            <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                              Chưa có nội dung mốc
                            </p>
                          ) : null}

                          {linkedActivities.map((linked) => {
                            const activityId = linked.activityId;
                            const isSelected =
                              selection?.kind === "activity" &&
                              selection.activityId === activityId;
                            const status =
                              progress?.activitiesById[activityId]?.status ??
                              "available";
                            const syntheticActivity: Activity = {
                              id: activityId,
                              courseId: "",
                              name:
                                linked.activityTitle?.trim() ||
                                linked.activityCode ||
                                "Hoạt động",
                              activityType: linked.activityType,
                              activityOrder: linked.displayOrder,
                              requireQrCheckin: false,
                              requireMediaEvidence: false,
                            };

                            return (
                              <TreeLeaf key={linked.id}>
                                <ActivityRow
                                  activity={syntheticActivity}
                                  status={status}
                                  isSelected={isSelected}
                                  shouldScrollIntoView={
                                    focusActivityId === activityId
                                  }
                                  onSelect={() =>
                                    onSelect({
                                      kind: "activity",
                                      activityId,
                                    })
                                  }
                                />
                              </TreeLeaf>
                            );
                          })}

                          {milestone.assignmentId ? (
                            <TreeLeaf>
                              <AssignmentRow
                                assignment={{
                                  id: milestone.assignmentId,
                                  title:
                                    milestone.assignment?.title ??
                                    milestone.title,
                                  assignmentType:
                                    milestone.assignment?.assignmentType ??
                                    "FileUpload",
                                  moduleId: module.id,
                                  programId: module.programId,
                                }}
                                status={
                                  progress?.assignmentsById[
                                    milestone.assignmentId
                                  ]?.status ?? "available"
                                }
                                isSelected={
                                  selection?.kind === "assignment" &&
                                  selection.assignmentId ===
                                    milestone.assignmentId
                                }
                                titlePrefix="Mốc"
                                onSelect={() =>
                                  onSelect({
                                    kind: "assignment",
                                    assignmentId: milestone.assignmentId!,
                                  })
                                }
                              />
                            </TreeLeaf>
                          ) : null}
                        </CollapsibleGroup>
                      );
                    })}

                    <AssignmentSection
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
