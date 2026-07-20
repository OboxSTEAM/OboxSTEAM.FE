"use client";

import { BookOpen, FlaskConical, Lock, Sparkles } from "lucide-react";
import { useReducedMotion } from "motion/react";

import {
  MIND_MAP_KIND_LABELS,
  mindMapStatusTone,
  type MindMapLaidOutNode,
} from "@/lib/curriculum/mind-map";
import { cn } from "@/lib/utils";

type MindMapNodeCardProps = {
  node: MindMapLaidOutNode;
  isSelected: boolean;
  isExpanded: boolean;
  branchColor: string;
  onSelect: (nodeId: string) => void;
  onToggleExpand?: (nodeId: string) => void;
};

function ModuleIcon({
  moduleType,
  color,
}: {
  moduleType?: string;
  color: string;
}) {
  if (moduleType === "Research") {
    return <FlaskConical className="size-7" style={{ color }} aria-hidden />;
  }
  if (moduleType === "Experiential") {
    return <Sparkles className="size-7" style={{ color }} aria-hidden />;
  }
  return <BookOpen className="size-7" style={{ color }} aria-hidden />;
}

export function MindMapNodeCard({
  node,
  isSelected,
  isExpanded,
  branchColor,
  onSelect,
  onToggleExpand,
}: MindMapNodeCardProps) {
  const reduceMotion = useReducedMotion();
  const tone = mindMapStatusTone(node.status);
  const kindLabel = MIND_MAP_KIND_LABELS[node.kind];
  const progress =
    node.progressPercent != null
      ? Math.min(100, Math.max(0, Math.round(node.progressPercent)))
      : null;

  if (node.kind === "program") {
    return (
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        aria-pressed={isSelected}
        aria-label={`${kindLabel}: ${node.label}${progress != null ? `, ${progress}%` : ""}`}
        className={cn(
          "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-full px-5 py-3",
          "bg-[#26A69A] text-white shadow-[0_10px_28px_-12px_rgba(38,166,154,0.55)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7] focus-visible:ring-offset-2",
          "active:scale-[0.98]",
          isSelected && "ring-4 ring-[#26A69A]/25",
          !reduceMotion && "transition-[transform,box-shadow] duration-200",
        )}
        style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
      >
        <Sparkles className="size-4 shrink-0 opacity-90" aria-hidden />
        <span className="min-w-0 truncate font-heading text-sm font-bold">
          {node.label}
        </span>
        {progress != null ? (
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/85">
            {progress}%
          </span>
        ) : null}
      </button>
    );
  }

  if (node.kind === "module") {
    return (
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: node.x, top: node.y, width: node.width }}
      >
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          aria-pressed={isSelected}
          aria-label={`${kindLabel}: ${node.label}, ${tone.label}`}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-2xl border-2 bg-white px-3 py-3 text-center",
            "shadow-[0_8px_24px_-16px_rgba(45,45,45,0.28)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7] focus-visible:ring-offset-2",
            "active:scale-[0.98]",
            isSelected && "ring-4",
            node.isLocked && "opacity-65",
            !reduceMotion && "transition-[transform,box-shadow] duration-200",
          )}
          style={{
            borderColor: branchColor,
            ...(isSelected
              ? { boxShadow: `0 0 0 4px ${branchColor}33` }
              : undefined),
          }}
        >
          <ModuleIcon
            moduleType={node.module?.moduleInfo.moduleType}
            color={branchColor}
          />
          <span className="line-clamp-2 font-heading text-[13px] font-semibold leading-snug text-[#2D2D2D]">
            {node.label}
          </span>
          {node.isLocked ? (
            <Lock className="size-3.5 text-[#8a8a8a]" aria-hidden />
          ) : null}
          {node.isOnCurrentPath ? (
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-white"
              style={{ backgroundColor: branchColor }}
            >
              Đang học
            </span>
          ) : null}
        </button>
        {node.isExpandable && onToggleExpand ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpand(node.id);
            }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Thu gọn ${node.label}` : `Mở rộng ${node.label}`}
            className="absolute -bottom-3 left-1/2 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border border-[#E5E5E0] bg-white text-sm font-semibold text-[#2D2D2D] shadow-sm hover:bg-[#F5F5F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]"
          >
            {isExpanded ? "−" : "+"}
          </button>
        ) : null}
      </div>
    );
  }

  const isLeaf = node.kind === "activity" || node.kind === "assignment";
  const isContainer = node.kind === "course" || node.kind === "milestone";

  if (isLeaf) {
    return (
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        aria-pressed={isSelected}
        aria-label={`${kindLabel}: ${node.label}, ${tone.label}`}
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2 text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7] focus-visible:ring-offset-2",
          "active:scale-[0.98]",
          node.isLocked && "opacity-55",
        )}
        style={{ left: node.x, top: node.y, width: node.width }}
      >
        <span
          className={cn(
            "block line-clamp-2 text-[12px] font-medium leading-snug text-[#2D2D2D]",
            isSelected && "rounded-md bg-[#E94B3C]/10 px-1.5 py-0.5",
            node.isOnCurrentPath && !isSelected && "font-semibold text-[#E94B3C]",
          )}
        >
          {node.label}
        </span>
      </button>
    );
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: node.x, top: node.y, width: node.width }}
    >
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        aria-pressed={isSelected}
        aria-label={`${kindLabel}: ${node.label}, ${tone.label}`}
        className={cn(
          "w-full rounded-xl border bg-white/90 px-3 py-2.5 text-left backdrop-blur-sm",
          "shadow-[0_6px_18px_-14px_rgba(45,45,45,0.3)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7] focus-visible:ring-offset-2",
          "active:scale-[0.98]",
          isSelected ? "border-[#E94B3C]" : "border-[#E5E5E0]",
          node.isOnCurrentPath && !isSelected && "border-[#E94B3C]/45",
          node.isLocked && "opacity-60",
          !reduceMotion && "transition-[transform,border-color] duration-200",
        )}
      >
        <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#8a8a8a] uppercase">
          {kindLabel}
        </span>
        <span className="mt-0.5 block line-clamp-2 font-heading text-[12px] font-semibold leading-snug text-[#2D2D2D]">
          {node.label}
        </span>
      </button>
      {isContainer && node.isExpandable && onToggleExpand ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand(node.id);
          }}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Thu gọn ${node.label}` : `Mở rộng ${node.label}`}
          className="absolute -bottom-2.5 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border border-[#E5E5E0] bg-white text-[11px] font-semibold text-[#2D2D2D] shadow-sm hover:bg-[#F5F5F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]"
        >
          {isExpanded ? "−" : "+"}
        </button>
      ) : null}
    </div>
  );
}
