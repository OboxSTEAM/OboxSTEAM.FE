"use client";

import Image from "next/image";
import { Clock, Star } from "lucide-react";

import { ImageSlot } from "@/components/common/image-slot";
import type { Program } from "@/lib/api/programs";
import {
  formatProgramPrice,
  getCategoryAccentColor,
  PROGRAM_CATEGORY_META,
  PROGRAM_LEVEL_LABELS,
} from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

type ProgramCardProps = {
  program: Program;
  className?: string;
};

export function ProgramCard({ program, className }: ProgramCardProps) {
  const categoryMeta = program.category
    ? PROGRAM_CATEGORY_META[program.category]
    : null;
  const accentColor = getCategoryAccentColor(program.category);

  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-[#252525]",
        "hover:-translate-y-1 hover:border-white/16 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        "active:scale-[0.98] active:-translate-y-[1px]",
        "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer",
        className,
      )}
      style={{
        borderTopWidth: "3px",
        borderTopColor: accentColor,
        boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
      }}
      aria-label={program.name}
      tabIndex={0}
    >
      <div className="relative aspect-video overflow-hidden bg-[#141414] shrink-0">
        {program.thumbnailUrl ? (
          <Image
            src={program.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <ImageSlot
            ratio="16:9"
            alt={program.name}
            tone={categoryMeta?.steamKey ?? "neutral"}
            className="absolute inset-0 rounded-none"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-col gap-2 p-3.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
          {categoryMeta?.label ?? program.seriesName}
        </p>

        <h3 className="font-heading font-semibold text-white text-[0.9375rem] leading-snug line-clamp-2 group-hover:text-[#FDD835] transition-colors duration-150">
          {program.name}
        </h3>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-white/45">
          {program.rating != null && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Star
                size={11}
                className="fill-[#FDD835] text-[#FDD835] shrink-0"
                aria-hidden="true"
              />
              <span className="font-semibold text-white/85">
                {program.rating.toFixed(1)}
              </span>
            </span>
          )}
          {program.totalReviews > 0 && (
            <span className="tabular-nums">
              {program.totalReviews.toLocaleString("vi-VN")} đánh giá
            </span>
          )}
          <span className="px-1.5 py-px rounded-md bg-white/8 text-[10px] font-medium text-white/70">
            {PROGRAM_LEVEL_LABELS[program.level]}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-[10px] text-white/35">
          <span className="inline-flex items-center gap-1">
            <Clock size={10} className="shrink-0 text-white/35" aria-hidden="true" />
            {program.estimatedDuration}
          </span>
          <span className="font-medium text-white/70 tabular-nums">
            {formatProgramPrice(program.price)}
          </span>
        </div>
      </div>
    </article>
  );
}
