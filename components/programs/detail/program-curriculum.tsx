import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { Module, ProgramWithModules } from "@/lib/api/programs";
import {
  formatProgramPrice,
  MODULE_TYPE_LABELS,
} from "@/lib/programs/constants";

type ProgramCurriculumProps = {
  program: ProgramWithModules;
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
      <dd className="font-medium text-[#2D2D2D] text-right">{value}</dd>
    </div>
  );
}

export function ProgramCurriculum({ program }: ProgramCurriculumProps) {
  const modules = [...program.modules].sort(
    (left, right) => left.moduleOrder - right.moduleOrder,
  );

  if (modules.length === 0) {
    return (
      <p className="text-sm text-[#6B6B6B]">
        Nội dung chương trình sẽ được cập nhật sớm.
      </p>
    );
  }

  return (
    <Accordion className="rounded-xl border border-[#E5E5E0] bg-white px-4">
      {modules.map((module, index) => {
        const prerequisiteName = getPrerequisiteName(module, modules);
        const hasCourses = module.courses.length > 0;

        return (
          <AccordionItem key={module.id} value={module.id}>
            <AccordionTrigger className="py-3.5 hover:no-underline">
              <span className="flex min-w-0 flex-1 items-center gap-3 pr-2 text-left">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#F5F5F0] font-mono text-xs font-medium text-[#6B6B6B]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block font-medium text-[#2D2D2D] leading-snug">
                    {module.name}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="border-[#E5E5E0] text-[#6B6B6B] font-normal"
                    >
                      {MODULE_TYPE_LABELS[module.moduleType]}
                    </Badge>
                    {module.isMandatory ? (
                      <Badge
                        variant="secondary"
                        className="bg-[#E94B3C]/10 text-[#E94B3C] font-normal"
                      >
                        Bắt buộc
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-[#F5F5F0] text-[#6B6B6B] font-normal"
                      >
                        Tùy chọn
                      </Badge>
                    )}
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 pl-9">
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
  );
}
