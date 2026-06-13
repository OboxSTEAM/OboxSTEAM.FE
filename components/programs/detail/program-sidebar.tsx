import type { LucideIcon } from "lucide-react";
import { BookOpen, Clock, Layers, Library } from "lucide-react";

import type { ProgramWithModules } from "@/lib/api/programs";
import {
  getProgramPriceParts,
  PROGRAM_LEVEL_LABELS,
} from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

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
  const priceParts = getProgramPriceParts(program.price);

  return (
    <aside
      className={cn(
        "rounded-xl border border-[#E5E5E0] bg-white p-5 shadow-[0_4px_20px_rgba(45,45,45,0.05)]",
        className,
      )}
    >
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
          Học phí
        </p>
        {priceParts.isFree ? (
          <p className="mt-1 font-heading text-3xl font-extrabold text-[#4FC3F7]">
            {priceParts.label}
          </p>
        ) : (
          <p
            className="mt-1 inline-flex items-baseline justify-center gap-1"
            aria-label={`Giá ${priceParts.amount} ${priceParts.unit}`}
          >
            <span className="font-heading text-3xl font-extrabold tabular-nums leading-none text-[#E94B3C]">
              {priceParts.amount}
            </span>
            <span className="text-sm font-bold text-[#E94B3C]/80">
              {priceParts.unit}
            </span>
          </p>
        )}
      </div>

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
