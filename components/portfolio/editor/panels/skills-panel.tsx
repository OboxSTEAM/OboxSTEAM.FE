"use client";

import { Eye, EyeOff, Pin } from "lucide-react";

import {
  PORTFOLIO_SKILL_PIN_LIMIT,
  SKILL_CATEGORY_DOT,
  SKILL_CATEGORY_ORDER,
} from "@/components/portfolio/render/skills-section";
import type { PortfolioSkill } from "@/lib/api/entities/portfolio";
import type { SkillCategory } from "@/lib/api/entities/skill";
import { SKILL_CATEGORY_LABELS } from "@/lib/mentors/skill-labels";
import { cn } from "@/lib/utils";

type SkillsPanelProps = {
  skills: PortfolioSkill[];
  onChange: (skills: PortfolioSkill[]) => void;
};

function moveWithinCategory(
  ordered: PortfolioSkill[],
  skillId: string,
  category: SkillCategory,
  direction: -1 | 1,
): PortfolioSkill[] | null {
  const slots = ordered.flatMap((skill, index) =>
    skill.skill.category === category ? [index] : [],
  );
  const localIndex = slots.findIndex(
    (index) => ordered[index]?.skillId === skillId,
  );
  const swapSlot = slots[localIndex + direction];
  const currentSlot = slots[localIndex];
  if (localIndex < 0 || currentSlot == null || swapSlot == null) return null;

  const next = [...ordered];
  const current = next[currentSlot];
  const neighbor = next[swapSlot];
  if (!current || !neighbor) return null;
  next[currentSlot] = neighbor;
  next[swapSlot] = current;
  return next.map((skill, order) => ({ ...skill, displayOrder: order }));
}

export function SkillsPanel({ skills, onChange }: SkillsPanelProps) {
  const ordered = [...skills].sort((a, b) => a.displayOrder - b.displayOrder);
  const pinnedCount = ordered.filter((skill) => skill.isPinned).length;
  const groups = SKILL_CATEGORY_ORDER.map((category) => ({
    category,
    skills: ordered.filter((skill) => skill.skill.category === category),
  })).filter((group) => group.skills.length > 0);

  const patch = (skillId: string, next: Partial<PortfolioSkill>) => {
    onChange(
      ordered.map((skill) =>
        skill.skillId === skillId ? { ...skill, ...next } : skill,
      ),
    );
  };

  if (ordered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có kỹ năng. Hoàn thành một chương trình rồi đồng bộ portfolio.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Ghim tối đa {PORTFOLIO_SKILL_PIN_LIMIT} kỹ năng. Đang ghim {pinnedCount}.
        Thứ tự trong mỗi nhóm là thứ tự trên portfolio.
      </p>
      {groups.map((group) => (
        <section key={group.category} className="space-y-2">
          <h3 className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f7cad]">
            <span
              className={cn(
                "size-2 rounded-full",
                SKILL_CATEGORY_DOT[group.category],
              )}
            />
            {SKILL_CATEGORY_LABELS[group.category]}
            <span className="font-sans tracking-normal text-muted-foreground">
              {group.skills.length}
            </span>
          </h3>
          <ul className="space-y-1.5">
            {group.skills.map((skill, index) => {
              const pinBlocked =
                !skill.isPinned && pinnedCount >= PORTFOLIO_SKILL_PIN_LIMIT;
              return (
                <li
                  key={skill.skillId}
                  className={cn(
                    "rounded-xl border border-border bg-card px-3 py-2.5",
                    !skill.isVisible && "opacity-60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                        {skill.isPinned ? (
                          <Pin className="size-3 shrink-0 text-[#0f7cad]" />
                        ) : null}
                        <span className="truncate">
                          {skill.skill.name?.trim() || "Kỹ năng"}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {skill.evidenceCount} minh chứng
                        {skill.skill.subcategory
                          ? ` · ${skill.skill.subcategory}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        type="button"
                        aria-label={`Đưa ${skill.skill.name ?? "kỹ năng"} lên trong ${SKILL_CATEGORY_LABELS[group.category]}`}
                        disabled={index === 0}
                        onClick={() => {
                          const next = moveWithinCategory(
                            ordered,
                            skill.skillId,
                            group.category,
                            -1,
                          );
                          if (next) onChange(next);
                        }}
                        className="size-7 rounded-md text-xs hover:bg-muted disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Đưa ${skill.skill.name ?? "kỹ năng"} xuống trong ${SKILL_CATEGORY_LABELS[group.category]}`}
                        disabled={index === group.skills.length - 1}
                        onClick={() => {
                          const next = moveWithinCategory(
                            ordered,
                            skill.skillId,
                            group.category,
                            1,
                          );
                          if (next) onChange(next);
                        }}
                        className="size-7 rounded-md text-xs hover:bg-muted disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label={skill.isPinned ? "Bỏ ghim" : "Ghim"}
                        disabled={pinBlocked}
                        onClick={() =>
                          patch(skill.skillId, { isPinned: !skill.isPinned })
                        }
                        className="flex size-7 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30"
                      >
                        <Pin
                          className={cn(
                            "size-3.5",
                            skill.isPinned && "text-[#0f7cad]",
                          )}
                        />
                      </button>
                      <button
                        type="button"
                        aria-label={
                          skill.isVisible ? "Ẩn kỹ năng" : "Hiện kỹ năng"
                        }
                        onClick={() =>
                          patch(skill.skillId, { isVisible: !skill.isVisible })
                        }
                        className="flex size-7 items-center justify-center rounded-md hover:bg-muted"
                      >
                        {skill.isVisible ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
