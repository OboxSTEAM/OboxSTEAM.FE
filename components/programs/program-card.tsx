"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Program } from "@/lib/api/programs";
import { getProgramPriceParts } from "@/lib/programs/constants";
import {
  formatProgramCardFooterMeta,
  formatProgramSkillsPreview,
  getProgramCardExpert,
  getProgramThumbnailUrl,
} from "@/lib/programs/format";
import { cn } from "@/lib/utils";

type ProgramCardProps = {
  program: Program;
  className?: string;
};

function ProgramCardExpert({ program }: { program: Program }) {
  const expert = getProgramCardExpert(program);
  if (!expert) return null;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar
        size="sm"
        className="size-6 border-white/10 bg-white/8 after:border-white/10"
      >
        {expert.avatarUrl ? (
          <AvatarImage src={expert.avatarUrl} alt={expert.name} />
        ) : null}
        <AvatarFallback className="bg-white/10 text-[10px] font-semibold text-white/60">
          {expert.initials}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-xs text-white/55">{expert.name}</span>
    </div>
  );
}

function ProgramCardFooterMeta({ program }: { program: Program }) {
  const meta = formatProgramCardFooterMeta(program);

  return (
    <p
      className="truncate text-[11px] leading-tight text-white/40"
      title={meta}
    >
      {meta}
    </p>
  );
}

export function ProgramCard({ program, className }: ProgramCardProps) {
  const priceParts = getProgramPriceParts(program.price);
  const skillsPreview = formatProgramSkillsPreview(program.skillsGained);
  const thumbnailUrl = getProgramThumbnailUrl(program.thumbnailUrl);

  return (
    <Link
      href={`/programs/${program.id}`}
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-white/8 bg-[#252525]",
        "shadow-[0_2px_16px_rgba(0,0,0,0.25)]",
        "hover:-translate-y-1 hover:border-white/16 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        "active:scale-[0.98] active:-translate-y-[1px]",
        "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1A]",
        className,
      )}
      aria-label={program.name}
    >
      <div className="p-3 pb-0">
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-white/8 bg-[#141414]">
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {priceParts.isFree ? (
            <span className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
              {priceParts.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 pt-2.5">
        {program.experts.length > 0 ? (
          <ProgramCardExpert program={program} />
        ) : null}

        <h3 className="font-heading text-sm font-bold leading-snug text-white line-clamp-2 group-hover:text-[#FDD835] transition-colors duration-150 sm:text-base">
          {program.name}
        </h3>

        {skillsPreview ? (
          <p className="line-clamp-2 text-xs leading-snug text-white/50">
            <span className="font-semibold text-white/65">
              Kỹ năng đạt được:{" "}
            </span>
            {skillsPreview}
          </p>
        ) : null}

        {program.rating != null && (
          <div className="inline-flex items-center gap-1 text-xs tabular-nums text-white/55">
            <Star
              size={12}
              className="shrink-0 fill-[#FDD835] text-[#FDD835]"
              aria-hidden="true"
            />
            <span className="font-semibold text-white">
              {program.rating.toFixed(1)}
            </span>
            {program.totalReviews > 0 && (
              <span className="text-white/45">
                ({program.totalReviews.toLocaleString("vi-VN")} đánh giá)
              </span>
            )}
          </div>
        )}

        <div className="mt-auto space-y-1.5 pt-1">
          <ProgramCardFooterMeta program={program} />

          {priceParts.isFree ? (
            <p
              className="text-right text-sm font-bold text-[#FDD835]"
              aria-label={priceParts.label}
            >
              {priceParts.label}
            </p>
          ) : (
            <p
              className="text-right text-sm font-bold tabular-nums text-[#FDD835]"
              aria-label={`Giá ${priceParts.amount} ${priceParts.unit}`}
            >
              {priceParts.amount}
              <span className="ml-0.5 text-xs font-semibold text-[#FDD835]/90">
                {priceParts.unit}
              </span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
