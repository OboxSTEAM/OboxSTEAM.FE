"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ChevronUp,
  Link2,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getAdvisoryDiscussionMessages,
  postAdvisoryDiscussionMessage,
  recordAdvisoryDiscussionRead,
  type AdvisoryDiscussionMessage,
  type AdvisoryReference,
} from "@/lib/api";
import type { AdvisoryCapabilities } from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

type AdvisoryDiscussionPanelProps = {
  programId: string;
  capabilities?: AdvisoryCapabilities;
  pendingReference?: AdvisoryReference | null;
  onReferenceClick?: (reference: AdvisoryReference) => void;
  onReferenceConsumed?: () => void;
  className?: string;
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

function mergeMessages(
  current: AdvisoryDiscussionMessage[],
  incoming: AdvisoryDiscussionMessage[],
): AdvisoryDiscussionMessage[] {
  const map = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) map.set(message.id, message);
  return [...map.values()].sort((left, right) => left.sequence - right.sequence);
}

function referenceLabel(reference: AdvisoryReference): string {
  if (reference.capturedLabel) return reference.capturedLabel;
  if (reference.fieldKey) return reference.fieldKey;
  return "Mở tham chiếu";
}

export function AdvisoryDiscussionPanel({
  programId,
  capabilities,
  pendingReference = null,
  onReferenceClick,
  onReferenceConsumed,
  className,
}: AdvisoryDiscussionPanelProps) {
  const [messages, setMessages] = useState<AdvisoryDiscussionMessage[]>([]);
  const [beforeCursor, setBeforeCursor] = useState<string | null>(null);
  const [hasMoreBefore, setHasMoreBefore] = useState(false);
  const [text, setText] = useState("");
  const [references, setReferences] = useState<AdvisoryReference[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [failedDraft, setFailedDraft] = useState<{
    text: string;
    references: AdvisoryReference[];
    clientMessageId: string;
  } | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastReadSequenceRef = useRef(0);
  const [lastReadSequence, setLastReadSequence] = useState(0);

  const { data, isLoading, retry } = useClientFetch({
    fetcher: () => getAdvisoryDiscussionMessages(programId, { pageSize: 50 }),
    deps: [programId],
    onError: (error) => showAppErrorFromUnknown(error, "programs.advisory"),
  });

  useEffect(() => {
    if (!data?.data) return;
    // The response is external state that is merged into the local pagination state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages((current) => mergeMessages(current, data.data.messages));
    setBeforeCursor(data.data.before);
    setHasMoreBefore(data.data.hasMoreBefore);
  }, [data]);

  useEffect(() => {
    if (!pendingReference) return;
    // Pending references are delivered by the parent as an external event.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReferences((current) =>
      current.some((reference) => reference.id === pendingReference.id)
        ? current
        : [...current, pendingReference],
    );
    onReferenceConsumed?.();
  }, [onReferenceConsumed, pendingReference]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") retry();
    };
    const interval = window.setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [retry]);

  const acknowledgeVisibleMessages = useCallback(() => {
    const last = messages[messages.length - 1];
    if (!last || last.sequence <= lastReadSequenceRef.current) return;
    lastReadSequenceRef.current = last.sequence;
    setLastReadSequence(last.sequence);
    void recordAdvisoryDiscussionRead(programId, {
      lastDisplayedSequence: last.sequence,
      cursor: last.cursor,
    }).catch(() => undefined);
  }, [messages, programId]);

  useEffect(() => {
    if (messages.length > 0 && isAtBottom) acknowledgeVisibleMessages();
  }, [acknowledgeVisibleMessages, isAtBottom, messages.length]);

  const handleScroll = () => {
    const element = scrollerRef.current;
    if (!element) return;
    const atBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 32;
    setIsAtBottom(atBottom);
    if (atBottom) {
      acknowledgeVisibleMessages();
    }
  };

  async function loadOlder() {
    if (!beforeCursor || isLoadingOlder) return;
    const element = scrollerRef.current;
    const previousHeight = element?.scrollHeight ?? 0;
    setIsLoadingOlder(true);
    try {
      const result = await getAdvisoryDiscussionMessages(programId, {
        before: beforeCursor,
        pageSize: 50,
      });
      if (!result) return;
      const page = result.data;
      if (page) {
        setMessages((current) => mergeMessages(page.messages, current));
        setBeforeCursor(page.before);
        setHasMoreBefore(page.hasMoreBefore);
        requestAnimationFrame(() => {
          if (element) element.scrollTop += element.scrollHeight - previousHeight;
        });
      }
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.advisory");
    } finally {
      setIsLoadingOlder(false);
    }
  }

  async function sendMessage() {
    if (!capabilities?.canDiscuss || isSending) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const clientMessageId = failedDraft?.clientMessageId ?? crypto.randomUUID();
    const selectedReferences = failedDraft?.references ?? references;
    setIsSending(true);
    try {
      const result = await postAdvisoryDiscussionMessage(programId, {
        text: trimmed,
        referenceIds: selectedReferences.map((reference) => reference.id),
        clientMessageId,
      });
      if (result?.data) {
        setMessages((current) => mergeMessages(current, [result.data]));
      }
      setText("");
      setReferences([]);
      setFailedDraft(null);
      onReferenceConsumed?.();
      requestAnimationFrame(() => {
        const element = scrollerRef.current;
        if (element) element.scrollTop = element.scrollHeight;
      });
    } catch (error) {
      setFailedDraft({ text: trimmed, references: selectedReferences, clientMessageId });
      showAppErrorFromUnknown(error, "programs.advisory");
    } finally {
      setIsSending(false);
    }
  }

  const composerText = failedDraft?.text ?? text;
  const displayedReferences = failedDraft?.references ?? references;
  const latestSequence = messages[messages.length - 1]?.sequence ?? 0;
  const hasUnreadLocal = latestSequence > lastReadSequence;
  const canDiscuss = capabilities?.canDiscuss !== false;

  return (
    <section className={cn("flex min-h-[520px] flex-col bg-muted/10", className)}>
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-bold text-foreground">Trao đổi</p>
          <p className="text-xs text-muted-foreground">Trao đổi chung của chương trình</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => retry()}
          className="size-8 rounded-lg p-0"
          aria-label="Làm mới trao đổi"
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </header>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
      >
        {hasMoreBefore ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadOlder()}
            disabled={isLoadingOlder}
            className="mx-auto flex h-8 rounded-lg text-xs"
          >
            {isLoadingOlder ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <ChevronUp className="mr-1.5 size-3.5" />}
            Tải trao đổi cũ hơn
          </Button>
        ) : null}

        {isLoading && messages.length === 0 ? (
          <>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </>
        ) : messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Chưa có trao đổi nào.
          </p>
        ) : (
          messages.map((message, index) => (
            <div key={message.id}>
              {index > 0 && message.sequence > lastReadSequence && messages[index - 1]!.sequence <= lastReadSequence ? (
                <p className="mb-2 border-y border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Tin mới
                </p>
              ) : null}
              <article className="rounded-xl border border-border bg-card px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{message.authorName || "—"}</span>
                  <time className="shrink-0 text-[10px] text-muted-foreground">{formatDateTime(message.createdAt)}</time>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground">{message.text}</p>
                {message.references.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {message.references.map((reference) => (
                      <button
                        key={reference.id}
                        type="button"
                        onClick={() => onReferenceClick?.(reference)}
                        className={cn(
                          "inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold",
                          reference.isAvailable
                            ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                            : "border-border bg-muted text-muted-foreground",
                        )}
                        title={reference.unavailableReason ?? undefined}
                      >
                        <Link2 className="size-3 shrink-0" />
                        <span className="truncate">{referenceLabel(reference)}</span>
                        {!reference.isAvailable ? " · không khả dụng" : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            </div>
          ))
        )}
      </div>

      {hasUnreadLocal && !isAtBottom ? (
        <Button
          type="button"
          size="sm"
          onClick={() => {
            scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
          }}
          className="mx-3 mb-2 h-8 rounded-lg text-xs"
        >
          <ArrowDown className="mr-1.5 size-3.5" /> Tin mới
        </Button>
      ) : null}

      <footer className="border-t border-border bg-card p-3">
        {displayedReferences.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {displayedReferences.map((reference) => (
              <Badge key={reference.id} variant="outline" className="max-w-full gap-1 rounded-md text-[10px]">
                <Link2 className="size-3" />
                <span className="truncate">{referenceLabel(reference)}</span>
              </Badge>
            ))}
          </div>
        ) : null}
        {!canDiscuss ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="size-3.5" /> Bạn chỉ có quyền xem trao đổi trong ngữ cảnh này.
          </p>
        ) : (
          <div className="flex gap-2">
            <Textarea
              rows={2}
              value={composerText}
              onChange={(event) => {
                setFailedDraft(null);
                setText(event.target.value);
              }}
              placeholder="Viết trao đổi… (Enter gửi, Shift+Enter xuống dòng)"
              disabled={isSending}
              className="min-h-[68px] flex-1 rounded-xl border-input bg-background text-sm"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <Button
              type="button"
              onClick={() => void sendMessage()}
              disabled={isSending || !composerText.trim()}
              className="h-10 w-10 shrink-0 rounded-xl p-0"
              aria-label={failedDraft ? "Thử gửi lại" : "Gửi trao đổi"}
            >
              {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        )}
        {failedDraft ? (
          <p className="mt-2 text-[11px] font-medium text-primary">
            Gửi thất bại. Bấm gửi lại để dùng cùng mã tin nhắn và tránh tạo trùng.
          </p>
        ) : null}
      </footer>
    </section>
  );
}
