"use client";

import { AtSign, Info, MessageSquare, MessagesSquare, Pin } from "lucide-react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { CHANGE_KIND_LABELS } from "@/lib/advisory/change-format";
import { MENTION_TARGET_TYPE_LABELS, type MentionToken } from "@/lib/advisory/mention-token";
import { PIN_STATUS_BADGE_CLASSES } from "@/lib/advisory/pin-actions";
import type { TreeDiscussionCount } from "@/lib/advisory/tree-markers";
import type { CurriculumChangeKind } from "@/lib/api/advisory-chat/schemas";
import { cn } from "@/lib/utils";

/**
 * Tree row trailing markers, kept to one line: a dot for unseen changes plus a single
 * chip for the most urgent discussion state (open pins win over messages). The tooltip
 * carries the full breakdown. The chip is dashed when it only concerns child components.
 */
export function TreeNodeMarkers({
  count,
  changeKind,
}: {
  count?: TreeDiscussionCount;
  changeKind?: CurriculumChangeKind;
}) {
  const openPins = count?.openPinCount ?? 0;
  const messages = count?.messageCount ?? 0;
  if (!changeKind && openPins === 0 && messages === 0) return null;

  const hasPins = openPins > 0;
  const breakdown = [
    hasPins ? describeSplit("pin", openPins, count?.ownOpenPinCount ?? 0) : null,
    messages > 0 ? describeSplit("message", messages, count?.ownMessageCount ?? 0) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {changeKind ? (
        <NewChangeDot title={`Thay đổi mới: ${CHANGE_KIND_LABELS[changeKind].toLowerCase()}`} />
      ) : null}
      {hasPins || messages > 0 ? (
        <MarkerChip
          kind={hasPins ? "pin" : "message"}
          value={hasPins ? openPins : messages}
          isChildOnly={(hasPins ? count?.ownOpenPinCount : count?.ownMessageCount) === 0}
          title={breakdown}
        />
      ) : null}
    </>
  );
}

const LEGEND_ROWS = [
  { marker: <MarkerChip kind="pin" value={1} isDecorative />, text: "Mục cần sửa đang mở (ưu tiên hơn tin nhắn)" },
  { marker: <MarkerChip kind="message" value={2} isDecorative />, text: "Tin nhắn nhắc đến mục này" },
  { marker: <NewChangeDot isDecorative />, text: "Có thay đổi chưa xem" },
  { marker: <MarkerChip kind="message" value={2} isChildOnly isDecorative />, text: "Nét đứt: chỉ ở các mục con" },
] as const;

/** "Chú thích" button for the tree markers; the key opens on demand so it costs no tree space. */
export function TreeMarkerLegend() {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground"
          >
            <Info className="size-3" aria-hidden />
            Chú thích
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64 gap-2">
        <PopoverTitle className="text-xs">Ký hiệu trên cây</PopoverTitle>
        <ul className="flex flex-col gap-1.5">
          {LEGEND_ROWS.map((row) => (
            <li key={row.text} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex w-9 shrink-0 justify-start">{row.marker}</span>
              {row.text}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

const MARKER_CHIP_CLASSES = {
  message: {
    own: "bg-muted text-foreground/80 dark:bg-white/8",
    child: "border border-dashed border-muted-foreground/40 text-muted-foreground",
  },
  pin: {
    own: PIN_STATUS_BADGE_CLASSES.Open,
    child: "border border-dashed border-primary/45 text-primary/85",
  },
} as const;

function MarkerChip({
  kind,
  value,
  isChildOnly = false,
  isDecorative = false,
  title,
}: {
  kind: "message" | "pin";
  value: number;
  isChildOnly?: boolean;
  isDecorative?: boolean;
  title?: string;
}) {
  const Icon = kind === "pin" ? Pin : MessageSquare;
  return (
    <span
      title={title}
      aria-hidden={isDecorative || undefined}
      className={cn(
        "inline-flex h-4 items-center gap-0.5 rounded-full px-1.5 text-[10px] leading-none font-bold tabular-nums",
        MARKER_CHIP_CLASSES[kind][isChildOnly ? "child" : "own"],
      )}
    >
      <Icon className="size-2.5 shrink-0" strokeWidth={2.5} aria-hidden />
      {value}
      {title ? <span className="sr-only">{title}</span> : null}
    </span>
  );
}

function NewChangeDot({ title, isDecorative = false }: { title?: string; isDecorative?: boolean }) {
  return (
    <span
      title={title}
      aria-hidden={isDecorative || undefined}
      className="inline-flex size-2 shrink-0 rounded-full bg-sky-500 ring-2 ring-sky-500/20 dark:bg-sky-400 dark:ring-sky-400/20"
    >
      {title ? <span className="sr-only">{title}</span> : null}
    </span>
  );
}

const SPLIT_COPY = {
  message: { noun: "tin nhắn", relation: "nhắc đến" },
  pin: { noun: "mục cần sửa", relation: "đang mở ở" },
} as const;

function describeSplit(kind: keyof typeof SPLIT_COPY, total: number, own: number): string {
  const { noun, relation } = SPLIT_COPY[kind];
  const child = total - own;
  if (child === 0) return `${total} ${noun} ${relation} mục này`;
  if (own === 0) return `${total} ${noun} ${relation} các mục con`;
  return `${total} ${noun}: ${own} ở mục này, ${child} ở các mục con`;
}

/** Hover action on a tree row: push this component into the chat composer. */
export function TreeMentionButton({
  token,
  label,
}: {
  token: MentionToken;
  label: string;
}) {
  const { insertMention } = useAdvisoryChat();
  return (
    <button
      type="button"
      title="Nhắc trong trò chuyện"
      aria-label={`Nhắc ${label} trong trò chuyện`}
      onClick={(event) => {
        event.stopPropagation();
        insertMention(token);
      }}
      className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <AtSign className="size-3.5" strokeWidth={2.25} />
    </button>
  );
}

/** Discussion summary + actions for the component open in the detail panel. */
export function NodeDiscussionBar({
  token,
  count,
}: {
  token: MentionToken;
  count: TreeDiscussionCount;
}) {
  const { insertMention, setTargetFilter, setActiveTab, setChatOpen } = useAdvisoryChat();
  const typeLabel = MENTION_TARGET_TYPE_LABELS[token.targetType].toLowerCase();
  const hasDiscussion = count.messageCount > 0;

  function openDiscussion() {
    setTargetFilter(token);
    setActiveTab("chat");
    setChatOpen(true);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border bg-card px-4 py-2">
      <p className="min-w-0 flex-1 text-xs text-muted-foreground">
        {hasDiscussion ? (
          <>
            <span className="font-semibold text-foreground tabular-nums">{count.messageCount}</span>{" "}
            tin nhắn nhắc đến {typeLabel} này
            {count.openPinCount > 0 ? (
              <>
                {" · "}
                <span className="font-semibold text-primary tabular-nums">{count.openPinCount}</span>{" "}
                cần sửa
              </>
            ) : null}
          </>
        ) : (
          `Chưa có trao đổi nào về ${typeLabel} này.`
        )}
      </p>
      <div className="flex items-center gap-1.5">
        {hasDiscussion ? (
          <Button type="button" variant="ghost" size="sm" onClick={openDiscussion}>
            <MessagesSquare className="size-3.5" />
            Xem thảo luận
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={() => insertMention(token)}>
          <AtSign className="size-3.5" />
          Nhắc trong trò chuyện
        </Button>
      </div>
    </div>
  );
}
