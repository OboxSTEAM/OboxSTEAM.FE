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

          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border-0 px-4 sm:px-6"
            >
              <AccordionTrigger className="gap-4 py-4 hover:no-underline [&>svg]:shrink-0">
                <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-[#E5E5E0] bg-[#F5F5F0] sm:size-16">
                    <ImageSlot
                      ratio="4:3"
                      alt={module.name}
                      tone={categoryMeta?.steamKey ?? "neutral"}
                      className="absolute inset-0 rounded-none"
                      sizes="4rem"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-[#2D2D2D]/45 font-mono text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block font-medium leading-snug text-[#4FC3F7] underline-offset-2">
                      {module.name}
                    </span>
                    <span className="block text-xs text-[#6B6B6B]">
                      Mô-đun {index + 1} · {MODULE_TYPE_LABELS[module.moduleType]}
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

                <span className="hidden shrink-0 text-xs font-medium text-[#6B6B6B] sm:inline">
                  Chi tiết
                </span>
              </AccordionTrigger>

              <AccordionContent className="pb-5 pl-[4.25rem] sm:pl-[5.25rem]">
                <dl className="space-y-2 rounded-lg bg-[#FAFAF5] px-3 py-3">
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

                <p className="mt-3 text-sm text-[#6B6B6B]">
                  {hasCourses
                    ? "Danh sách khóa học trong mô-đun này."
                    : "Nội dung khóa học sẽ được cập nhật."}
                </p>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
