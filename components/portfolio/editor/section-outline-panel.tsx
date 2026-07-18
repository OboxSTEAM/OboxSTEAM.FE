"use client";

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
  onReorder: (orderedIds: string[]) => void;
  onToggleVisibility?: (id: string, visible: boolean) => void;
  className?: string;
};

function OutlineRow({
  entry,
  onToggleVisibility,
}: {
  entry: SectionOutlineEntry;
  onToggleVisibility?: SectionOutlinePanelProps["onToggleVisibility"];
}) {
  const controls = useDragControls();

  const scrollToSection = () => {
    const target = document.querySelector(
      `[data-portfolio-section="${entry.id}"]`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (entry.pinned) {
    return (
      <li className="list-none">
        <button
          type="button"
          onClick={scrollToSection}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-[#2D2D2D] transition-colors hover:bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50"
        >
          <UserRound className="size-3.5 shrink-0 text-[#0f7cad]" />
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
      className="list-none"
    >
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg px-1 py-1 transition-colors hover:bg-white",
          !entry.isVisible && "opacity-70",
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
          className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-[#6B6B6B] outline-none hover:bg-[#F0F0EA] hover:text-[#2D2D2D] active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50"
        >
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={scrollToSection}
          className="min-w-0 flex-1 truncate rounded-md px-1 py-1.5 text-left text-xs font-medium text-[#2D2D2D] outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50"
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
              <EyeOff className="size-3.5" strokeWidth={2.25} />
            ) : (
              <Eye className="size-3.5" strokeWidth={2.25} />
            )}
          </button>
        ) : null}
      </div>
    </Reorder.Item>
  );
}

/**
 * Sticky left hierarchy — quick jump + drag-reorder for portfolio sections.
 */
export function SectionOutlinePanel({
  entries,
  onReorder,
  onToggleVisibility,
  className,
}: SectionOutlinePanelProps) {
  const pinned = entries.filter((entry) => entry.pinned);
  const reorderable = entries.filter((entry) => !entry.pinned);
  const reorderIds = reorderable.map((entry) => entry.id);

  return (
    <aside
      aria-label="Cấu trúc portfolio"
      className={cn(
        "hidden w-[11.5rem] shrink-0 border-r border-[#E5E5E0] bg-[#FAFAF5] xl:block",
        className,
      )}
    >
      <div className="sticky top-[8.5rem] max-h-[calc(100vh-9.5rem)] overflow-y-auto px-2.5 py-4">
        <p className="px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f7cad]">
          Cấu trúc
        </p>
        <p className="mt-1 px-2 text-[11px] leading-snug text-[#6B6B6B]">
          Kéo để đổi thứ tự phần
        </p>

        <ul className="mt-3 space-y-0.5">
          {pinned.map((entry) => (
            <OutlineRow key={entry.id} entry={entry} />
          ))}
        </ul>

        {reorderable.length > 0 ? (
          <Reorder.Group
            as="ul"
            axis="y"
            values={reorderIds}
            onReorder={onReorder}
            className="mt-1 space-y-0.5"
          >
            {reorderable.map((entry) => (
              <OutlineRow
                key={entry.id}
                entry={entry}
                onToggleVisibility={onToggleVisibility}
              />
            ))}
          </Reorder.Group>
        ) : null}
      </div>
    </aside>
  );
}
