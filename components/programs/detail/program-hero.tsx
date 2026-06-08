import Image from "next/image";

import { CategoryBadge } from "@/components/common/category-badge";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { ImageSlot } from "@/components/common/image-slot";
import type { ProgramWithModules } from "@/lib/api/programs";
import {
  PROGRAM_CATEGORY_META,
  PROGRAM_LEVEL_LABELS,
} from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

import { StarRating } from "./star-rating";

type ProgramHeroProps = {
  program: ProgramWithModules;
  className?: string;
};

export function ProgramHero({ program, className }: ProgramHeroProps) {
  const categoryMeta = program.category
    ? PROGRAM_CATEGORY_META[program.category]
    : null;
  const accentColor = categoryMeta?.color ?? "#E5E5E0";

  return (
    <header className={cn("space-y-3", className)}>
      <div
        className="relative max-w-md overflow-hidden rounded-xl border border-[#E5E5E0] bg-white shadow-[0_4px_20px_rgba(45,45,45,0.05)]"
        style={{ borderTopWidth: "3px", borderTopColor: accentColor }}
      >
        <div className="relative aspect-video">
          {program.thumbnailUrl ? (
            <Image
              src={program.thumbnailUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 80vw, 28rem"
              className="object-cover"
            />
          ) : (
            <ImageSlot
              ratio="16:9"
              alt={program.name}
              tone={categoryMeta?.steamKey ?? "neutral"}
              className="absolute inset-0 rounded-none"
              sizes="(max-width: 1024px) 80vw, 28rem"
            />
          )}
        </div>
      </div>

      <div className="space-y-2 max-w-2xl">
        {categoryMeta ? (
          <CategoryBadge category={categoryMeta.steamKey} />
        ) : (
          <EyebrowChip>{program.seriesName}</EyebrowChip>
        )}

        <h1
          className="font-heading font-bold text-[#2D2D2D] text-balance tracking-tight leading-[1.15]"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)" }}
        >
          {program.name}
        </h1>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-[#6B6B6B]">
          {program.rating != null && (
            <span className="inline-flex items-center gap-1.5">
              <StarRating rating={program.rating} size={13} />
              <span className="font-semibold text-[#2D2D2D] tabular-nums">
                {program.rating.toFixed(1)}
              </span>
            </span>
          )}
          {program.totalReviews > 0 && (
            <span className="tabular-nums">
              {program.totalReviews.toLocaleString("vi-VN")} đánh giá
            </span>
          )}
          <span className="text-[#E5E5E0]" aria-hidden>
            ·
          </span>
          <span className="rounded-md bg-[#F5F5F0] px-2 py-0.5 text-xs font-semibold text-[#2D2D2D]">
            {PROGRAM_LEVEL_LABELS[program.level]}
          </span>
        </div>

        {categoryMeta && program.seriesName ? (
          <p className="text-sm text-[#6B6B6B]">{program.seriesName}</p>
        ) : null}
      </div>
    </header>
  );
}
