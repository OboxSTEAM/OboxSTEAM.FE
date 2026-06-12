import type { ReactNode } from "react";

import type { ProgramWithModules } from "@/lib/api/programs";
import { PROGRAM_LEVEL_LABELS } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

import { StarRating } from "./star-rating";

type ProgramStatsBarProps = {
  program: ProgramWithModules;
  className?: string;
};

function StatCell({
  title,
  description,
  className,
}: {
  title: ReactNode;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-center px-4 py-4 sm:px-5 sm:py-5",
        className,
      )}
    >
      <p className="font-heading text-sm font-bold leading-snug text-[#2D2D2D] sm:text-base">
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[#6B6B6B] sm:text-sm">
        {description}
      </p>
    </div>
  );
}

export function ProgramStatsBar({ program, className }: ProgramStatsBarProps) {
  const moduleCount = program.modules.length;

  return (
    <div
      className={cn(
        "relative z-10 -mt-6 rounded-xl border border-[#E5E5E0] bg-white shadow-[0_8px_32px_rgba(45,45,45,0.08)]",
        className,
      )}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCell
          title={`${moduleCount} mô-đun`}
          description="Chương trình học có cấu trúc rõ ràng"
          className="border-b border-[#E5E5E0] sm:border-b-0 sm:border-r"
        />
        <StatCell
          title={
            program.rating != null ? (
              <span className="inline-flex items-center gap-1.5">
                {program.rating.toFixed(1)}
                <StarRating rating={program.rating} size={14} />
              </span>
            ) : (
              "Chưa có đánh giá"
            )
          }
          description={
            program.totalReviews > 0
              ? `Từ ${program.totalReviews.toLocaleString("vi-VN")} đánh giá`
              : "Hãy là người đánh giá đầu tiên"
          }
          className="border-b border-[#E5E5E0] sm:border-b-0 sm:border-r"
        />
        <StatCell
          title={PROGRAM_LEVEL_LABELS[program.level]}
          description="Cấp độ đề xuất"
          className="border-b border-[#E5E5E0] lg:border-b-0 lg:border-r"
        />
        <StatCell
          title={program.estimatedDuration}
          description="Thời lượng ước tính"
          className="border-r border-[#E5E5E0] sm:border-b-0"
        />
        <StatCell
          title={program.seriesName}
          description="Thuộc series chương trình"
          className="col-span-2 sm:col-span-1"
        />
      </div>
    </div>
  );
}
