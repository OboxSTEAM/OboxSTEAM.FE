"use client";

import { useState } from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ProgramExpert } from "@/lib/api/entities/expert";
import type { ProgramWithModules } from "@/lib/api/programs";
import { SITE } from "@/lib/landing/content";
import {
  getExpertAvatarUrl,
  getExpertInitials,
} from "@/lib/programs/format";
import { cn } from "@/lib/utils";

type ProgramExpertsPanelProps = {
  program: ProgramWithModules;
  className?: string;
  onExpertClick?: (expert: ProgramExpert) => void;
};

const VISIBLE_EXPERT_LIMIT = 3;

function ExpertRow({
  expert,
  onExpertClick,
}: {
  expert: ProgramExpert;
  onExpertClick?: (expert: ProgramExpert) => void;
}) {
  const avatarUrl = getExpertAvatarUrl(expert.avatarUrl);

  return (
    <li>
      <button
        type="button"
        onClick={() => onExpertClick?.(expert)}
        className="flex w-full gap-3 rounded-lg text-left transition-colors hover:bg-[#FAFAF5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/40 -mx-1 px-1 py-1"
        aria-label={`Xem thông tin ${expert.fullName}`}
      >
        <Avatar size="sm" className="mt-0.5 size-9 shrink-0">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-[#F5F5F0] text-xs font-medium text-[#6B6B6B]">
            {getExpertInitials(expert.fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-medium text-sm text-[#4FC3F7] underline-offset-2">
            {expert.fullName}
          </p>

          <p className="text-xs text-[#6B6B6B]">
            {[expert.title, expert.organization].filter(Boolean).join(" · ")}
          </p>

          {expert.roleInBoard ? (
            <p className="text-xs leading-relaxed text-[#6B6B6B]">
              {expert.roleInBoard}
            </p>
          ) : null}
        </div>
      </button>
    </li>
  );
}

function LeadExpertCard({
  expert,
  onExpertClick,
}: {
  expert: ProgramExpert;
  onExpertClick?: (expert: ProgramExpert) => void;
}) {
  const avatarUrl = getExpertAvatarUrl(expert.avatarUrl);

  return (
    <button
      type="button"
      onClick={() => onExpertClick?.(expert)}
      className="mt-4 flex w-full gap-3 rounded-lg border border-[#4FC3F7]/50 bg-[#4FC3F7]/6 p-3 text-left transition-colors hover:bg-[#4FC3F7]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/40"
      aria-label={`Xem thông tin ${expert.fullName}, chuyên gia phụ trách chương trình`}
    >
      <Avatar className="size-12 shrink-0 border-2 border-[#4FC3F7] ring-2 ring-[#4FC3F7]/20">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback className="bg-white text-sm font-semibold text-[#0D6E9C]">
          {getExpertInitials(expert.fullName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#0D6E9C]">
          <ShieldCheck className="size-3" aria-hidden />
          Chuyên gia phụ trách
        </p>
        <p className="font-heading text-sm font-semibold text-[#2D2D2D]">
          {expert.fullName}
        </p>
        <p className="text-xs text-[#6B6B6B]">
          {[expert.title, expert.organization].filter(Boolean).join(" · ")}
        </p>
        <p className="text-xs leading-relaxed text-[#6B6B6B]">
          Tác giả khung chương trình và cố vấn nội dung.
        </p>
      </div>
    </button>
  );
}

export function ProgramExpertsPanel({
  program,
  className,
  onExpertClick,
}: ProgramExpertsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const experts = program.experts;

  if (experts.length === 0) {
    return null;
  }

  const lead =
    experts.find((expert) => expert.expertId === program.advisorExpertId) ?? null;
  const coTeachers = lead
    ? experts.filter((expert) => expert.expertId !== lead.expertId)
    : experts;
  const visibleCoTeachers = showAll
    ? coTeachers
    : coTeachers.slice(0, VISIBLE_EXPERT_LIMIT);
  const hiddenCount = coTeachers.length - VISIBLE_EXPERT_LIMIT;

  return (
    <aside
      className={cn(
        "rounded-xl border border-[#E5E5E0] bg-white p-5 shadow-[0_4px_20px_rgba(45,45,45,0.05)]",
        className,
      )}
    >
      <h2 className="font-heading text-sm font-semibold text-[#2D2D2D]">
        Chuyên gia
      </h2>

      {lead ? (
        <LeadExpertCard expert={lead} onExpertClick={onExpertClick} />
      ) : null}

      {coTeachers.length > 0 ? (
        <div className={lead ? "mt-5" : "mt-4"}>
          {lead ? (
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
              Chuyên gia đồng giảng
            </h3>
          ) : null}
          <ul className={cn("space-y-2", lead && "mt-2")}>
            {visibleCoTeachers.map((expert) => (
              <ExpertRow
                key={expert.expertId}
                expert={expert}
                onExpertClick={onExpertClick}
              />
            ))}
          </ul>

          {!showAll && hiddenCount > 0 ? (
            <Button
              type="button"
              variant="link"
              className="mt-3 h-auto p-0 text-sm text-[#4FC3F7]"
              onClick={() => setShowAll(true)}
            >
              Xem tất cả {coTeachers.length} chuyên gia đồng giảng
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 border-t border-[#E5E5E0] pt-4">
        <h3 className="font-heading text-sm font-semibold text-[#2D2D2D]">
          Được cung cấp bởi
        </h3>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-[#E5E5E0] bg-white p-1.5">
            <Image
              src={SITE.logoUrl}
              alt=""
              fill
              sizes="3rem"
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-[#2D2D2D]">{SITE.name}</p>
            <p className="text-xs text-[#6B6B6B]">{SITE.tagline}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
