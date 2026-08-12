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
  ACTIVITY_TITLE_PREFIX,
  ACTIVITY_TYPE_LABELS,
  ASSIGNMENT_TITLE_PREFIX,
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
  className?: string;
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

function GroupHeader({
  name,
  kind,
  isOpen,
  onToggle,
}: {
  name: string;
  kind: "course" | "milestone";
  isOpen: boolean;
  onToggle: () => void;
}) {
  const kindLabel = kind === "course" ? "Khóa học" : "Mốc";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-left transition-colors hover:bg-muted/70"
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
        <span className="mt-0.5 block truncate font-heading text-[15px] leading-snug font-semibold text-foreground">
          {name}
        </span>
      </span>
    </button>
  );
}

function AssignmentPriorityBlock({
  assignments,
  selection,
  onSelect,
}: {
  assignments: AssignmentRowData[];
  selection: MentorCurriculumSelection | null;
  onSelect: (next: MentorCurriculumSelection) => void;
}) {
  if (assignments.length === 0) return null;

  return (
    <TreeNode>
      <div className="overflow-hidden rounded-xl border border-primary/35 bg-primary/[0.06] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--primary)_12%,transparent)]">
        <div className="flex items-center gap-2 border-b border-primary/20 px-3 py-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <ClipboardList className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.14em] text-primary uppercase">
              Ưu tiên mentor
            </p>
            <p className="truncate text-xs font-semibold text-foreground">
              Bài tập cần theo dõi
            </p>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 border border-primary/25 bg-card font-mono text-[10px] text-primary"
          >
            {assignments.length}
          </Badge>
        </div>
        <ul className="space-y-1 p-1.5">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <AssignmentRow
                assignment={assignment}
                selection={selection}
                onSelect={onSelect}
                emphasized
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
          const attentionCount = assignments.length + milestoneAssignmentCount;
          const hasContent =
            courses.length > 0 ||
            assignments.length > 0 ||
            milestones.length > 0;

          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className={cn(
                "overflow-hidden rounded-xl border bg-muted/25",
                attentionCount > 0
                  ? "border-primary/25"
                  : "border-border",
              )}
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
                      {attentionCount > 0 ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                          <ClipboardList className="size-3" aria-hidden />
                          {attentionCount}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {MODULE_TYPE_LABELS[module.moduleType]}
                      {attentionCount > 0
                        ? ` · ${attentionCount} bài cần chú ý`
                        : null}
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
                    {/* Assignments first — mentor priority */}
                    <AssignmentPriorityBlock
                      assignments={assignments}
                      selection={selection}
                      onSelect={onSelect}
                    />

                    {courses.map((course) => {
                      const activities = sortActivities(
                        course.activities ?? [],
                      );
                      const open = isGroupOpen(course.id);

                      return (
                        <div key={course.id}>
                          <TreeNode>
                            <GroupHeader
                              name={course.name}
                              kind="course"
                              isOpen={open}
                              onToggle={() => toggleGroup(course.id)}
                            />
                          </TreeNode>
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
                                {activities.length === 0 ? (
                                  <TreeLeaf>
                                    <p className="px-2 py-2 text-[11px] text-muted-foreground">
                                      Chưa có hoạt động
                                    </p>
                                  </TreeLeaf>
                                ) : (
                                  activities.map((activity) => {
                                    const isSelected =
                                      selection?.kind === "activity" &&
                                      selection.activityId === activity.id;
                                    const prefix =
                                      ACTIVITY_TITLE_PREFIX[
                                        activity.activityType
                                      ];

                                    return (
                                      <TreeLeaf key={activity.id}>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onSelect({
                                              kind: "activity",
                                              activityId: activity.id,
                                            })
                                          }
                                          className={cn(
                                            "flex min-h-11 w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                                            isSelected
                                              ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-border"
                                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                          )}
                                          aria-current={
                                            isSelected ? "true" : undefined
                                          }
                                        >
                                          <span className="min-w-0 leading-snug">
                                            <span className="text-[11px] text-muted-foreground">
                                              {prefix}:{" "}
                                            </span>
                                            {activity.name}
                                            <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                                              {
                                                ACTIVITY_TYPE_LABELS[
                                                  activity.activityType
                                                ]
                                              }
                                            </span>
                                          </span>
                                        </button>
                                      </TreeLeaf>
                                    );
                                  })
                                )}
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
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
                                  className="flex w-full items-start gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-primary/[0.08]"
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
                                    <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-primary uppercase">
                                      Mốc · bài nộp
                                    </span>
                                    <span className="mt-0.5 flex items-center gap-1.5 font-heading text-[15px] leading-snug font-semibold text-foreground">
                                      {milestone.isCapstone ? (
                                        <Lock
                                          className="size-3.5 shrink-0 text-primary"
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
                                      className="mt-0.5 shrink-0 border border-primary/20 bg-card text-[10px] text-primary"
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
                                      />
                                    </TreeLeaf>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>
                          );
                        })
                      : null}
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
}: {
  assignment: AssignmentRowData;
  selection: MentorCurriculumSelection | null;
  onSelect: (next: MentorCurriculumSelection) => void;
  emphasized?: boolean;
}) {
  const isSelected =
    selection?.kind === "assignment" &&
    selection.assignmentId === assignment.id;
  const prefix = ASSIGNMENT_TITLE_PREFIX[assignment.assignmentType];
  const Icon = ASSIGNMENT_TYPE_ICON[assignment.assignmentType] ?? ClipboardList;
  const isQuiz = assignment.assignmentType === "Quiz";

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
          "border border-primary/20 bg-card/90 hover:border-primary/40 hover:bg-card",
        emphasized &&
          isSelected &&
          "border border-primary/50 bg-card font-medium text-foreground shadow-sm ring-2 ring-primary/20",
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
          isQuiz
            ? "bg-accent/15 text-accent"
            : "bg-primary/12 text-primary",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 leading-snug">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">{prefix}:</span>
          <Badge
            variant="outline"
            className="h-5 border-primary/25 px-1.5 text-[10px] font-semibold text-primary"
          >
            {ASSIGNMENT_TYPE_LABELS[assignment.assignmentType]}
          </Badge>
        </span>
        <span className="mt-0.5 block font-medium text-foreground">
          {assignment.title?.trim() || "Bài tập"}
        </span>
        <span className="mt-0.5 block text-[10px] font-medium text-primary/80">
          {isQuiz ? "Bộ đề lớp · chỉnh / khóa" : "Mở tab Chấm bài"}
        </span>
      </span>
    </button>
  );
}
