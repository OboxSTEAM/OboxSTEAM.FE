"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  Activity as ActivityIcon,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Flag,
  FolderOpen,
  LayoutGrid,
  Plus,
  Trash,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/** Shared structure-tree tokens — keep identical to manager curriculum panel. */
export const STRUCTURE_W = {
  bg: "var(--background)",
  surface: "var(--card)",
  surface2: "var(--muted)",
  surface3: "var(--secondary)",
  border: "var(--border)",
  textStrong: "var(--foreground)",
  text: "var(--foreground)",
  muted: "var(--muted-foreground)",
  faint: "var(--muted-foreground)",
  accent: "#4fc3f7",
  success: "#7cb342",
  primary: "var(--primary)",
} as const;

export type StructureNodeKind =
  | "program"
  | "module"
  | "course"
  | "activity"
  | "assignment"
  | "milestone";

export const STRUCTURE_NODE_ICON: Record<
  StructureNodeKind,
  { Icon: LucideIcon; color: string; bg: string }
> = {
  program: { Icon: LayoutGrid, color: "#E94B3C", bg: "var(--card)" },
  module: { Icon: FolderOpen, color: "#7CB342", bg: "var(--card)" },
  course: { Icon: BookOpen, color: "#4FC3F7", bg: "var(--card)" },
  activity: { Icon: ActivityIcon, color: "#9c27b0", bg: "var(--card)" },
  assignment: { Icon: ClipboardList, color: "#f59e0b", bg: "var(--card)" },
  milestone: { Icon: Flag, color: "#8b5cf6", bg: "var(--card)" },
};

/** Sibling reorder spring — skipped when prefers-reduced-motion. */
export const STRUCTURE_LAYOUT_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 36,
  mass: 0.85,
};

export const CurriculumMutateContext = createContext(true);

export function useCurriculumMutate() {
  return useContext(CurriculumMutateContext);
}

function StructureTreeGuides({
  depth,
  isLast,
}: {
  depth: number;
  isLast: boolean;
}) {
  if (depth <= 0) return null;
  return (
    <>
      <span
        className={cn(
          "pointer-events-none absolute left-0 z-0 w-px",
          isLast ? "top-0 h-[1.125rem]" : "inset-y-0",
        )}
        style={{ background: STRUCTURE_W.border }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute top-[1.125rem] left-0 z-0 h-px w-3"
        style={{ background: STRUCTURE_W.border }}
        aria-hidden
      />
    </>
  );
}

/** Quiet action chip — lives in StructureAddTray, not as a fake tree node. */
export function StructureAddLeafButton({
  label,
  selected,
  onClick,
  icon: Icon,
  className,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  className?: string;
}) {
  const canMutate = useCurriculumMutate();
  if (!canMutate) return null;

  const accent = STRUCTURE_W.accent;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] font-medium transition-colors",
        selected
          ? "bg-[color:color-mix(in_srgb,var(--add-c)_14%,transparent)] text-[color:var(--add-c)] ring-1 ring-[color:color-mix(in_srgb,var(--add-c)_35%,transparent)]"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        className,
      )}
      style={{ ["--add-c" as string]: accent }}
    >
      {Icon ? (
        <Icon className="size-3 shrink-0 opacity-80" />
      ) : (
        <Plus className="size-3 shrink-0 opacity-70" />
      )}
      {label}
    </button>
  );
}

/**
 * Footer tray under a branch — dashed separator, stacked actions with gap.
 * Keeps “Thêm …” out of the tree guide / sibling geometry.
 */
export function StructureAddTray({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const canMutate = useCurriculumMutate();
  if (!canMutate) return null;

  return (
    <li className="relative list-none">
      <div
        className={cn(
          "ml-3 mt-1.5 flex flex-col gap-1.5 border-t border-dashed border-border/70 pt-2 pl-1",
          className,
        )}
      >
        {children}
      </div>
    </li>
  );
}

type FlyoutPosition = { top: number; left: number };

/**
 * Hover state for the row actions. The actions render in a portal beside the tree panel,
 * so they never cover the row; a short close delay lets the pointer cross the gap.
 */
function useRowFlyout(rowRef: RefObject<HTMLDivElement | null>) {
  const closeTimer = useRef<number | null>(null);
  const [position, setPosition] = useState<FlyoutPosition | null>(null);
  const isOpen = position !== null;

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const open = useCallback(() => {
    cancelClose();
    const row = rowRef.current;
    if (!row) return;
    const rowRect = row.getBoundingClientRect();
    const panelRight =
      row.closest("[data-structure-panel]")?.getBoundingClientRect().right ?? rowRect.right;
    setPosition({ top: rowRect.top + rowRect.height / 2, left: panelRight + 6 });
  }, [cancelClose, rowRef]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setPosition(null), 140);
  }, [cancelClose]);

  useEffect(() => {
    if (!isOpen) return;
    const close = () => setPosition(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [isOpen]);

  useEffect(() => cancelClose, [cancelClose]);

  return { position, open, cancelClose, scheduleClose };
}

function RowActionsFlyout({
  position,
  onEnter,
  onLeave,
  children,
}: {
  position: FlyoutPosition;
  onEnter: () => void;
  onLeave: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <div
      role="toolbar"
      aria-label="Thao tác với mục"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className="fixed z-50 flex -translate-y-1/2 items-center gap-px rounded-lg border border-border bg-popover p-0.5 shadow-md animate-in fade-in-0 slide-in-from-left-1 duration-100"
      style={{ top: position.top, left: position.left }}
    >
      {children}
    </div>,
    document.body,
  );
}

function RowActionButton({
  title,
  label,
  disabled = false,
  isDestructive = false,
  onClick,
  children,
}: {
  title: string;
  label: string;
  disabled?: boolean;
  isDestructive?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "flex size-6 items-center justify-center rounded text-muted-foreground transition-colors disabled:pointer-events-none disabled:opacity-30",
        isDestructive
          ? "hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function StructureTreeRow({
  depth,
  isLast,
  selected,
  kind,
  label,
  meta,
  onSelect,
  onDelete,
  defaultOpen = false,
  forceOpen = false,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  moveBusy = false,
  trailing,
  hoverActions,
  /** DOM hook for relation lines and chat mention navigation (`{kind}:{id}`). */
  anchorId,
  /** Activity used by the milestone selected in the side rail. */
  linked,
  /** Replaces the default title + meta stack (milestone cards). */
  body,
  iconOverride,
  children,
}: {
  depth: number;
  isLast: boolean;
  selected: boolean;
  kind: StructureNodeKind;
  label: string;
  meta?: string;
  onSelect: () => void;
  onDelete?: () => void;
  /** Initial expand state (e.g. program root). */
  defaultOpen?: boolean;
  /** Keep open when selection / create-flow lives under this node. */
  forceOpen?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  moveBusy?: boolean;
  /** Optional end-of-row markers (e.g. pin counts) — manager leaves empty. */
  trailing?: ReactNode;
  /** Extra hover/focus actions shown even when the tree is read-only. */
  hoverActions?: ReactNode;
  anchorId?: string;
  linked?: boolean;
  body?: ReactNode;
  iconOverride?: { color: string; bg: string; border?: string };
  children?: ReactNode;
}) {
  const canMutate = useCurriculumMutate();
  const reduceMotion = useReducedMotion();
  const childItems = useMemo(
    () => (Array.isArray(children) ? children : [children]).filter(Boolean),
    [children],
  );
  const effectiveOnDelete = canMutate ? onDelete : undefined;
  const showReorder = canMutate && (onMoveUp != null || onMoveDown != null);
  const hasBranch = childItems.length > 0;
  const hasActions = showReorder || Boolean(effectiveOnDelete) || Boolean(hoverActions);
  const rowRef = useRef<HTMLDivElement>(null);
  const flyout = useRowFlyout(rowRef);
  const [open, setOpen] = useState(defaultOpen || forceOpen);
  if ((forceOpen || selected) && !open) {
    setOpen(true);
  }
  const { Icon: NodeIcon, color: iconColor, bg: iconBg } = STRUCTURE_NODE_ICON[kind];
  const resolvedIconColor = iconOverride?.color ?? iconColor;
  const resolvedIconBg = iconOverride?.bg ?? iconBg;
  const resolvedIconBorder =
    iconOverride?.border ??
    (selected ? "rgba(79,195,247,0.35)" : STRUCTURE_W.border);

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <motion.li
      layout={reduceMotion ? false : "position"}
      transition={reduceMotion ? { duration: 0 } : STRUCTURE_LAYOUT_TRANSITION}
      className="relative"
    >
      <StructureTreeGuides depth={depth} isLast={isLast} />
      <div className={cn("relative z-10", depth > 0 && "ml-3")}>
        <div
          ref={rowRef}
          data-curriculum-anchor={anchorId}
          onMouseEnter={hasActions ? flyout.open : undefined}
          onMouseLeave={hasActions ? flyout.scheduleClose : undefined}
          onFocus={hasActions ? flyout.open : undefined}
          onBlur={hasActions ? flyout.scheduleClose : undefined}
          className="flex items-center gap-0.5 rounded-lg"
          style={{
            background: selected
              ? "rgba(79,195,247,0.13)"
              : linked
                ? "rgba(139,92,246,0.12)"
                : "transparent",
            border: selected
              ? "1px solid rgba(79,195,247,0.28)"
              : linked
                ? "1px solid rgba(139,92,246,0.35)"
                : "1px solid transparent",
          }}
        >
          {hasBranch ? (
            <button
              type="button"
              title={open ? "Thu gọn" : "Mở rộng"}
              aria-expanded={open}
              aria-label={open ? `Thu gọn ${label}` : `Mở rộng ${label}`}
              onClick={handleToggle}
              className="flex size-6 shrink-0 items-center justify-center rounded"
              style={{ color: STRUCTURE_W.faint }}
            >
              <ChevronRight
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  open && "rotate-90",
                )}
              />
            </button>
          ) : (
            <span className="size-6 shrink-0" aria-hidden />
          )}

          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-[7px] border shadow-[0_1px_2px_rgba(45,43,39,0.06)]"
            style={{
              background: resolvedIconBg,
              borderColor: resolvedIconBorder,
              color: resolvedIconColor,
            }}
            aria-hidden
          >
            <NodeIcon className="size-3.5" strokeWidth={2.25} />
          </span>

          <button
            type="button"
            onClick={() => {
              if (hasBranch) setOpen(true);
              onSelect();
            }}
            className="flex min-w-0 flex-1 flex-col py-1.5 pl-1.5 pr-2 text-left"
          >
            {body ?? (
              <>
                <span
                  className={cn(
                    "truncate text-[12.5px] leading-snug",
                    selected ? "text-[#0d6e9c] dark:text-[#7dd3fc]" : "",
                  )}
                  style={{
                    color: selected ? undefined : STRUCTURE_W.text,
                    fontWeight: selected ? 600 : 500,
                  }}
                >
                  {label}
                </span>
                {meta && (
                  <span
                    className="mt-0.5 truncate text-[10px]"
                    style={{ color: STRUCTURE_W.faint }}
                  >
                    {meta}
                  </span>
                )}
              </>
            )}
          </button>

          {trailing ? (
            <div className="flex shrink-0 items-center gap-1.5 pr-2">{trailing}</div>
          ) : null}
        </div>
        {hasBranch && open ? (
          <ul className="relative mt-0.5" role="list">
            {children}
          </ul>
        ) : null}
      </div>
      {flyout.position ? (
        <RowActionsFlyout
          position={flyout.position}
          onEnter={flyout.cancelClose}
          onLeave={flyout.scheduleClose}
        >
          {hoverActions}
          {showReorder ? (
            <>
              <RowActionButton
                title="Đưa lên"
                label={`Đưa lên ${label}`}
                disabled={moveBusy || !canMoveUp}
                onClick={onMoveUp}
              >
                <ChevronUp className="size-3.5" strokeWidth={2.25} />
              </RowActionButton>
              <RowActionButton
                title="Đưa xuống"
                label={`Đưa xuống ${label}`}
                disabled={moveBusy || !canMoveDown}
                onClick={onMoveDown}
              >
                <ChevronDown className="size-3.5" strokeWidth={2.25} />
              </RowActionButton>
            </>
          ) : null}
          {effectiveOnDelete ? (
            <RowActionButton
              title="Xóa"
              label={`Xóa ${label}`}
              isDestructive
              onClick={effectiveOnDelete}
            >
              <Trash className="size-3" />
            </RowActionButton>
          ) : null}
        </RowActionsFlyout>
      ) : null}
    </motion.li>
  );
}

export function StructureTreePanelHeader({
  hint,
  action,
}: {
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex shrink-0 items-start justify-between gap-2 border-b px-3 py-2.5"
      style={{ borderColor: STRUCTURE_W.border }}
    >
      <div>
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: STRUCTURE_W.faint }}
        >
          Cấu trúc
        </span>
        <p
          className="mt-0.5 text-[11px] leading-snug"
          style={{ color: STRUCTURE_W.muted }}
        >
          {hint}
        </p>
      </div>
      {action ? <div className="-mt-0.5 -mr-1 shrink-0">{action}</div> : null}
    </div>
  );
}
