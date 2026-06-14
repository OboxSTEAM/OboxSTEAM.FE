import type { LucideIcon } from "lucide-react";
import { BookOpen, Clock, Layers, Library } from "lucide-react";

import type { ProgramWithModules } from "@/lib/api/programs";
import { PROGRAM_LEVEL_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

import { ProgramSidebarHead } from "./program-detail-enrollment-head";
import { ProgramEnrollCta } from "./program-enroll-cta";

type ProgramSidebarProps = {
  program: ProgramWithModules;
  className?: string;
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="inline-flex items-center gap-1.5 text-xs text-[#6B6B6B]">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </p>
      <p className="text-sm font-medium leading-snug text-[#2D2D2D]">{value}</p>
    </div>
  );
}

export function ProgramSidebar({ program, className }: ProgramSidebarProps) {
  const moduleCount = program.modules.length;

  return (
    <aside
      className={cn(
        "rounded-xl border border-[#E5E5E0] bg-white p-5 shadow-[0_4px_20px_rgba(45,45,45,0.05)]",
        className,
      )}
    >
      <ProgramSidebarHead price={program.price} />

      <ProgramEnrollCta
        programId={program.id}
        price={program.price}
        variant="sidebar"
        className="mt-4"
      />

      <div className="mt-5 space-y-4 border-t border-[#E5E5E0] pt-4">
        <DetailRow
          icon={Layers}
          label="Cấp độ"
          value={PROGRAM_LEVEL_LABELS[program.level]}
        />
        <DetailRow
          icon={Clock}
          label="Thời lượng"
          value={program.estimatedDuration}
        />
        <DetailRow
          icon={BookOpen}
          label="Mô-đun"
          value={`${moduleCount} mô-đun`}
        />
        <DetailRow icon={Library} label="Series" value={program.seriesName} />
      </div>
    </aside>
  );
}
