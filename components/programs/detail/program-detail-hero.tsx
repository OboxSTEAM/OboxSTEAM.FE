"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import Aurora from "@/components/Aurora";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { ImageSlot } from "@/components/common/image-slot";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProgramExpert } from "@/lib/api/entities/expert";
import type { ProgramCategory } from "@/lib/api/entities/program";
import type { ProgramWithModules } from "@/lib/api/programs";
import { SITE } from "@/lib/landing/content";
import {
  PROGRAM_CATEGORY_META,
  PROGRAM_LEVEL_LABELS,
} from "@/lib/programs/constants";
import {
  formatProgramExpertSummary,
  getExpertAvatarUrl,
  getExpertInitials,
  truncateProgramDescription,
} from "@/lib/programs/format";
import { cn } from "@/lib/utils";

import { ProgramDetailBack } from "./program-detail-back";
import { ProgramEnrollCta } from "./program-enroll-cta";
import { StarRating } from "./star-rating";

type ProgramDetailHeroProps = {
  program: ProgramWithModules;
  className?: string;
  onExpertClick?: (expert: ProgramExpert) => void;
};

type CategoryHeroTheme = {
  accentColor: string;
  heroGradient: string;
  orbs: ReadonlyArray<{
    color: string;
    w: number;
    h: number;
    top: string;
    right?: string;
    left?: string;
    blur: number;
    opacity: number;
  }>;
  auroraStops: [string, string, string];
};

function getCategoryHeroTheme(category: ProgramCategory | null): CategoryHeroTheme {
  const accentColor = category
    ? PROGRAM_CATEGORY_META[category].color
    : "#4FC3F7";

  return {
    accentColor,
    heroGradient: `linear-gradient(128deg, #FAFAF5 0%, #FFFFFF 22%, ${accentColor}38 52%, ${accentColor}5C 82%, ${accentColor}34 100%)`,
    orbs: [
      {
        color: accentColor,
        w: 340,
        h: 340,
        top: "0%",
        right: "8%",
        blur: 90,
        opacity: 0.34,
      },
      {
        color: accentColor,
        w: 240,
        h: 240,
        top: "48%",
        right: "22%",
        blur: 80,
        opacity: 0.26,
      },
      {
        color: accentColor,
        w: 200,
        h: 200,
        top: "18%",
        left: "58%",
        blur: 70,
        opacity: 0.2,
      },
    ],
    auroraStops: [accentColor, accentColor, "#FAFAF5"],
  };
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event: MediaQueryListEvent) => setReduce(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduce;
}

function ProgramHeroCategoryBadge({ category }: { category: ProgramCategory }) {
  const meta = PROGRAM_CATEGORY_META[category];

  return (
    <span
      className="inline-flex items-center rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-[0_4px_14px_rgba(45,45,45,0.18)] ring-2 ring-white/60"
      style={{ backgroundColor: meta.color }}
    >
      {meta.label}
    </span>
  );
}

/** Large inverted logo behind the program image card (replaces arc circles). */
function HeroBackgroundLogo() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-10 top-1/2 z-0 aspect-square w-[min(420px,54vw)] -translate-x-10 -translate-y-1/2 sm:right-14 sm:-translate-x-14"
    >
      <Image
        src={SITE.logoUrl}
        alt=""
        fill
        sizes="(max-width: 1024px) 50vw, 26rem"
        className="object-contain brightness-0 invert opacity-[0.32] drop-shadow-[0_8px_32px_rgba(45,45,45,0.14)]"
      />
    </div>
  );
}

function ExpertAvatarStack({
  program,
  onExpertClick,
}: {
  program: ProgramWithModules;
  onExpertClick?: (expert: ProgramExpert) => void;
}) {
  const experts = program.experts.slice(0, 3);
  if (experts.length === 0) return null;

  const summary = formatProgramExpertSummary(program.experts);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex -space-x-2">
        {experts.map((expert) => {
          const avatarUrl = getExpertAvatarUrl(expert.avatarUrl);
          return (
            <button
              key={expert.expertId}
              type="button"
              onClick={() => onExpertClick?.(expert)}
              className="relative rounded-full ring-2 ring-[#FAFAF5] transition-transform hover:z-10 hover:scale-105 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-[#4FC3F7]"
              aria-label={`Xem thông tin ${expert.fullName}`}
            >
              <Avatar size="sm" className="size-7 bg-white">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="" />
                ) : null}
                <AvatarFallback className="bg-[#F5F5F0] text-[10px] font-medium text-[#6B6B6B]">
                  {getExpertInitials(expert.fullName)}
                </AvatarFallback>
              </Avatar>
            </button>
          );
        })}
      </div>
      {summary ? (
        <span className="text-sm text-[#6B6B6B]">{summary}</span>
      ) : null}
    </div>
  );
}

export function ProgramDetailHero({
  program,
  className,
  onExpertClick,
}: ProgramDetailHeroProps) {
  const reduceMotion = useReducedMotion();
  const categoryMeta = program.category
    ? PROGRAM_CATEGORY_META[program.category]
    : null;
  const theme = getCategoryHeroTheme(program.category ?? null);
  const { accentColor } = theme;
  const excerpt = truncateProgramDescription(program.description);

  return (
    <header
      className={cn(
        "relative overflow-hidden border-b border-[#E5E5E0]/80",
        className,
      )}
      style={{ background: theme.heroGradient }}
    >
      {!reduceMotion &&
        theme.orbs.map((orb, index) => (
          <div
            key={index}
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              width: orb.w,
              height: orb.h,
              top: orb.top,
              right: orb.right,
              left: orb.left,
              background: orb.color,
              filter: `blur(${orb.blur}px)`,
              opacity: orb.opacity,
            }}
          />
        ))}

      {!reduceMotion ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ mixBlendMode: "multiply" }}
        >
          <Aurora
            colorStops={theme.auroraStops}
            amplitude={0.62}
            blend={0.48}
            speed={0.22}
          />
        </div>
      ) : null}

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        <ProgramDetailBack className="mb-6" />

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <div className="relative z-10 min-w-0 space-y-4 rounded-2xl bg-white/55 p-5 shadow-[0_8px_32px_rgba(45,45,45,0.06)] ring-1 ring-white/80 backdrop-blur-sm sm:p-6">
            {categoryMeta && program.category ? (
              <ProgramHeroCategoryBadge category={program.category} />
            ) : (
              <EyebrowChip>{program.seriesName}</EyebrowChip>
            )}

            <h1
              className="font-heading font-extrabold text-[#2D2D2D] text-balance tracking-tight leading-[1.1]"
              style={{ fontSize: "clamp(1.875rem, 3.8vw, 2.625rem)" }}
            >
              {program.name}
            </h1>

            {excerpt ? (
              <p className="max-w-xl text-sm leading-relaxed text-[#4A4A4A] sm:text-base">
                {excerpt}
              </p>
            ) : null}

            <ExpertAvatarStack
              program={program}
              onExpertClick={onExpertClick}
            />

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
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                {PROGRAM_LEVEL_LABELS[program.level]}
              </span>
            </div>

            <div className="pt-1 lg:hidden">
              <ProgramEnrollCta
                programId={program.id}
                price={program.price}
                variant="hero"
              />
            </div>
          </div>

          <div className="relative hidden min-h-[260px] lg:block">
            <HeroBackgroundLogo />

            <div
              className="absolute right-6 top-1/2 z-10 w-56 -translate-y-1/2 rotate-[-2deg] overflow-hidden rounded-2xl bg-white shadow-[0_20px_56px_rgba(45,45,45,0.2)] ring-1 ring-white/90"
              style={{ borderTop: `5px solid ${accentColor}` }}
            >
              <div className="relative aspect-[4/3]">
                {program.thumbnailUrl ? (
                  <Image
                    src={program.thumbnailUrl}
                    alt=""
                    fill
                    priority
                    sizes="14rem"
                    className="object-cover"
                  />
                ) : (
                  <ImageSlot
                    ratio="4:3"
                    alt={program.name}
                    tone={categoryMeta?.steamKey ?? "neutral"}
                    className="absolute inset-0 rounded-none"
                    sizes="14rem"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
