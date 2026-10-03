import type { ProgramWithModules } from "@/lib/api/programs";
import { cn } from "@/lib/utils";

type ProgramOverviewProps = {
  program: ProgramWithModules;
  className?: string;
};

export function ProgramOverview({ program, className }: ProgramOverviewProps) {
  const skills = program.skills.filter(
    (skill) => skill.name?.trim() || skill.code?.trim(),
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-[#E5E5E0] bg-white p-6 shadow-[0_4px_20px_rgba(45,45,45,0.04)]",
        className,
      )}
    >
      <h2 className="font-heading text-lg font-semibold text-[#2D2D2D]">
        Giới thiệu chương trình
      </h2>

      <div className="mt-4 space-y-6">
        <div>
          <h3 className="mb-2 font-heading text-base font-semibold text-[#2D2D2D]">
            Mô tả
          </h3>
          <p className="text-sm leading-relaxed text-[#6B6B6B] whitespace-pre-line">
            {program.description}
          </p>
        </div>

        <div>
          <h3 className="mb-3 font-heading text-base font-semibold text-[#2D2D2D]">
            Kỹ năng đạt được
          </h3>
          {skills.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li key={skill.id}>
                  <span className="inline-flex rounded-md bg-[#E8EEF5] px-3 py-1.5 text-sm font-medium text-[#2D2D2D]">
                    {skill.name?.trim() || skill.code}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#6B6B6B]">Chưa có kỹ năng.</p>
          )}
        </div>
      </div>
    </div>
  );
}
