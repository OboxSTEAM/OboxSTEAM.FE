"use client";

import { Eye, EyeOff, Pin } from "lucide-react";

import { PORTFOLIO_SKILL_PIN_LIMIT } from "@/components/portfolio/render/skills-section";
import type { PortfolioSkill } from "@/lib/api/entities/portfolio";
import { SKILL_CATEGORY_LABELS } from "@/lib/mentors/skill-labels";
import { cn } from "@/lib/utils";

type SkillsPanelProps = {
  skills: PortfolioSkill[];
  onChange: (skills: PortfolioSkill[]) => void;
};

export function SkillsPanel({ skills, onChange }: SkillsPanelProps) {
  const ordered = [...skills].sort((a, b) => a.displayOrder - b.displayOrder);
  const pinnedCount = ordered.filter((skill) => skill.isPinned).length;

  const patch = (skillId: string, next: Partial<PortfolioSkill>) => {
    onChange(
      ordered.map((skill) =>
        skill.skillId === skillId ? { ...skill, ...next } : skill,
      ),
    );
  };

  const move = (skillId: string, direction: -1 | 1) => {
    const index = ordered.findIndex((skill) => skill.skillId === skillId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    onChange(next.map((skill, order) => ({ ...skill, displayOrder: order })));
  };

  if (ordered.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        Chưa có kỹ năng. Hoàn thành một chương trình rồi đồng bộ portfolio.
      </p>
    );
  }

  return (
    <ul className="space-y-2 px-4 py-4">
      <p className="text-xs text-muted-foreground">
        Ghim tối đa {PORTFOLIO_SKILL_PIN_LIMIT} kỹ năng. Đang ghim {pinnedCount}.
      </p>
      {ordered.map((skill, index) => {
        const pinBlocked = !skill.isPinned && pinnedCount >= PORTFOLIO_SKILL_PIN_LIMIT;
        return (
          <li
            key={skill.skillId}
            className={cn(
              "rounded-xl border border-border bg-card p-3",
              !skill.isVisible && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {skill.skill.name?.trim() || "Kỹ năng"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {SKILL_CATEGORY_LABELS[skill.skill.category]} · {skill.evidenceCount} minh chứng
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Lên"
                  disabled={index === 0}
                  onClick={() => move(skill.skillId, -1)}
                  className="size-7 rounded-md text-xs hover:bg-muted disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Xuống"
                  disabled={index === ordered.length - 1}
                  onClick={() => move(skill.skillId, 1)}
                  className="size-7 rounded-md text-xs hover:bg-muted disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label={skill.isPinned ? "Bỏ ghim" : "Ghim"}
                  disabled={pinBlocked}
                  onClick={() => patch(skill.skillId, { isPinned: !skill.isPinned })}
                  className="flex size-7 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30"
                >
                  <Pin className={cn("size-3.5", skill.isPinned && "text-[#0f7cad]")} />
                </button>
                <button
                  type="button"
                  aria-label={skill.isVisible ? "Ẩn kỹ năng" : "Hiện kỹ năng"}
                  onClick={() => patch(skill.skillId, { isVisible: !skill.isVisible })}
                  className="flex size-7 items-center justify-center rounded-md hover:bg-muted"
                >
                  {skill.isVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
