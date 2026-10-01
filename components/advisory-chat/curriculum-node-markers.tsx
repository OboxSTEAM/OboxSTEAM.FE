"use client";

import { AtSign, MessageSquare, MessagesSquare, Pin } from "lucide-react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { Button } from "@/components/ui/button";
import { CHANGE_KIND_LABELS } from "@/lib/advisory/change-format";
import { MENTION_TARGET_TYPE_LABELS, type MentionToken } from "@/lib/advisory/mention-token";
import { PIN_STATUS_BADGE_CLASSES } from "@/lib/advisory/pin-actions";
import type { TreeDiscussionCount } from "@/lib/advisory/tree-markers";
import type { CurriculumChangeKind } from "@/lib/api/advisory-chat/schemas";
import { cn } from "@/lib/utils";

/**
 * Tree row trailing markers: "Mới" tag for unseen changes, open-pin and message chips.
 * Chips are dashed when every counted message is about a child component.
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

  return (
    <span className="inline-flex items-center gap-1">
      {changeKind ? (
        <NewChangeTag title={`Thay đổi mới: ${CHANGE_KIND_LABELS[changeKind].toLowerCase()}`} />
      ) : null}
      {openPins > 0 ? (
        <MarkerChip
          kind="pin"
          value={openPins}
          isChildOnly={count?.ownOpenPinCount === 0}
          title={describeSplit("pin", openPins, count?.ownOpenPinCount ?? 0)}
        />
      ) : null}
      {messages > 0 ? (
        <MarkerChip
          kind="message"
          value={messages}
          isChildOnly={count?.ownMessageCount === 0}
          title={describeSplit("message", messages, count?.ownMessageCount ?? 0)}
        />
      ) : null}
    </span>
  );
}

/** One-line key for the tree markers, shown above the curriculum tree. */
export function TreeMarkerLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        <MarkerChip kind="message" value={2} isDecorative />
        tin nhắn
      </span>
      <span className="inline-flex items-center gap-1">
        <MarkerChip kind="pin" value={1} isDecorative />
        cần sửa
      </span>
      <span className="inline-flex items-center gap-1">
        <NewChangeTag isDecorative />
        thay đổi chưa xem
      </span>
      <span className="inline-flex items-center gap-1">
        <MarkerChip kind="message" value={2} isChildOnly isDecorative />
        chỉ ở mục con
      </span>
    </div>
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

function NewChangeTag({ title, isDecorative = false }: { title?: string; isDecorative?: boolean }) {
  return (
    <span
      title={title}
      aria-hidden={isDecorative || undefined}
      className="inline-flex h-4 items-center rounded-full bg-sky-500/12 px-1.5 text-[10px] leading-none font-semibold text-sky-700 dark:bg-sky-400/15 dark:text-sky-300"
    >
      Mới
      {title ? <span className="sr-only">: {title}</span> : null}
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
