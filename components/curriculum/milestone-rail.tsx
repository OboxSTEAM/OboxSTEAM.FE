"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { Flag, Trash2 } from "lucide-react";

export type MilestoneRailItem = {
  id: string;
  title: string;
  isCapstone: boolean;
  order: number;
  assignmentTitle: string;
  activityIds: string[];
};

export type MilestoneRailGroup = {
  moduleId: string;
  moduleName: string;
  items: MilestoneRailItem[];
};

export type MilestoneRelationLine = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const W = {
  bg: "var(--background)",
  border: "var(--border)",
  textStrong: "var(--foreground)",
  text: "var(--foreground)",
  muted: "var(--muted-foreground)",
  faint: "var(--muted-foreground)",
} as const;

/** Measures curves from linked activity rows to the selected milestone card. */
export function useMilestoneRelationLines(
  stageRef: RefObject<HTMLElement | null>,
  activeMilestoneId: string | null,
  activityIds: readonly string[],
): MilestoneRelationLine[] {
  const [lines, setLines] = useState<MilestoneRelationLine[]>([]);
  const activityKey = activityIds.join("|");

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !activeMilestoneId) {
      setLines([]);
      return;
    }

    const measure = () => {
      const origin = stage.getBoundingClientRect();
      const card = stage.querySelector<HTMLElement>(
        `[data-curriculum-anchor="milestone:${activeMilestoneId}"]`,
      );
      if (!card) {
        setLines([]);
        return;
      }
      const cardBox = card.getBoundingClientRect();
      const next = activityIds.flatMap((activityId) => {
        const row = stage.querySelector<HTMLElement>(
          `[data-curriculum-anchor="activity:${activityId}"]`,
        );
        if (!row) return [];
        const box = row.getBoundingClientRect();
        return [
          {
            key: activityId,
            x1: box.right - origin.left,
            y1: box.top + box.height / 2 - origin.top,
            x2: cardBox.left - origin.left,
            y2: cardBox.top + 28 - origin.top,
          },
        ];
      });
      setLines(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [activeMilestoneId, activityKey, stageRef]);

  return lines;
}

export function MilestoneRelationLines({
  lines,
}: {
  lines: MilestoneRelationLine[];
}) {
  if (lines.length === 0) return null;
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full">
      {lines.map((line) => (
        <path
          key={line.key}
          d={`M ${line.x1} ${line.y1} C ${line.x1 + 24} ${line.y1}, ${line.x2 - 24} ${line.y2}, ${line.x2} ${line.y2}`}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

export function MilestoneRail({
  groups,
  selectedId,
  onSelect,
  onDelete,
  onAdd,
  addSelectedModuleId,
}: {
  groups: MilestoneRailGroup[];
  selectedId: string | null;
  onSelect: (item: MilestoneRailItem, moduleId: string) => void;
  onDelete?: (item: MilestoneRailItem, moduleId: string) => void;
  onAdd?: (moduleId: string) => void;
  addSelectedModuleId?: string | null;
}) {
  return (
    <div
      className="flex min-w-0 flex-col gap-3 border-l p-2"
      style={{ borderColor: W.border, background: "var(--card)" }}
    >
      {groups.map((group) => (
        <div key={group.moduleId} className="flex flex-col gap-2">
          <p
            className="px-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: W.faint }}
          >
            {group.moduleName}
          </p>
          {group.items.map((item) => {
            const selected = selectedId === item.id;
            return (
              <div
                key={item.id}
                data-curriculum-anchor={`milestone:${item.id}`}
                className="flex items-center gap-2 rounded-lg border p-2"
                style={{
                  borderColor: selected
                    ? "rgba(139,92,246,0.55)"
                    : item.isCapstone
                      ? "rgba(139,92,246,0.4)"
                      : W.border,
                  background: selected ? "rgba(139,92,246,0.1)" : W.bg,
                }}
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border"
                  style={
                    item.isCapstone
                      ? {
                          background: "#8b5cf6",
                          borderColor: "#8b5cf6",
                          color: "#fff",
                        }
                      : {
                          background: "rgba(139,92,246,0.12)",
                          borderColor: "transparent",
                          color: "#8b5cf6",
                        }
                  }
                  aria-hidden
                >
                  <Flag className="size-4" strokeWidth={2.25} />
                </span>
                <button
                  type="button"
                  onClick={() => onSelect(item, group.moduleId)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span
                    className="block truncate text-[12.5px] font-semibold"
                    style={{ color: W.textStrong }}
                  >
                    {item.title}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5">
                    {item.isCapstone ? (
                      <span
                        className="rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
                        style={{ background: "#8b5cf6" }}
                      >
                        Capstone
                      </span>
                    ) : (
                      <span
                        className="text-[12px] font-bold tabular-nums"
                        style={{ color: "#8b5cf6" }}
                      >
                        Mốc {item.order}
                      </span>
                    )}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[11px]"
                    style={{ color: W.muted }}
                  >
                    {item.assignmentTitle}
                  </span>
                </button>
                {onDelete ? (
                  <button
                    type="button"
                    aria-label={`Xóa mốc ${item.title}`}
                    title="Xóa mốc"
                    onClick={() => onDelete(item, group.moduleId)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                ) : null}
              </div>
            );
          })}
          {onAdd ? (
            <button
              type="button"
              onClick={() => onAdd(group.moduleId)}
              className="rounded-lg border border-dashed px-2.5 py-2 text-left text-[11px] font-medium"
              style={{
                borderColor:
                  addSelectedModuleId === group.moduleId ? "#8b5cf6" : W.border,
                color: W.text,
              }}
            >
              Thêm milestone
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
