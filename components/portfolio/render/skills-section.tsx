"use client";

import Link from "next/link";
import { Pin } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PortfolioSkill, SkillEvidence } from "@/lib/api/entities/portfolio";
import type { SkillCategory } from "@/lib/api/entities/skill";
import { getCertificateVerifyHref } from "@/lib/certificates/format";
import { SKILL_CATEGORY_LABELS } from "@/lib/mentors/skill-labels";
import { cn } from "@/lib/utils";

export const SKILL_CATEGORY_ORDER: SkillCategory[] = [
  "Science",
  "Technology",
  "Engineering",
  "Arts",
  "Math",
  "SoftSkill",
];

export const SKILL_CATEGORY_DOT: Record<SkillCategory, string> = {
  Science: "bg-[#E94B3C]",
  Technology: "bg-[#7CB342]",
  Engineering: "bg-[#4FC3F7]",
  Arts: "bg-[#FDD835]",
  Math: "bg-[#7E57C2]",
  SoftSkill: "bg-[#9E9E9E]",
};

export const PORTFOLIO_SKILL_PIN_LIMIT = 6;

type SkillsSectionProps = {
  skills: PortfolioSkill[];
  isDark: boolean;
  primaryColor: string;
  /** Editor shows hidden skills dimmed. Public shows visible skills only. */
  showHidden?: boolean;
};

function evidenceHref(evidence: SkillEvidence): string | null {
  if (evidence.portfolioItemId) return `#portfolio-item-${evidence.portfolioItemId}`;
  if (evidence.verificationUrl) return evidence.verificationUrl;
  if (evidence.certificateCode) return getCertificateVerifyHref(evidence.certificateCode);
  return null;
}

function SkillChip({
  skill,
  isDark,
  emphasized = false,
  showPin = false,
}: {
  skill: PortfolioSkill;
  isDark: boolean;
  emphasized?: boolean;
  /** Editor only. Preview and the published page never show the pin mark. */
  showPin?: boolean;
}) {
  const name = skill.skill.name?.trim() || "Kỹ năng";
  const category = skill.skill.category;
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]",
          emphasized ? "px-3 py-1.5 text-sm" : "",
          !skill.isVisible && "opacity-45",
          isDark
            ? "border-[#FAFAF5]/20 text-[#FAFAF5]"
            : "border-[#E5E5E0] bg-white text-[#2D2D2D]",
        )}
      >
        <span className={cn("size-2 shrink-0 rounded-full", SKILL_CATEGORY_DOT[category])} />
        <span className="truncate">{name}</span>
        {showPin && skill.isPinned ? (
          <Pin className="size-3 shrink-0 opacity-70" />
        ) : null}
        <span className="shrink-0 opacity-50">{skill.evidenceCount}</span>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">
          {SKILL_CATEGORY_LABELS[category]}
          {skill.skill.subcategory ? ` · ${skill.skill.subcategory}` : ""}
        </p>
        <ul className="mt-2 space-y-1.5">
          {skill.evidences.map((evidence, index) => {
            const href = evidenceHref(evidence);
            const label = evidence.programName?.trim() || evidence.type;
            const body = (
              <>
                <span className="block text-xs font-medium">{label}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {evidence.type} · {evidence.achievedAt}
                </span>
              </>
            );
            return (
              <li key={`${skill.skillId}-${index}`}>
                {href ? (
                  <a href={href} className="block rounded-md px-1 py-0.5 hover:bg-muted">
                    {body}
                  </a>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function SkillsSection({
  skills,
  isDark,
  primaryColor,
  showHidden = false,
}: SkillsSectionProps) {
  const visible = (showHidden ? skills : skills.filter((skill) => skill.isVisible)).slice();
  visible.sort((a, b) => a.displayOrder - b.displayOrder);
  const pinned = visible.filter((skill) => skill.isPinned).slice(0, PORTFOLIO_SKILL_PIN_LIMIT);

  if (visible.length === 0) {
    return (
      <p className={cn("text-sm", isDark ? "text-[#FAFAF5]/65" : "text-[#6B6B6B]")}>
        Hoàn thành chương trình để mở khóa kỹ năng.{" "}
        {showHidden ? (
          <Link href="/courses" className="font-medium underline-offset-2 hover:underline" style={{ color: primaryColor }}>
            Xem chương trình
          </Link>
        ) : null}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {pinned.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {pinned.map((skill) => (
            <SkillChip
              key={skill.skillId}
              skill={skill}
              isDark={isDark}
              emphasized
              showPin={showHidden}
            />
          ))}
        </div>
      ) : null}
      {SKILL_CATEGORY_ORDER.map((category) => {
        const group = visible.filter((skill) => skill.skill.category === category);
        if (group.length === 0) return null;
        return (
          <div key={category} className="space-y-2">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{ color: primaryColor }}
            >
              {SKILL_CATEGORY_LABELS[category]} · {group.length}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.map((skill) => (
                <SkillChip
                  key={skill.skillId}
                  skill={skill}
                  isDark={isDark}
                  showPin={showHidden}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ItemSkillChips({
  skills,
  isDark,
}: {
  skills: { id: string; name: string | null }[];
  isDark: boolean;
}) {
  if (skills.length === 0) return null;
  const shown = skills.slice(0, 3);
  const extra = skills.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((skill) => (
        <span
          key={skill.id}
          className={cn(
            "max-w-[9rem] truncate rounded-full px-2 py-0.5 text-[10px] font-medium",
            isDark ? "bg-[#FAFAF5]/10 text-[#FAFAF5]" : "bg-[#F0F0EA] text-[#2D2D2D]",
          )}
        >
          {skill.name?.trim() || "Kỹ năng"}
        </span>
      ))}
      {extra > 0 ? (
        <span className={cn("text-[10px]", isDark ? "text-[#FAFAF5]/55" : "text-[#6B6B6B]")}>
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
