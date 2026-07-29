"use client";

import {
  BookOpen,
  Check,
  Compass,
  FlaskConical,
  Lock,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

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

const nodeMotion = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

function ModuleIcon({
  moduleType,
  color,
}: {
  moduleType?: string;
  color: string;
}) {
  if (moduleType === "Research") {
    return (
      <FlaskConical
        className="size-5 shrink-0"
        strokeWidth={2.1}
        style={{ color }}
        aria-hidden
      />
    );
  }
  if (moduleType === "Experiential") {
    return (
      <Sparkles
        className="size-5 shrink-0"
        strokeWidth={2.1}
        style={{ color }}
        aria-hidden
      />
    );
  }
  return (
    <BookOpen
      className="size-5 shrink-0"
      strokeWidth={2.1}
      style={{ color }}
      aria-hidden
    />
  );
}

function StatusDot({
  status,
  isLocked,
  isOnCurrentPath,
}: {
  status: MindMapLaidOutNode["status"];
  isLocked: boolean;
  isOnCurrentPath: boolean;
}) {
  if (isLocked) {
    return <Lock className="size-3 shrink-0 text-learn-muted" strokeWidth={2.25} aria-hidden />;
  }
  if (status === "completed" || status === "submitted") {
    return (
      <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-learn-success/20 text-learn-success">
        <Check className="size-2.5" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (isOnCurrentPath || status === "current" || status === "in_progress") {
    return (
      <span
        className="size-2.5 shrink-0 rounded-full bg-learn-primary"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="size-2 shrink-0 rounded-full bg-learn-border"
      aria-hidden
    />
  );
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

  const motionProps = reduceMotion
    ? {}
    : {
        initial: nodeMotion.initial,
        animate: nodeMotion.animate,
        exit: nodeMotion.exit,
        transition: { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.7 },
      };

  const expandOnSide = node.side === "right" ? "right" : "left";

  if (node.kind === "program") {
    return (
      <motion.button
        type="button"
        {...motionProps}
        onClick={() => onSelect(node.id)}
        aria-pressed={isSelected}
        aria-label={`${kindLabel}: ${node.label}${progress != null ? `, ${progress}%` : ""}`}
        className={cn(
          "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full px-3 text-center",
          "border-[2.5px] border-dotted border-learn-text-strong bg-learn-surface text-learn-text-strong",
          "shadow-[0_10px_24px_-12px_color-mix(in_srgb,var(--learn-text-strong)_28%,transparent),0_0_0_8px_color-mix(in_srgb,var(--learn-text-strong)_5%,transparent)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn-accent focus-visible:ring-offset-2",
          "active:scale-[0.98]",
          isSelected &&
            "border-learn-primary shadow-[0_10px_24px_-12px_color-mix(in_srgb,var(--learn-primary)_30%,transparent),0_0_0_8px_color-mix(in_srgb,var(--learn-primary)_10%,transparent)]",
        )}
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
        }}
      >
        <Compass
          className="size-5 shrink-0 text-learn-primary"
          strokeWidth={2.2}
          aria-hidden
        />
        <span className="line-clamp-2 font-heading text-[11px] font-extrabold leading-snug tracking-tight break-words">
          {node.label}
        </span>
      </motion.button>
    );
  }

  if (node.kind === "module") {
    return (
      <motion.div
        {...motionProps}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: node.x, top: node.y, width: node.width }}
      >
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          aria-pressed={isSelected}
          aria-label={`${kindLabel}: ${node.label}, ${tone.label}`}
          className={cn(
            "flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-2xl border bg-learn-surface px-3 py-2.5 text-center",
            "shadow-[0_4px_14px_-10px_color-mix(in_srgb,var(--learn-text-strong)_28%,transparent)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn-accent focus-visible:ring-offset-2",
            "active:scale-[0.98]",
            node.isLocked && "opacity-60",
            isSelected && "ring-2 ring-offset-1",
            node.isOnCurrentPath && !isSelected && "border-learn-primary/70",
          )}
          style={{
            borderColor: node.isOnCurrentPath ? undefined : branchColor,
            ...(isSelected
              ? { boxShadow: `0 0 0 3px ${branchColor}28` }
              : undefined),
          }}
        >
          <ModuleIcon
            moduleType={node.module?.moduleInfo.moduleType}
            color={node.isOnCurrentPath ? "var(--learn-primary)" : branchColor}
          />
          <span className="line-clamp-2 font-heading text-[13px] font-bold leading-snug tracking-tight text-learn-text-strong">
            {node.label}
          </span>
          <StatusDot
            status={node.status}
            isLocked={node.isLocked}
            isOnCurrentPath={node.isOnCurrentPath}
          />
        </button>
        {node.isExpandable && onToggleExpand ? (
          <ExpandButton
            side={expandOnSide}
            isExpanded={isExpanded}
            label={node.label}
            onToggle={() => onToggleExpand(node.id)}
          />
        ) : null}
      </motion.div>
    );
  }

  const isLeaf = node.kind === "activity" || node.kind === "assignment";
  const isContainer = node.kind === "course" || node.kind === "milestone";

  if (isLeaf) {
    return (
      <motion.div
        {...motionProps}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: node.x, top: node.y, width: node.width }}
      >
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          aria-pressed={isSelected}
          aria-label={`${kindLabel}: ${node.label}, ${tone.label}`}
          className={cn(
            "flex min-h-9 w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn-accent focus-visible:ring-offset-1",
            "active:scale-[0.98]",
            "hover:bg-learn-surface/70",
            isSelected && "bg-learn-surface ring-2 ring-learn-primary/25",
            node.isLocked && "opacity-55",
          )}
        >
          <StatusDot
            status={node.status}
            isLocked={node.isLocked}
            isOnCurrentPath={node.isOnCurrentPath}
          />
          <span
            className={cn(
              "line-clamp-2 min-w-0 flex-1 font-heading text-[12px] font-semibold leading-snug tracking-tight text-learn-text",
              node.isOnCurrentPath && "font-bold text-learn-primary",
              node.status === "completed" && "text-learn-success",
            )}
          >
            {node.label}
          </span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...motionProps}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: node.x, top: node.y, width: node.width }}
    >
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        aria-pressed={isSelected}
        aria-label={`${kindLabel}: ${node.label}, ${tone.label}`}
        className={cn(
          "flex min-h-10 w-full items-center gap-2 rounded-xl border border-learn-border bg-learn-surface/90 px-2.5 py-2 text-left",
          "shadow-[0_2px_10px_-8px_color-mix(in_srgb,var(--learn-text-strong)_25%,transparent)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn-accent focus-visible:ring-offset-2",
          "active:scale-[0.98]",
          isSelected && "border-learn-primary ring-2 ring-learn-primary/15",
          node.isOnCurrentPath && !isSelected && "border-learn-primary/50",
          node.isLocked && "opacity-60",
        )}
      >
        <StatusDot
          status={node.status}
          isLocked={node.isLocked}
          isOnCurrentPath={node.isOnCurrentPath}
        />
        <span
          className={cn(
            "line-clamp-2 min-w-0 flex-1 font-heading text-[12px] font-bold leading-snug tracking-tight text-learn-text-strong",
            node.isOnCurrentPath && "text-learn-primary",
          )}
        >
          {node.label}
        </span>
      </button>
      {isContainer && node.isExpandable && onToggleExpand ? (
        <ExpandButton
          side={expandOnSide}
          isExpanded={isExpanded}
          label={node.label}
          onToggle={() => onToggleExpand(node.id)}
        />
      ) : null}
    </motion.div>
  );
}

function ExpandButton({
  side,
  isExpanded,
  label,
  onToggle,
}: {
  side: "left" | "right";
  isExpanded: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? `Thu gọn ${label}` : `Mở rộng ${label}`}
      className={cn(
        "absolute top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full",
        "border border-learn-border bg-learn-surface text-[11px] font-bold text-learn-text-strong",
        "shadow-[0_2px_6px_-3px_color-mix(in_srgb,var(--learn-text-strong)_30%,transparent)]",
        "hover:bg-learn-surface-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-learn-accent",
        side === "right" ? "-right-3" : "-left-3",
      )}
    >
      {isExpanded ? "−" : "+"}
    </button>
  );
}
