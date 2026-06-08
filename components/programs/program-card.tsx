"use client";

import Image from "next/image";
import { Clock, Star } from "lucide-react";

import { ImageSlot } from "@/components/common/image-slot";
import type { Program } from "@/lib/api/programs";
import {
  getCategoryAccentColor,
  getProgramPriceParts,
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
  const priceParts = getProgramPriceParts(program.price);

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
      <div className="relative aspect-[5/2] overflow-hidden bg-[#141414] shrink-0">
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

      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
          {categoryMeta?.label ?? program.seriesName}
        </p>

        <h3 className="font-heading font-bold text-white text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-[#FDD835] transition-colors duration-150">
          {program.name}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-white/55">
          {program.rating != null && (
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Star
                size={14}
                className="fill-[#FDD835] text-[#FDD835] shrink-0"
                aria-hidden="true"
              />
              <span className="font-semibold text-white">
                {program.rating.toFixed(1)}
              </span>
            </span>
          )}
          {program.totalReviews > 0 && (
            <span className="tabular-nums text-white/60">
              {program.totalReviews.toLocaleString("vi-VN")} đánh giá
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-semibold text-white/80">
            {PROGRAM_LEVEL_LABELS[program.level]}
          </span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm text-white/50">
            <Clock size={13} className="shrink-0 text-white/45" aria-hidden="true" />
            {program.estimatedDuration}
          </span>
          {priceParts.isFree ? (
            <span className="font-heading text-base font-bold text-[#4FC3F7]">
              {priceParts.label}
            </span>
          ) : (
            <span
              className="inline-flex items-baseline gap-1 rounded-lg bg-[#FDD835]/10 px-2.5 py-1 font-heading font-extrabold tabular-nums leading-none text-[#FDD835]"
              aria-label={`Giá ${priceParts.amount} ${priceParts.unit}`}
            >
              <span className="text-lg sm:text-xl">{priceParts.amount}</span>
              <span className="text-xs font-bold tracking-wide text-[#FDD835]/90">
                {priceParts.unit}
              </span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
