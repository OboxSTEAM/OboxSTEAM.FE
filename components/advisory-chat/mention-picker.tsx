"use client";

import { useEffect } from "react";

import type { MentionResultGroup } from "@/lib/advisory/mention-search";
import { mentionKey } from "@/lib/advisory/mention-token";
import type { MentionTarget } from "@/lib/api";
import { cn } from "@/lib/utils";

type MentionPickerProps = {
  listboxId: string;
  query: string;
  groups: MentionResultGroup[];
  /** Results in keyboard order (groups flattened). */
  flatResults: MentionTarget[];
  activeIndex: number;
  isLoading: boolean;
  onSelect: (target: MentionTarget) => void;
  onActiveIndexChange: (index: number) => void;
};

export function mentionOptionId(listboxId: string, target: MentionTarget): string {
  return `${listboxId}-${mentionKey(target.targetType, target.targetId).replace(":", "-")}`;
}

/** Grouped `@` suggestions above the composer; keyboard is driven by the editor. */
export function MentionPicker({
  listboxId,
  query,
  groups,
  flatResults,
  activeIndex,
  isLoading,
  onSelect,
  onActiveIndexChange,
}: MentionPickerProps) {
  const activeTarget = flatResults[activeIndex];
  const activeId = activeTarget ? mentionOptionId(listboxId, activeTarget) : null;

  useEffect(() => {
    if (!activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  return (
    <div className="absolute inset-x-0 bottom-full z-30 mb-2 overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10">
      <div className="border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
        {query ? (
          <>
            Nhắc đến mục khớp “<span className="font-medium text-foreground">{query}</span>”
          </>
        ) : (
          "Nhắc đến một mục trong chương trình"
        )}
      </div>
      <div
        id={listboxId}
        role="listbox"
        aria-label="Mục có thể nhắc đến"
        className="max-h-64 overflow-y-auto overscroll-contain p-1"
      >
        {isLoading && flatResults.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Đang tải danh sách mục…</p>
        ) : flatResults.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Không tìm thấy mục phù hợp.</p>
        ) : (
          groups.map((group) => (
            <div key={group.targetType} role="group" aria-label={group.label}>
              <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
              {group.items.map((target) => {
                const index = flatResults.indexOf(target);
                const isActive = index === activeIndex;
                const path = target.path.map((segment) => segment.label).join(" › ");
                return (
                  <div
                    key={mentionKey(target.targetType, target.targetId)}
                    id={mentionOptionId(listboxId, target)}
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => onActiveIndexChange(index)}
                    onClick={() => onSelect(target)}
                    className={cn(
                      "flex min-h-10 cursor-pointer flex-col justify-center rounded-lg px-2 py-1.5",
                      isActive ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    <span className="flex items-baseline gap-1.5 text-sm text-foreground">
                      <span className="truncate font-medium">{target.label}</span>
                      {target.code ? (
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                          {target.code}
                        </span>
                      ) : null}
                    </span>
                    {path ? (
                      <span className="truncate text-xs text-muted-foreground">{path}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
