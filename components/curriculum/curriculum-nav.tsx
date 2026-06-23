"use client";

import { Lock } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { EnrollmentCurriculum } from "@/lib/api";
import { MODULE_TYPE_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

import { CurriculumNavItem } from "./curriculum-nav-item";

type CurriculumNavProps = {
  curriculum: EnrollmentCurriculum;
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string) => void;
  className?: string;
};

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="px-3 py-2 font-mono text-[11px] font-medium tracking-[0.12em] text-[#6B6B6B] uppercase">
      {children}
    </p>
  );
}

export function CurriculumNav({
  curriculum,
  selectedActivityId,
  onSelectActivity,
  className,
}: CurriculumNavProps) {
  const modules = [...curriculum.modules].sort(
    (left, right) => left.moduleOrder - right.moduleOrder,
  );

  const defaultOpen = modules
    .filter((module) => !module.isLocked)
    .map((module) => module.moduleId);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="border-b border-[#E5E5E0] px-4 py-4">
        <h2 className="font-heading text-base font-semibold text-[#2D2D2D]">
          {curriculum.programName}
        </h2>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Tiến độ chương trình</span>
            <span>{curriculum.progressPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#E5E5E0]">
            <div
              className="h-full rounded-full bg-[#4FC3F7] transition-[width] motion-reduce:transition-none"
              style={{ width: `${Math.min(100, Math.max(0, curriculum.progressPercent))}%` }}
            />
          </div>
        </div>
      </div>

      <Accordion
        multiple
        defaultValue={defaultOpen}
        className="divide-y divide-[#E5E5E0]"
      >
        {modules.map((module, index) => {
          const courses = [...module.courses].sort(
            (left, right) => left.courseOrder - right.courseOrder,
          );
          const milestones = [...module.milestones].sort(
            (left, right) => left.milestoneOrder - right.milestoneOrder,
          );

          return (
            <AccordionItem
              key={module.moduleId}
              value={module.moduleId}
              className="border-0"
            >
              <AccordionTrigger
                className={cn(
                  "px-4 py-4 hover:no-underline",
                  module.isLocked && "cursor-not-allowed opacity-70 [&>svg]:hidden",
                )}
                disabled={module.isLocked}
              >
                <span className="flex min-w-0 flex-1 items-start gap-2 text-left">
                  {module.isLocked ? (
                    <Lock className="mt-0.5 size-4 shrink-0 text-[#6B6B6B]" aria-hidden />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block font-medium text-[#2D2D2D]">
                      Mô-đun {index + 1} · {module.moduleName}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#6B6B6B]">
                      {MODULE_TYPE_LABELS[module.moduleType]}
                      {module.lockReason ? ` · ${module.lockReason}` : null}
                    </span>
                  </span>
                </span>
              </AccordionTrigger>

              <AccordionContent className="px-2 pb-4">
                {courses.map((course) => (
                  <div key={course.courseId} className="mb-2">
                    <GroupLabel>{`Khóa: ${course.courseName}`}</GroupLabel>
                    <div className="space-y-0.5">
                      {[...course.activities]
                        .sort((left, right) => left.activityOrder - right.activityOrder)
                        .map((activity) => (
                          <CurriculumNavItem
                            key={activity.activityId}
                            activityId={activity.activityId}
                            activityName={activity.activityName}
                            activityType={activity.activityType}
                            status={activity.status}
                            isSelected={selectedActivityId === activity.activityId}
                            onSelect={onSelectActivity}
                          />
                        ))}
                    </div>
                  </div>
                ))}

                {milestones.map((milestone) => (
                  <div key={milestone.milestoneId} className="mb-2">
                    <GroupLabel>{`Mốc: ${milestone.milestoneName}`}</GroupLabel>
                    <div className="space-y-0.5">
                      {[...milestone.activities]
                        .sort((left, right) => left.activityOrder - right.activityOrder)
                        .map((activity) => (
                          <CurriculumNavItem
                            key={activity.activityId}
                            activityId={activity.activityId}
                            activityName={activity.activityName}
                            activityType={activity.activityType}
                            status={activity.status}
                            isSelected={selectedActivityId === activity.activityId}
                            onSelect={onSelectActivity}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
