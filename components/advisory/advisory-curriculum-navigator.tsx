"use client";

import { BookOpen, ChevronRight, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Module, ModuleCourse } from "@/lib/api/entities/module";
import { MODULE_TYPE_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

export type CurriculumSelection = {
  targetType: "Program" | "Module" | "Course";
  targetId: string | null;
  label: string;
  context?: string;
  module?: Module;
  course?: ModuleCourse;
};

type AdvisoryCurriculumNavigatorProps = {
  modules: Module[];
  selected: CurriculumSelection | null;
  onSelect: (selection: CurriculumSelection) => void;
  onFeedback?: (selection: CurriculumSelection) => void;
  isSnapshot?: boolean;
  showFeedbackAction?: boolean;
  className?: string;
};

export function AdvisoryCurriculumNavigator({
  modules,
  selected,
  onSelect,
  onFeedback,
  isSnapshot = false,
  showFeedbackAction = true,
  className,
}: AdvisoryCurriculumNavigatorProps) {
  const sorted = [...modules].sort(
    (left, right) => left.moduleOrder - right.moduleOrder,
  );

  return (
    <nav
      className={cn("flex flex-col overflow-hidden", className)}
      aria-label="Điều hướng curriculum"
    >
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground">Nội dung</h3>
          {isSnapshot ? (
            <Badge variant="outline" className="rounded-md text-[10px]">
              Ảnh chụp
            </Badge>
          ) : (
            <Badge className="rounded-md bg-muted text-[10px] text-foreground">
              Bản nháp
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {sorted.length} học phần
        </p>
      </header>

      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Chưa có học phần.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {sorted.map((module) => {
              const moduleSelected =
                selected?.targetType === "Module" && selected.targetId === module.id;
              const moduleSelection: CurriculumSelection = {
                targetType: "Module",
                targetId: module.id,
                label: module.name,
                context: `Học phần ${module.moduleOrder}`,
                module,
              };

              return (
                <li key={module.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onSelect(moduleSelection)}
                    className={cn(
                      "h-auto w-full justify-start rounded-none px-4 py-3 text-left hover:bg-muted/50",
                      moduleSelected && "bg-primary/5",
                    )}
                  >
                    <div className="flex w-full min-w-0 items-start gap-2">
                      <Layers className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {module.name}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className="rounded-md text-[10px]"
                          >
                            {MODULE_TYPE_LABELS[module.moduleType]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {module.courses?.length ?? 0} khóa
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </Button>

                  {(module.courses ?? []).length > 0 ? (
                    <ul className="border-t border-border/60 bg-background/40">
                      {[...(module.courses ?? [])]
                        .sort((a, b) => a.courseOrder - b.courseOrder)
                        .map((course) => {
                          const courseSelected =
                            selected?.targetType === "Course" &&
                            selected.targetId === course.id;
                          const courseSelection: CurriculumSelection = {
                            targetType: "Course",
                            targetId: course.id,
                            label: course.name,
                            context: `${module.name} · Khóa ${course.courseOrder}`,
                            module,
                            course,
                          };
                          return (
                            <li key={course.id}>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onSelect(courseSelection)}
                                className={cn(
                                  "h-auto w-full justify-start rounded-none py-2 pl-10 pr-4 text-left hover:bg-muted/40",
                                  courseSelected && "bg-primary/5",
                                )}
                              >
                                <div className="flex w-full min-w-0 items-center gap-2">
                                  <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
                                  <span className="truncate text-xs text-foreground">
                                    {course.name}
                                  </span>
                                </div>
                              </Button>
                            </li>
                          );
                        })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {showFeedbackAction && selected && onFeedback ? (
        <footer className="border-t border-border p-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onFeedback(selected)}
            className="h-9 w-full rounded-lg text-xs font-semibold"
          >
            Góp ý về “{selected.label}”
          </Button>
        </footer>
      ) : null}
    </nav>
  );
}
