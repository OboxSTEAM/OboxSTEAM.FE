"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Loader2 } from "lucide-react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import {
  AdvisoryMessageItem,
  AdvisoryPendingMessageItem,
} from "@/components/advisory-chat/advisory-message-item";
import { AdvisorySystemMessage } from "@/components/advisory-chat/advisory-system-message";
import { DeleteMessageDialog } from "@/components/advisory-chat/delete-message-dialog";
import { SaveAttachmentMaterialDialog } from "@/components/advisory-chat/save-attachment-material-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { UseAdvisoryDiscussionResult } from "@/hooks/use-advisory-discussion";
import type { DiscussionAttachment, DiscussionMessage } from "@/lib/api";
import { parseApiDateTime } from "@/lib/api/datetime";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

const NEAR_BOTTOM_PX = 96;
const CONTINUATION_WINDOW_MS = 5 * 60_000;

type AdvisoryMessageListProps = {
  thread: UseAdvisoryDiscussionResult;
  /** Live thread: auto-scroll, read receipts and pending sends. */
  isLive?: boolean;
  emptyText?: string;
  className?: string;
};

/** Scrollable chat timeline with "load older", sticky-bottom behaviour and read receipts. */
export function AdvisoryMessageList({
  thread,
  isLive = true,
  emptyText = "Chưa có tin nhắn. Hãy bắt đầu trao đổi về chương trình.",
  className,
}: AdvisoryMessageListProps) {
  const { capabilities, currentUserId, materialActivities, discussion, isChatOpen, markRead } =
    useAdvisoryChat();
  const { messages, pending, isLoading, error, hasMoreBefore, isLoadingOlder, loadOlder, reload } =
    thread;

  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevFirstIdRef = useRef<string | null>(null);
  const prevLastKeyRef = useRef<string | null>(null);
  const prevScrollHeightRef = useRef(0);
  const [hasUnseenBelow, setHasUnseenBelow] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DiscussionMessage | null>(null);
  const [materialAttachment, setMaterialAttachment] = useState<DiscussionAttachment | null>(null);

  const canSaveMaterial = capabilities.canEditCurriculum && materialActivities.length > 0;
  const visiblePending = isLive ? pending : [];
  const firstId = messages[0]?.id ?? null;
  const lastKey = `${messages.at(-1)?.id ?? ""}:${messages.length}:${visiblePending.length}`;

  const tryMarkRead = useCallback(() => {
    if (!isLive || !isChatOpen || document.visibilityState !== "visible") return;
    if (isNearBottomRef.current) markRead();
  }, [isChatOpen, isLive, markRead]);

  const scrollToBottom = useCallback((smooth: boolean) => {
    const element = scrollRef.current;
    if (!element) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth && !prefersReducedMotion ? "smooth" : "auto",
    });
  }, []);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const prependedOlder =
      prevFirstIdRef.current !== null &&
      firstId !== prevFirstIdRef.current &&
      prevLastKeyRef.current === lastKey;
    const isFirstRender = prevLastKeyRef.current === null && messages.length > 0;
    const appended = prevLastKeyRef.current !== null && prevLastKeyRef.current !== lastKey;

    if (prependedOlder) {
      element.scrollTop += element.scrollHeight - prevScrollHeightRef.current;
    } else if (isFirstRender) {
      element.scrollTop = element.scrollHeight;
      isNearBottomRef.current = true;
    } else if (appended) {
      const lastMessage = messages.at(-1);
      const isOwnAppend =
        visiblePending.length > 0 ||
        (currentUserId !== null && lastMessage?.authorUserId === currentUserId);
      if (isNearBottomRef.current || isOwnAppend) {
        element.scrollTop = element.scrollHeight;
        isNearBottomRef.current = true;
      }
    }

    prevFirstIdRef.current = firstId;
    if (messages.length > 0 || visiblePending.length > 0) prevLastKeyRef.current = lastKey;
    prevScrollHeightRef.current = element.scrollHeight;
  }, [currentUserId, firstId, lastKey, messages, visiblePending.length]);

  useEffect(() => {
    if (!isNearBottomRef.current && prevLastKeyRef.current !== null) {
      const timer = window.setTimeout(() => setHasUnseenBelow(true), 0);
      return () => window.clearTimeout(timer);
    }
    tryMarkRead();
    return undefined;
  }, [lastKey, tryMarkRead]);

  useEffect(() => {
    if (!isLive) return;
    const onVisibility = () => tryMarkRead();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isLive, tryMarkRead]);

  function handleScroll() {
    const element = scrollRef.current;
    if (!element) return;
    prevScrollHeightRef.current = element.scrollHeight;
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    const isNearBottom = distance <= NEAR_BOTTOM_PX;
    isNearBottomRef.current = isNearBottom;
    if (isNearBottom) {
      setHasUnseenBelow(false);
      tryMarkRead();
    }
  }

  function handleLoadOlder() {
    if (scrollRef.current) prevScrollHeightRef.current = scrollRef.current.scrollHeight;
    loadOlder().catch((caught: unknown) => showAppErrorFromUnknown(caught, "advisory.messages"));
  }

  async function handleConfirmDelete(message: DiscussionMessage) {
    try {
      await discussion.remove(message.id);
      setPendingDelete(null);
    } catch (caught) {
      showAppErrorFromUnknown(caught, "advisory.message.delete");
    }
  }

  const showSkeleton = isLoading && messages.length === 0;
  const showError = !isLoading && error !== null && messages.length === 0;
  const showEmpty =
    !isLoading && error === null && messages.length === 0 && visiblePending.length === 0;

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-live={isLive ? "polite" : "off"}
        aria-relevant="additions"
        aria-busy={isLoading}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3"
      >
        {hasMoreBefore ? (
          <div className="flex justify-center pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLoadOlder}
              disabled={isLoadingOlder}
            >
              {isLoadingOlder ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Tải tin nhắn cũ hơn
            </Button>
          </div>
        ) : null}

        {showSkeleton ? <MessageListSkeleton /> : null}

        {showError ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Không tải được cuộc trò chuyện.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
              Thử lại
            </Button>
          </div>
        ) : null}

        {showEmpty ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : null}

        {messages.map((message, index) =>
          message.kind === "System" ? (
            <AdvisorySystemMessage key={message.id} message={message} />
          ) : (
            <AdvisoryMessageItem
              key={message.id}
              message={message}
              isContinuation={isContinuation(messages[index - 1], message)}
              onRequestDelete={setPendingDelete}
              onSaveAsMaterial={canSaveMaterial ? setMaterialAttachment : undefined}
            />
          ),
        )}

        {visiblePending.map((item) => (
          <AdvisoryPendingMessageItem key={item.clientMessageId} item={item} />
        ))}
      </div>

      {hasUnseenBelow ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            setHasUnseenBelow(false);
            scrollToBottom(true);
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md"
        >
          <ArrowDown className="size-3.5" />
          Tin nhắn mới
        </Button>
      ) : null}

      <DeleteMessageDialog
        message={pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
      <SaveAttachmentMaterialDialog
        attachment={materialAttachment}
        onOpenChange={(open) => {
          if (!open) setMaterialAttachment(null);
        }}
      />
    </div>
  );
}

function isContinuation(previous: DiscussionMessage | undefined, current: DiscussionMessage): boolean {
  if (!previous || previous.kind !== "User" || previous.isDeleted || current.isDeleted) return false;
  if (previous.authorUserId !== current.authorUserId) return false;
  const previousAt = parseApiDateTime(previous.createdAt)?.getTime();
  const currentAt = parseApiDateTime(current.createdAt)?.getTime();
  if (previousAt === undefined || currentAt === undefined) return false;
  return currentAt - previousAt <= CONTINUATION_WINDOW_MS;
}

function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-3 pt-4" aria-hidden>
      <div className="flex flex-col items-start gap-1.5">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-14 w-3/4 rounded-2xl" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-10 w-2/3 rounded-2xl" />
      </div>
      <div className="flex flex-col items-start gap-1.5">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-20 w-4/5 rounded-2xl" />
      </div>
    </div>
  );
}
