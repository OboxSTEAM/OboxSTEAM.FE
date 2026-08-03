"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getSkills,
  type SkillCategory,
  type SkillSummary,
} from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { SKILL_CATEGORY_LABELS } from "@/lib/mentors/skill-labels";
import { cn } from "@/lib/utils";

const CATEGORY_CHIP: Record<SkillCategory, string> = {
  Science: "border-[#E94B3C]/25 bg-[#E94B3C]/10 text-[#C62828]",
  Technology: "border-[#7CB342]/30 bg-[#7CB342]/12 text-[#558B2F]",
  Engineering: "border-[#4FC3F7]/35 bg-[#4FC3F7]/12 text-[#0277BD]",
  Arts: "border-[#FDD835]/40 bg-[#FDD835]/20 text-[#8A7200]",
  Math: "border-[#7E57C2]/30 bg-[#7E57C2]/12 text-[#5E35B1]",
  SoftSkill: "border-[#E5E5E0] bg-[#F5F5F0] text-[#6B6B6B]",
};

const CATEGORY_DOT: Record<SkillCategory, string> = {
  Science: "bg-[#E94B3C]",
  Technology: "bg-[#7CB342]",
  Engineering: "bg-[#4FC3F7]",
  Arts: "bg-[#FDD835]",
  Math: "bg-[#7E57C2]",
  SoftSkill: "bg-[#9E9E9E]",
};

type SkillMultiSelectProps = {
  value: string[];
  onChange: (skillIds: string[]) => void;
  disabled?: boolean;
  /** When true, fetch catalog (e.g. parent dialog is open). */
  enabled?: boolean;
  /** Seed labels for already-selected skills before catalog loads. */
  knownSkills?: SkillSummary[];
  className?: string;
};

function skillLabel(skill: SkillSummary): string {
  return skill.name?.trim() || skill.code?.trim() || "Kỹ năng";
}

/** Inline multi-select against `GET /api/skills` for class requiredSkillIds. */
export function SkillMultiSelect({
  value,
  onChange,
  disabled = false,
  enabled = true,
  knownSkills = [],
  className,
}: SkillMultiSelectProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">(
    "all",
  );

  const { data, isLoading } = useClientFetch({
    enabled: enabled && isExpanded,
    fetcher: async () => {
      const result = await getSkills({
        page: 1,
        pageSize: 100,
        sortBy: "name",
      });
      return result?.data?.items ?? [];
    },
    deps: [enabled, isExpanded],
    onError: (error) => showAppErrorFromUnknown(error, "skills.list"),
  });

  const catalog = data ?? [];
  const selectedSet = useMemo(() => new Set(value), [value]);

  const skillById = useMemo(() => {
    const map = new Map<string, SkillSummary>();
    for (const skill of knownSkills) map.set(skill.id, skill);
    for (const skill of catalog) map.set(skill.id, skill);
    return map;
  }, [catalog, knownSkills]);

  const selectedSkills = useMemo(
    () =>
      value
        .map((id) => skillById.get(id))
        .filter((skill): skill is SkillSummary => skill != null),
    [skillById, value],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.filter((skill) => {
      if (categoryFilter !== "all" && skill.category !== categoryFilter) {
        return false;
      }
      if (!query) return true;
      const haystack = [
        skill.name,
        skill.code,
        skill.subcategory,
        SKILL_CATEGORY_LABELS[skill.category],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [catalog, categoryFilter, search]);

  function toggle(skillId: string) {
    if (selectedSet.has(skillId)) {
      onChange(value.filter((id) => id !== skillId));
      return;
    }
    onChange([...value, skillId]);
  }

  function handleToggleExpanded() {
    setIsExpanded((prev) => {
      if (prev) {
        setSearch("");
        setCategoryFilter("all");
      }
      return !prev;
    });
  }

  const categories = useMemo(
    () =>
      (Object.keys(SKILL_CATEGORY_LABELS) as SkillCategory[]).filter((category) =>
        catalog.some((skill) => skill.category === category),
      ),
    [catalog],
  );

  return (
    <div className={cn("space-y-2.5", className)}>
      {selectedSkills.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <li key={skill.id}>
              <span
                className={cn(
                  "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  CATEGORY_CHIP[skill.category],
                )}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    CATEGORY_DOT[skill.category],
                  )}
                  aria-hidden
                />
                <span className="truncate">{skillLabel(skill)}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(skill.id)}
                  aria-label={`Bỏ ${skillLabel(skill)}`}
                  className="rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : !isExpanded ? (
        <p className="text-xs text-muted-foreground">
          Chưa chọn kỹ năng — tuỳ chọn, có thể thêm sau.
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={handleToggleExpanded}
        aria-expanded={isExpanded}
        className="h-10 w-full justify-between rounded-xl border-border bg-card px-3 font-normal"
      >
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          {isExpanded ? null : <Plus className="size-4 shrink-0" />}
          {isExpanded
            ? "Thu gọn danh mục"
            : value.length > 0
              ? `Chỉnh danh mục · ${value.length} đã chọn`
              : "Thêm kỹ năng yêu cầu"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180",
          )}
        />
      </Button>

      {isExpanded ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="space-y-2.5 border-b border-border bg-muted/25 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tên, mã hoặc category…"
                disabled={disabled || isLoading}
                autoFocus
                className="h-10 rounded-xl border-border bg-background pl-9 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-ring/40"
              />
            </div>

            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                <CategoryFilterChip
                  active={categoryFilter === "all"}
                  disabled={disabled}
                  onClick={() => setCategoryFilter("all")}
                >
                  Tất cả
                </CategoryFilterChip>
                {categories.map((category) => (
                  <CategoryFilterChip
                    key={category}
                    active={categoryFilter === category}
                    disabled={disabled}
                    onClick={() => setCategoryFilter(category)}
                    className={
                      categoryFilter === category
                        ? CATEGORY_CHIP[category]
                        : undefined
                    }
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        CATEGORY_DOT[category],
                      )}
                      aria-hidden
                    />
                    {SKILL_CATEGORY_LABELS[category]}
                  </CategoryFilterChip>
                ))}
              </div>
            ) : null}
          </div>

          <ul className="max-h-52 divide-y divide-border/70 overflow-y-auto overscroll-contain">
            {isLoading ? (
              <li className="space-y-2 p-3">
                <div className="h-9 animate-pulse rounded-lg bg-muted" />
                <div className="h-9 animate-pulse rounded-lg bg-muted" />
                <div className="h-9 animate-pulse rounded-lg bg-muted" />
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-8 text-center text-xs text-muted-foreground">
                {catalog.length === 0
                  ? "Danh mục kỹ năng trống."
                  : "Không tìm thấy kỹ năng phù hợp."}
              </li>
            ) : (
              filtered.map((skill) => {
                const isSelected = selectedSet.has(skill.id);
                return (
                  <li key={skill.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggle(skill.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        "hover:bg-muted/50",
                        isSelected && "bg-[#FAFAF5]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-background text-transparent",
                        )}
                        aria-hidden
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {skillLabel(skill)}
                        </span>
                        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              CATEGORY_DOT[skill.category],
                            )}
                            aria-hidden
                          />
                          <span className="truncate">
                            {SKILL_CATEGORY_LABELS[skill.category]}
                            {skill.subcategory
                              ? ` · ${skill.subcategory}`
                              : ""}
                            {skill.code ? ` · ${skill.code}` : ""}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
            <span>
              {value.length > 0
                ? `Đã chọn ${value.length}`
                : "Chưa chọn kỹ năng"}
            </span>
            <button
              type="button"
              onClick={handleToggleExpanded}
              className="font-medium text-foreground hover:underline"
            >
              Xong
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CategoryFilterChip({
  active,
  disabled,
  onClick,
  className,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? (className ??
              "border-foreground/20 bg-foreground text-background")
          : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
