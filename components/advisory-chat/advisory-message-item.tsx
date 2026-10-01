"use client";

import { useState } from "react";
import { Loader2, MoreHorizontal, Pin, RotateCw } from "lucide-react";

import { AdvisoryAttachmentList } from "@/components/advisory-chat/advisory-attachment-list";
import {
  AdvisoryComposer,
  type AdvisoryComposerPayload,
} from "@/components/advisory-chat/advisory-composer";
import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { MessageText } from "@/components/advisory-chat/message-text";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PendingDiscussionMessage } from "@/hooks/use-advisory-discussion";
import {
  getAvailablePinActions,
  PIN_ACTION_LABELS,
  PIN_STATUS_BADGE_CLASSES,
  PIN_STATUS_LABELS,
} from "@/lib/advisory/pin-actions";
import type { AdvisoryUserRole, DiscussionAttachment, DiscussionMessage } from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { formatRelativeTime } from "@/lib/classes/session-helpers";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Partial<Record<AdvisoryUserRole, string>> = {
  Expert: "Chuyên gia",
  Manager: "Quản lý",
  Admin: "Quản trị",
};

type AdvisoryMessageItemProps = {
  message: DiscussionMessage;
  /** Same author shortly after the previous message — header hidden. */
  isContinuation?: boolean;
  onRequestDelete: (message: DiscussionMessage) => void;
  onSaveAsMaterial?: (attachment: DiscussionAttachment) => void;
};

export function AdvisoryMessageItem({
  message,
  isContinuation = false,
  onRequestDelete,
  onSaveAsMaterial,
}: AdvisoryMessageItemProps) {
  const {
    programId,
    currentUserId,
    capabilities,
    isStaff,
    discussion,
    togglePin,
    performPinAction,
  } = useAdvisoryChat();
  const [isEditing, setIsEditing] = useState(false);

  const isOwn = currentUserId !== null && message.authorUserId === currentUserId;
  const canModify = isOwn && !message.isDeleted && capabilities.canPost;
  const canTogglePin = capabilities.canPin && !message.isDeleted;
  const pinActions = message.pin
    ? getAvailablePinActions(message.pin.status, {
        isStaff,
        canResolvePin: capabilities.canResolvePin,
      })
    : [];
  const hasMenu = canModify || canTogglePin || pinActions.length > 0;

  async function handleEdit(payload: AdvisoryComposerPayload) {
    try {
      await discussion.edit(message.id, payload.text);
      setIsEditing(false);
    } catch (error) {
      showAppErrorFromUnknown(error, "advisory.message.edit");
    }
  }

  return (
    <article
      data-message-id={message.id}
      aria-label={`Tin nhắn của ${message.authorName ?? "người dùng"}`}
      className={cn(
        "group/message flex flex-col px-3",
        isOwn ? "items-end" : "items-start",
        isContinuation ? "pt-0.5" : "pt-3",
      )}
    >
      {!isContinuation ? (
        <MessageHeader message={message} isOwn={isOwn} />
      ) : null}

      <div className={cn("flex max-w-full items-start gap-1", isOwn && "flex-row-reverse")}>
        <div
          className={cn(
            "min-w-0 rounded-2xl px-3 py-2 transition-shadow",
            isEditing ? "w-[min(100%,22rem)]" : "w-fit max-w-[min(100%,22rem)]",
            isOwn
              ? "rounded-tr-md border border-primary/15 bg-primary/8"
              : "rounded-tl-md border border-border bg-muted/50",
            message.isDeleted && "border-dashed bg-transparent",
            "group-data-[highlighted]/message:ring-2 group-data-[highlighted]/message:ring-ring",
          )}
        >
          {message.pin ? (
            <span
              className={cn(
                "mb-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                PIN_STATUS_BADGE_CLASSES[message.pin.status],
              )}
            >
              <Pin className="size-3" aria-hidden />
              {PIN_STATUS_LABELS[message.pin.status]}
            </span>
          ) : null}

          {message.isDeleted ? (
            <p className="text-sm text-muted-foreground italic">Tin nhắn đã bị xoá</p>
          ) : isEditing ? (
            <AdvisoryComposer
              mode="edit"
              initialText={message.text}
              initialReferences={message.references}
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <MessageText
                text={message.text}
                references={message.references}
                className="text-foreground"
              />
              <AdvisoryAttachmentList
                programId={programId}
                attachments={message.attachments}
                onSaveAsMaterial={onSaveAsMaterial}
              />
            </>
          )}
        </div>

        {hasMenu && !isEditing ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Tuỳ chọn tin nhắn"
                  className="size-9 shrink-0 text-muted-foreground lg:size-7 lg:opacity-0 lg:group-focus-within/message:opacity-100 lg:group-hover/message:opacity-100 lg:data-[popup-open]:opacity-100"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-56">
              {canModify ? (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>Chỉnh sửa</DropdownMenuItem>
              ) : null}
              {canTogglePin ? (
                <DropdownMenuItem onClick={() => void togglePin(message)}>
                  {message.pin ? "Bỏ ghim" : "Ghim là cần sửa"}
                </DropdownMenuItem>
              ) : null}
              {pinActions.map((action) => (
                <DropdownMenuItem
                  key={action}
                  onClick={() => void performPinAction(message, action)}
                >
                  {PIN_ACTION_LABELS[action]}
                </DropdownMenuItem>
              ))}
              {canModify ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onRequestDelete(message)}>
                    Xoá tin nhắn
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </article>
  );
}

/** Optimistic message while sending, or after a failed send (retry / discard). */
export function AdvisoryPendingMessageItem({ item }: { item: PendingDiscussionMessage }) {
  const { programId, discussion } = useAdvisoryChat();
  const isFailed = item.status === "failed";

  function handleRetry() {
    discussion
      .retry(item)
      .catch((error: unknown) => showAppErrorFromUnknown(error, "advisory.message.send"));
  }

  return (
    <article
      aria-label={isFailed ? "Tin nhắn gửi thất bại" : "Tin nhắn đang gửi"}
      className="flex flex-col items-end px-3 pt-3"
    >
      <div
        className={cn(
          "w-fit max-w-[min(100%,22rem)] rounded-2xl rounded-tr-md border px-3 py-2",
          isFailed ? "border-destructive/40 bg-destructive/5" : "border-primary/15 bg-primary/8 opacity-70",
        )}
      >
        <MessageText text={item.text} className="text-foreground" />
        <AdvisoryAttachmentList programId={programId} attachments={item.attachments} />
      </div>
      <div className="mt-1 flex items-center gap-1 text-[11px]">
        {isFailed ? (
          <>
            <span className="text-destructive">Chưa gửi được.</span>
            <Button type="button" variant="ghost" size="xs" onClick={handleRetry}>
              <RotateCw className="size-3" />
              Thử lại
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => discussion.discard(item.clientMessageId)}
            >
              Bỏ
            </Button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Đang gửi…
          </span>
        )}
      </div>
    </article>
  );
}

function MessageHeader({ message, isOwn }: { message: DiscussionMessage; isOwn: boolean }) {
  const roleLabel = message.authorRole ? ROLE_LABELS[message.authorRole] : undefined;
  return (
    <div
      className={cn(
        "mb-1 flex max-w-full items-baseline gap-1.5 px-1 text-[11px]",
        isOwn && "flex-row-reverse",
      )}
    >
      <span className="truncate font-semibold text-foreground">
        {isOwn ? "Bạn" : (message.authorName ?? "Người dùng")}
      </span>
      {roleLabel && !isOwn ? <span className="text-muted-foreground">{roleLabel}</span> : null}
      <time
        dateTime={message.createdAt}
        title={formatApiDateTimeDisplay(message.createdAt)}
        className="shrink-0 text-muted-foreground"
      >
        {formatRelativeTime(message.createdAt)}
      </time>
      {message.editedAt && !message.isDeleted ? (
        <span className="text-muted-foreground" title={formatApiDateTimeDisplay(message.editedAt)}>
          (đã chỉnh sửa)
        </span>
      ) : null}
    </div>
  );
}
