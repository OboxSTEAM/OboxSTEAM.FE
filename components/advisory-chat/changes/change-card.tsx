"use client";

import { useState } from "react";
import { AtSign } from "lucide-react";

import { FieldChange } from "@/components/advisory-chat/changes/field-change";
import { Button } from "@/components/ui/button";
import { CHANGE_KIND_BADGE_CLASSES, CHANGE_KIND_LABELS } from "@/lib/advisory/change-format";
import { MENTION_TARGET_TYPE_LABELS, type MentionToken } from "@/lib/advisory/mention-token";
import type { CurriculumChangeItem } from "@/lib/api";
import { formatRelativeTime } from "@/lib/classes/session-helpers";
import { cn } from "@/lib/utils";

const VISIBLE_FIELD_COUNT = 3;

type ChangeCardProps = {
  item: CurriculumChangeItem;
  onNavigate: (token: MentionToken) => void;
  onMention?: (token: MentionToken) => void;
};

/** One changed curriculum component in the consolidated diff. */
export function ChangeCard({ item, onNavigate, onMention }: ChangeCardProps) {
  const [isExpanded, setExpanded] = useState(false);
  const token: MentionToken = { targetType: item.targetType, targetId: item.targetId };
  const isDeleted = item.changeKind === "Deleted";
  const label = item.label || "Mục không tên";
  const ancestors = item.path
    .filter((segment) => segment.targetType !== "Program" && segment.targetId !== item.targetId)
    .map((segment) => segment.label)
    .filter(Boolean);
  const actors = item.changedBy
    .map((actor) => actor.name)
    .filter((name): name is string => Boolean(name));
  const changedAt = formatRelativeTime(item.lastChangedAt);
  const visibleFields = isExpanded ? item.fields : item.fields.slice(0, VISIBLE_FIELD_COUNT);
  const hiddenFieldCount = item.fields.length - visibleFields.length;

  return (
    <article
      className={cn(
        "space-y-2.5 rounded-xl border border-border bg-card p-3 dark:border-white/8 dark:bg-white/4",
        item.isUnseen && "ring-1 ring-primary/30",
      )}
    >
      <header className="space-y-1">
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "mt-px shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              CHANGE_KIND_BADGE_CLASSES[item.changeKind],
            )}
          >
            {CHANGE_KIND_LABELS[item.changeKind]}
          </span>
          <div className="min-w-0 flex-1">
            {isDeleted ? (
              <p className="truncate text-sm font-medium text-muted-foreground line-through">{label}</p>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(token)}
                className="max-w-full truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {label}
              </button>
            )}
            <p className="truncate text-[11px] text-muted-foreground">
              {MENTION_TARGET_TYPE_LABELS[item.targetType]}
              {ancestors.length > 0 ? ` · ${ancestors.join(" › ")}` : ""}
            </p>
          </div>
          {item.isUnseen ? (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              Mới
            </span>
          ) : null}
          {onMention && !isDeleted ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onMention(token)}
              aria-label={`Nhắc đến ${label} trong trò chuyện`}
              title="Nhắc trong trò chuyện"
              className="size-7 shrink-0"
            >
              <AtSign className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </header>

      {item.moved ? (
        <p className="text-xs text-foreground">
          {describeMove(item.moved)}
        </p>
      ) : null}

      {item.reorderedChildren.length > 0 ? (
        <ul className="space-y-0.5 text-xs text-foreground">
          {item.reorderedChildren.map((child) => (
            <li key={child.targetId} className="flex items-baseline gap-1.5">
              <span className="min-w-0 flex-1 truncate">{child.label || "Mục không tên"}</span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                {formatOrder(child.fromOrder)} → {formatOrder(child.toOrder)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {visibleFields.length > 0 ? (
        <div className="space-y-2.5">
          {visibleFields.map((field, index) => (
            <FieldChange
              key={`${field.fieldKey}-${index}`}
              field={field}
              targetType={item.targetType}
              changeKind={item.changeKind}
            />
          ))}
          {hiddenFieldCount > 0 ? (
            <Button type="button" variant="ghost" size="xs" onClick={() => setExpanded(true)}>
              Xem thêm {hiddenFieldCount} trường
            </Button>
          ) : null}
        </div>
      ) : null}

      {actors.length > 0 || changedAt ? (
        <footer className="text-[11px] text-muted-foreground">
          {actors.length > 0 ? actors.join(", ") : null}
          {actors.length > 0 && changedAt ? " · " : null}
          {changedAt}
        </footer>
      ) : null}
    </article>
  );
}

function describeMove(moved: NonNullable<CurriculumChangeItem["moved"]>): string {
  const from = moved.fromParentLabel;
  const to = moved.toParentLabel;
  if (from && to && from !== to) return `Chuyển từ “${from}” sang “${to}”.`;
  if (moved.fromOrder !== null && moved.toOrder !== null) {
    return `Đổi vị trí ${formatOrder(moved.fromOrder)} → ${formatOrder(moved.toOrder)}.`;
  }
  return to ? `Chuyển sang “${to}”.` : "Đã đổi vị trí.";
}

function formatOrder(order: number | null): string {
  return order === null ? "—" : `#${order}`;
}
