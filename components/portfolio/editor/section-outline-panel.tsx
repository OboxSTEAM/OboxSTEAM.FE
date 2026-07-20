"use client";

import { useEffect, useRef, useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import { Eye, EyeOff, GripVertical, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

export type SectionOutlineEntry = {
  id: string;
  label: string;
  isVisible: boolean;
  /** Profile hero is pinned — shown but not reorderable. */
  pinned?: boolean;
};

type SectionOutlinePanelProps = {
  entries: SectionOutlineEntry[];
  /** Called once when a drag ends with the final order (not during drag). */
  onReorder: (orderedIds: string[]) => void;
  onToggleVisibility?: (id: string, visible: boolean) => void;
  className?: string;
};

const OUTLINE_DRAG_TRANSITION = {
  type: "tween" as const,
  duration: 0.15,
  ease: "easeOut" as const,
};

function OutlineRow({
  entry,
  onToggleVisibility,
  onDragEnd,
}: {
  entry: SectionOutlineEntry;
  onToggleVisibility?: SectionOutlinePanelProps["onToggleVisibility"];
  onDragEnd?: () => void;
}) {
  const controls = useDragControls();

  const scrollToSection = () => {
    const target = document.querySelector(
      `[data-portfolio-section="${entry.id}"]`,
    );
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  if (entry.pinned) {
    return (
      <li className="list-none">
        <button
          type="button"
          onClick={scrollToSection}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-semibold text-[#2D2D2D] transition-colors hover:bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50"
        >
          <UserRound className="size-4 shrink-0 text-[#0f7cad]" strokeWidth={2.25} />
          <span className="min-w-0 flex-1 truncate">{entry.label}</span>
        </button>
      </li>
    );
  }

  return (
    <Reorder.Item
      as="li"
      value={entry.id}
      dragListener={false}
      dragControls={controls}
      layout="position"
      transition={OUTLINE_DRAG_TRANSITION}
      onDragEnd={onDragEnd}
      className="list-none"
    >
      <div
        className={cn(
          "group flex items-center gap-0.5 rounded-lg px-1 py-1 transition-colors hover:bg-white",
        )}
      >
        <button
          type="button"
          aria-label={`Kéo sắp xếp ${entry.label}`}
          title="Kéo để sắp xếp"
          onPointerDown={(event) => {
            event.preventDefault();
            controls.start(event);
          }}
          className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-[#2D2D2D] outline-none hover:bg-[#F0F0EA] active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50"
        >
          <GripVertical className="size-4" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={scrollToSection}
          className={cn(
            "min-w-0 flex-1 truncate rounded-md px-1 py-1.5 text-left text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
            entry.isVisible ? "text-[#2D2D2D]" : "text-[#6B6B6B] line-through decoration-[#C9C9C2]",
          )}
        >
          {entry.label}
        </button>
        {onToggleVisibility ? (
          <button
            type="button"
            aria-label={entry.isVisible ? `Ẩn ${entry.label}` : `Hiện ${entry.label}`}
            title={entry.isVisible ? "Ẩn phần" : "Hiện phần"}
            onClick={() => onToggleVisibility(entry.id, !entry.isVisible)}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
              entry.isVisible
                ? "text-[#2D2D2D] hover:bg-[#F0F0EA]"
                : "bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]",
            )}
          >
            {entry.isVisible ? (
              <EyeOff className="size-4" strokeWidth={2.5} />
            ) : (
              <Eye className="size-4" strokeWidth={2.5} />
            )}
          </button>
        ) : null}
      </div>
    </Reorder.Item>
  );
}

/**
 * Sticky left hierarchy — quick jump + drag-reorder for portfolio sections.
 * Order is local while dragging; parent is notified once on drop.
 */
export function SectionOutlinePanel({
  entries,
  onReorder,
  onToggleVisibility,
  className,
}: SectionOutlinePanelProps) {
  const pinned = entries.filter((entry) => entry.pinned);
  const reorderable = entries.filter((entry) => !entry.pinned);
  const entryIds = reorderable.map((entry) => entry.id);
  const entryIdsKey = entryIds.join("|");

  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const isDraggingRef = useRef(false);
  const dragOrderRef = useRef<string[] | null>(null);

  useEffect(() => {
    if (isDraggingRef.current) return;
    setDragOrder(null);
    dragOrderRef.current = null;
  }, [entryIdsKey]);

  const values = dragOrder ?? entryIds;
  const orderedEntries = values
    .map((id) => reorderable.find((entry) => entry.id === id))
    .filter((entry): entry is SectionOutlineEntry => entry != null);

  const commitDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const next = dragOrderRef.current;
    setDragOrder(null);
    dragOrderRef.current = null;
    if (next && next.join("|") !== entryIdsKey) {
      onReorder(next);
    }
  };

  return (
    <aside
      aria-label="Cấu trúc portfolio"
      className={cn(
        "hidden w-[11.5rem] shrink-0 border-r border-[#E5E5E0] bg-[#FAFAF5] xl:block",
        className,
      )}
    >
      <div className="sticky top-[8.5rem] max-h-[calc(100dvh-9.5rem)] overflow-y-auto px-2.5 py-4">
        <p className="px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f7cad]">
          Cấu trúc
        </p>
        <p className="mt-1 px-2 text-[11px] leading-snug text-[#5C5C5C]">
          Kéo để đổi thứ tự phần
        </p>

        <ul className="mt-3 space-y-0.5">
          {pinned.map((entry) => (
            <OutlineRow key={entry.id} entry={entry} />
          ))}
        </ul>

        {orderedEntries.length > 0 ? (
          <Reorder.Group
            as="ul"
            axis="y"
            values={values}
            onReorder={(nextIds) => {
              isDraggingRef.current = true;
              dragOrderRef.current = nextIds;
              setDragOrder(nextIds);
            }}
            className="mt-1 space-y-0.5"
          >
            {orderedEntries.map((entry) => (
              <OutlineRow
                key={entry.id}
                entry={entry}
                onToggleVisibility={onToggleVisibility}
                onDragEnd={commitDrag}
              />
            ))}
          </Reorder.Group>
        ) : null}
      </div>
    </aside>
  );
}
