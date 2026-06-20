import { CircleCheck } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ImageSlot } from "@/components/common/image-slot";
import type { Module, ProgramWithModules } from "@/lib/api/programs";
import {
  formatProgramPrice,
  MODULE_TYPE_LABELS,
  PROGRAM_CATEGORY_META,
} from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

type ProgramCurriculumProps = {
  program: ProgramWithModules;
  className?: string;
};

function getPrerequisiteName(
  module: Module,
  modules: Module[],
): string | null {
  if (!module.prerequisiteModuleId) return null;
  return (
    modules.find((item) => item.id === module.prerequisiteModuleId)?.name ??
    null
  );
}

function ModuleDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="shrink-0 text-[#6B6B6B]">{label}</dt>
      <dd className="text-right font-medium text-[#2D2D2D]">{value}</dd>
    </div>
  );
}

function LearningOutcomesList({ outcomes }: { outcomes: string[] }) {
  if (outcomes.length === 0) return null;

  return (
    <div>
      <h4 className="font-heading text-base font-semibold text-[#2D2D2D]">
        Bạn sẽ học được
      </h4>
      <ul className="mt-3 space-y-2.5">
        {outcomes.map((outcome) => (
          <li key={outcome} className="flex gap-2.5 text-sm leading-relaxed">
            <CircleCheck
              className="mt-0.5 size-4 shrink-0 text-[#2D2D2D]"
              aria-hidden
            />
            <span className="text-[#2D2D2D]">{outcome}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProgramCurriculum({
  program,
  className,
}: ProgramCurriculumProps) {
  const modules = [...program.modules].sort(
    (left, right) => left.moduleOrder - right.moduleOrder,
  );
  const categoryMeta = program.category
    ? PROGRAM_CATEGORY_META[program.category]
    : null;

  if (modules.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-[#E5E5E0] bg-white p-6 text-sm text-[#6B6B6B]",
          className,
        )}
      >
        Nội dung chương trình sẽ được cập nhật sớm.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[#E5E5E0] bg-white shadow-[0_4px_20px_rgba(45,45,45,0.04)]",
        className,
      )}
    >
      <div className="border-b border-[#E5E5E0] px-6 py-4">
        <h2 className="font-heading text-lg font-semibold text-[#2D2D2D]">
          Chương trình học
        </h2>
        <p className="mt-1 text-sm text-[#6B6B6B]">
          {modules.length} mô-đun trong chương trình này
        </p>
      </div>

      <Accordion className="divide-y divide-[#E5E5E0]">
        {modules.map((module, index) => {
          const prerequisiteName = getPrerequisiteName(module, modules);
          const hasCourses = module.courses.length > 0;
          const hasLearningOutcomes = module.learningOutcomes.length > 0;

          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border-0 px-4 sm:px-6"
            >
              <AccordionTrigger className="gap-4 py-5 hover:no-underline [&>svg]:shrink-0">
                <span className="flex min-w-0 flex-1 items-start gap-4 text-left">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-[#E5E5E0] bg-[#F5F5F0] sm:size-[4.5rem]">
                    <ImageSlot
                      ratio="4:3"
                      alt={module.name}
                      tone={categoryMeta?.steamKey ?? "neutral"}
                      className="absolute inset-0 rounded-none"
                      sizes="4.5rem"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-[#2D2D2D]/40 font-mono text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1 space-y-1 pt-0.5">
                    <span className="block font-medium leading-snug text-[#4FC3F7] underline-offset-2">
                      {module.name}
                    </span>
                    <span className="block text-xs text-[#6B6B6B]">
                      Mô-đun {index + 1} ·{" "}
                      {MODULE_TYPE_LABELS[module.moduleType]}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {module.isMandatory ? (
                        <Badge
                          variant="secondary"
                          className="bg-[#E94B3C]/10 font-normal text-[#E94B3C]"
                        >
                          Bắt buộc
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-[#F5F5F0] font-normal text-[#6B6B6B]"
                        >
                          Tùy chọn
                        </Badge>
                      )}
                    </span>
                  </span>
                </span>

                <span className="hidden shrink-0 text-sm font-medium text-[#4FC3F7] sm:inline">
                  Chi tiết mô-đun
                </span>
              </AccordionTrigger>

              <AccordionContent className="pb-6 pl-[4.25rem] sm:pl-[5.75rem]">
                <div className="space-y-5">
                  {hasLearningOutcomes ? (
                    <LearningOutcomesList outcomes={module.learningOutcomes} />
                  ) : (
                    <p className="text-sm text-[#6B6B6B]">
                      Nội dung học tập sẽ được cập nhật.
                    </p>
                  )}

                  <dl className="space-y-2 rounded-lg border border-[#E5E5E0] bg-[#FAFAF5] px-4 py-3">
                    <ModuleDetailItem
                      label="Học phí mô-đun"
                      value={formatProgramPrice(module.price)}
                    />
                    <ModuleDetailItem
                      label="Phí học lại"
                      value={formatProgramPrice(module.retakeFee)}
                    />
                    {prerequisiteName ? (
                      <ModuleDetailItem
                        label="Yêu cầu tiên quyết"
                        value={prerequisiteName}
                      />
                    ) : null}
                  </dl>

                  {hasCourses ? (
                    <p className="text-sm text-[#6B6B6B]">
                      Danh sách khóa học trong mô-đun này.
                    </p>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
