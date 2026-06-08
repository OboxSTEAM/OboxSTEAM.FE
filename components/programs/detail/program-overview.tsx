import { Badge } from "@/components/ui/badge";
import type { ProgramWithModules } from "@/lib/api/programs";

type ProgramOverviewProps = {
  program: ProgramWithModules;
};

function parseSkills(skillsGained: string): string[] {
  return skillsGained
    .split(/[,;•\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function ProgramOverview({ program }: ProgramOverviewProps) {
  const skills = parseSkills(program.skillsGained);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-base font-semibold text-[#2D2D2D] mb-2">
          Giới thiệu
        </h2>
        <p className="text-sm leading-relaxed text-[#6B6B6B] whitespace-pre-line">
          {program.description}
        </p>
      </div>

      {skills.length > 0 && (
        <div>
          <h3 className="font-heading text-sm font-semibold text-[#2D2D2D] mb-2">
            Kỹ năng đạt được
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <li key={skill}>
                <Badge
                  variant="secondary"
                  className="bg-[#F5F5F0] text-[#2D2D2D] hover:bg-[#F5F5F0] font-normal"
                >
                  {skill}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
