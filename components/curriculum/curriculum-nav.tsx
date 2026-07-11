"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight, Lock } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { EnrollmentCurriculum, EnrollmentCurriculumAssignment } from "@/lib/api";
import type { CurriculumClassContext } from "@/lib/curriculum/class-context";
import { MODULE_TYPE_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

import { CurriculumClassBar } from "./curriculum-class-bar";
import { CurriculumNavAssignmentItem } from "./curriculum-nav-assignment-item";
import { CurriculumNavItem } from "./curriculum-nav-item";

const TREE_LINE = "bg-learn-faint/35";

type NavGroup = {
  key: string;
  kind: "course" | "milestone";
  name: string;
  activities: EnrollmentCurriculum["modules"][number]["courses"][number]["activities"];
  assignments: EnrollmentCurriculumAssignment[];
};

function sortAssignments(
  assignments: EnrollmentCurriculumAssignment[],
): EnrollmentCurriculumAssignment[] {
  return [...assignments].sort((left, right) =>
    left.assignmentCode.localeCompare(right.assignmentCode),
  );
}

type CurriculumNavProps = {
  curriculum: EnrollmentCurriculum;
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string) => void;
  classContext?: CurriculumClassContext | null;
  className?: string;
};

type NavGroupHeaderProps = {
  name: string;
  kind: "course" | "milestone";
  isOpen: boolean;
  onToggle: () => void;
};

function NavGroupHeader({ name, kind, isOpen, onToggle }: NavGroupHeaderProps) {
  const kindLabel = kind === "course" ? "Khóa học" : "Mốc";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start gap-2 rounded-lg border border-learn-border bg-learn-surface-2 px-3 py-2.5 text-left transition-colors"
      aria-expanded={isOpen}
    >
      <ChevronRight
        className={cn(
          "mt-0.5 size-4 shrink-0 text-learn-faint transition-transform duration-200 motion-reduce:transition-none",
          isOpen && "rotate-90",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-learn-faint uppercase">
          {kindLabel}
        </span>
        <span className="mt-0.5 block font-heading text-[15px] leading-snug font-semibold text-learn-text-strong">
          {name}
        </span>
      </span>
    </button>
  );
}

function NavTreeBranch({
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

function NavTreeNode({ children }: { children: ReactNode }) {
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

function NavActivityNode({ children }: { children: ReactNode }) {
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

function formatModuleIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function CurriculumNav({
  curriculum,
  selectedActivityId,
  onSelectActivity,
  classContext = null,
  className,
}: CurriculumNavProps) {
  const reduceMotion = useReducedMotion();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const modules = [...curriculum.modules].sort(
    (left, right) => left.moduleOrder - right.moduleOrder,
  );

  const defaultOpen = modules
    .filter((module) => !module.isLocked)
    .map((module) => module.moduleId);

  const progress = Math.min(100, Math.max(0, curriculum.progressPercent));

  const isGroupOpen = (key: string) => openGroups[key] ?? true;

  const toggleGroup = (key: string) => {
    setOpenGroups((current) => ({
      ...current,
      [key]: !(current[key] ?? true),
    }));
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="px-4 py-4">
        <h2 className="font-heading text-base font-semibold text-learn-text-strong">
          {curriculum.programName}
        </h2>
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs text-learn-muted">
            <span>Tiến độ chương trình</span>
            <span className="font-mono tabular-nums">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-learn-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-learn-success to-learn-accent transition-[width] motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {classContext ? <CurriculumClassBar classContext={classContext} /> : null}

      <div className="space-y-2 border-t border-learn-border/80 p-3 pt-4">
        <Accordion multiple defaultValue={defaultOpen} className="space-y-2">
          {modules.map((module, index) => {
            const courses = [...module.courses].sort(
              (left, right) => left.courseOrder - right.courseOrder,
            );
            const milestones = [...module.milestones].sort(
              (left, right) => left.milestoneOrder - right.milestoneOrder,
            );

            const groups: NavGroup[] = [
              ...courses.map((course) => ({
                key: course.courseId,
                kind: "course" as const,
                name: course.courseName,
                activities: [...course.activities].sort(
                  (left, right) => left.activityOrder - right.activityOrder,
                ),
                assignments: sortAssignments(course.assignments),
              })),
              ...milestones.map((milestone) => ({
                key: milestone.milestoneId,
                kind: "milestone" as const,
                name: milestone.milestoneName,
                activities: [...milestone.activities].sort(
                  (left, right) => left.activityOrder - right.activityOrder,
                ),
                assignments: milestone.assignment
                  ? [milestone.assignment]
                  : [],
              })),
            ];

            const moduleAssignments = sortAssignments(module.assignments);

            return (
              <AccordionItem
                key={module.moduleId}
                value={module.moduleId}
                className="overflow-hidden rounded-xl border border-learn-border bg-learn-surface-2"
              >
                <AccordionTrigger
                  className={cn(
                    "px-3 py-3 hover:no-underline",
                    module.isLocked && "cursor-not-allowed opacity-60 [&>svg]:hidden",
                  )}
                  disabled={module.isLocked}
                >
                  <span className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                        "bg-learn-surface-3 font-mono text-[11px] font-semibold tabular-nums",
                        module.isLocked
                          ? "text-learn-faint"
                          : "text-learn-text-strong",
                      )}
                    >
                      {formatModuleIndex(index)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        {module.isLocked ? (
                          <Lock
                            className="mt-0.5 size-3.5 shrink-0 text-learn-faint"
                            aria-hidden
                          />
                        ) : null}
                        <span className="block font-medium leading-snug text-learn-text-strong">
                          {module.moduleName}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-learn-muted">
                        {MODULE_TYPE_LABELS[module.moduleType]}
                        {module.lockReason ? ` · ${module.lockReason}` : null}
                      </span>
                    </span>
                  </span>
                </AccordionTrigger>

                <AccordionContent className="space-y-1 bg-learn-bg px-2.5 pb-3 pt-1">
                  <NavTreeBranch className="space-y-0.5 py-1">
                    {groups.map((group) => {
                      const open = isGroupOpen(group.key);

                      return (
                        <div key={group.key}>
                          <NavTreeNode>
                            <NavGroupHeader
                              name={group.name}
                              kind={group.kind}
                              isOpen={open}
                              onToggle={() => toggleGroup(group.key)}
                            />
                          </NavTreeNode>
                          <AnimatePresence initial={false}>
                            {open ? (
                              <motion.div
                                key={`${group.key}-activities`}
                                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={
                                  reduceMotion ? undefined : { height: 0, opacity: 0 }
                                }
                                transition={{
                                  duration: 0.26,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                                className="overflow-hidden"
                              >
                                {group.activities.map((activity) => (
                                  <NavActivityNode key={activity.activityId}>
                                    <CurriculumNavItem
                                      activityId={activity.activityId}
                                      activityName={activity.activityName}
                                      activityType={activity.activityType}
                                      status={activity.status}
                                      isSelected={
                                        selectedActivityId === activity.activityId
                                      }
                                      onSelect={onSelectActivity}
                                      inTree
                                    />
                                  </NavActivityNode>
                                ))}
                                {group.assignments.map((assignment) => (
                                  <NavActivityNode key={assignment.assignmentId}>
                                    <CurriculumNavAssignmentItem
                                      assignment={assignment}
                                      inTree
                                    />
                                  </NavActivityNode>
                                ))}
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                    {moduleAssignments.length > 0 ? (
                      <div className="pt-1">
                        {moduleAssignments.map((assignment) => (
                          <NavActivityNode key={assignment.assignmentId}>
                            <CurriculumNavAssignmentItem
                              assignment={assignment}
                              inTree
                            />
                          </NavActivityNode>
                        ))}
                      </div>
                    ) : null}
                  </NavTreeBranch>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
