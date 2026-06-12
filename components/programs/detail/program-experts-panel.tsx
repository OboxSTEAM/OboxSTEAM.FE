"use client";

import { useState } from "react";
import Image from "next/image";

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
};

const VISIBLE_EXPERT_LIMIT = 3;

function ExpertRow({ expert }: { expert: ProgramExpert }) {
  const avatarUrl = getExpertAvatarUrl(expert.avatarUrl);
  const hasLinkedIn = Boolean(expert.linkedInUrl?.trim());

  return (
    <li className="flex gap-3">
      <Avatar size="sm" className="mt-0.5 size-9 shrink-0">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback className="bg-[#F5F5F0] text-xs font-medium text-[#6B6B6B]">
          {getExpertInitials(expert.fullName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-0.5">
        {hasLinkedIn ? (
          <a
            href={expert.linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm text-[#4FC3F7] underline-offset-2 hover:underline"
          >
            {expert.fullName}
          </a>
        ) : (
          <p className="font-medium text-sm text-[#2D2D2D]">{expert.fullName}</p>
        )}

        <p className="text-xs text-[#6B6B6B]">
          {[expert.title, expert.organization].filter(Boolean).join(" · ")}
        </p>

        {expert.roleInBoard ? (
          <p className="text-xs leading-relaxed text-[#6B6B6B]">
            {expert.roleInBoard}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function ProgramExpertsPanel({
  program,
  className,
}: ProgramExpertsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const experts = program.experts;

  if (experts.length === 0) {
    return null;
  }

  const visibleExperts = showAll
    ? experts
    : experts.slice(0, VISIBLE_EXPERT_LIMIT);
  const hiddenCount = experts.length - VISIBLE_EXPERT_LIMIT;

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

      <ul className="mt-4 space-y-4">
        {visibleExperts.map((expert) => (
          <ExpertRow key={expert.expertId} expert={expert} />
        ))}
      </ul>

      {!showAll && hiddenCount > 0 ? (
        <Button
          type="button"
          variant="link"
          className="mt-3 h-auto p-0 text-sm text-[#4FC3F7]"
          onClick={() => setShowAll(true)}
        >
          Xem tất cả {experts.length} chuyên gia
        </Button>
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
