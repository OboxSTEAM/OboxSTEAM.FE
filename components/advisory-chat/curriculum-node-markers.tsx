"use client";

import { AtSign, MessagesSquare } from "lucide-react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { Button } from "@/components/ui/button";
import { CHANGE_KIND_LABELS } from "@/lib/advisory/change-format";
import { MENTION_TARGET_TYPE_LABELS, type MentionToken } from "@/lib/advisory/mention-token";
import { PIN_STATUS_BADGE_CLASSES } from "@/lib/advisory/pin-actions";
import type { TreeDiscussionCount } from "@/lib/advisory/tree-markers";
import type { CurriculumChangeKind } from "@/lib/api/advisory-chat/schemas";
import { cn } from "@/lib/utils";

/** Tree row trailing markers: unseen change dot, open pins, discussion count. */
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
        <span
          className="size-2 rounded-full bg-sky-500"
          title={`Thay đổi mới: ${CHANGE_KIND_LABELS[changeKind].toLowerCase()}`}
        >
          <span className="sr-only">Thay đổi mới: {CHANGE_KIND_LABELS[changeKind]}</span>
        </span>
      ) : null}
      {openPins > 0 ? (
        <span
          className={cn(
            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
            PIN_STATUS_BADGE_CLASSES.Open,
          )}
          title={`${openPins} mục cần sửa đang mở (gồm mục con)`}
        >
          {openPins}
          <span className="sr-only"> mục cần sửa</span>
        </span>
      ) : null}
      {messages > 0 ? (
        <span
          className="inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground tabular-nums"
          title={`${messages} tin nhắn nhắc đến (gồm mục con)`}
        >
          {messages}
          <span className="sr-only"> tin nhắn</span>
        </span>
      ) : null}
    </span>
  );
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
