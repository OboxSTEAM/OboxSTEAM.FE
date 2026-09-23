"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleSlash2, Loader2, RotateCcw, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  addAdvisoryMessage,
  getAdvisoryMessages,
  getAdvisoryThread,
  recordAdvisoryThreadRead,
  updateAdvisoryThreadStatus,
  type AdvisoryThread,
  type AdvisoryThreadStatus,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  ADVISORY_THREAD_STATUS_LABELS,
  ADVISORY_THREAD_TYPE_LABELS,
  ADVISORY_TARGET_TYPE_LABELS,
} from "@/lib/expert/advisory-labels";
import { cn } from "@/lib/utils";

type AdvisoryThreadPanelProps = {
  programId: string;
  thread: AdvisoryThread | null;
  isAdvisor: boolean;
  isManager: boolean;
  reviewActionsLocked?: boolean;
  canReplyToNotes?: boolean;
  /** Pending review round. Carried threads still store the earlier submission id. */
  verificationSubmissionId?: string | null;
  onThreadUpdated?: () => void;
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

export function AdvisoryThreadPanel({
  programId,
  thread,
  reviewActionsLocked = false,
  canReplyToNotes = true,
  verificationSubmissionId = null,
  onThreadUpdated,
}: AdvisoryThreadPanelProps) {
  const { profile } = useCurrentUser();
  const currentUserId = profile?.id ?? null;
  const [replyDraft, setReplyDraft] = useState<{
    threadId: string | null;
    text: string;
  }>({ threadId: null, text: "" });
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const { data, isLoading, mutate } = useClientFetch({
    enabled: thread != null,
    fetcher: () =>
      thread ? getAdvisoryMessages(programId, thread.id) : Promise.resolve(null),
    deps: [programId, thread?.id],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.threads"),
  });

  const { data: detailData, retry: retryDetail } = useClientFetch({
    enabled: thread != null,
    fetcher: () =>
      thread ? getAdvisoryThread(programId, thread.id) : Promise.resolve(null),
    deps: [programId, thread?.id],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.threads"),
  });

  const messages = data?.data ?? [];
  const activeThread = detailData?.data ?? thread;
  const showMessageSkeleton = isLoading && messages.length === 0;
  const reply = replyDraft.threadId === (activeThread?.id ?? null) ? replyDraft.text : "";

  useEffect(() => {
    if (!activeThread || activeThread.latestActivitySequence <= 0) return;
    void recordAdvisoryThreadRead(programId, activeThread.id, {
      lastDisplayedSequence: activeThread.latestActivitySequence,
      cursor: String(activeThread.latestActivitySequence),
    }).catch(() => undefined);
  }, [activeThread, programId]);

  function setReply(text: string) {
    setReplyDraft({ threadId: activeThread?.id ?? null, text });
  }

  async function handleSendReply() {
    if (!activeThread || !canReplyToNotes) return;
    const trimmed = reply.trim();
    if (!trimmed) return;

    setIsSending(true);
    try {
      const result = await addAdvisoryMessage(programId, activeThread.id, {
        message: trimmed,
        concurrencyVersion: activeThread.concurrencyVersion,
      });
      if (!result?.data) return;
      const created = result.data;
      setReply("");
      if (created) {
        mutate((prev) => {
          if (!prev) return { ...result, data: [created] };
          const existing = prev.data ?? [];
          if (existing.some((msg) => msg.id === created.id)) return prev;
          return { ...prev, data: [...existing, created] };
        });
      }
      retryDetail();
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.advisory");
    } finally {
      setIsSending(false);
    }
  }

  async function handleStatusChange(
    status: AdvisoryThreadStatus,
    resolutionKind?: "Verified" | "Waived",
  ) {
    if (!activeThread) return;
    setIsUpdatingStatus(true);
    try {
      await updateAdvisoryThreadStatus(programId, activeThread.id, {
        status,
        message: actionMessage.trim() || null,
        concurrencyVersion: activeThread.concurrencyVersion,
        resolutionKind: status === "Resolved" ? resolutionKind ?? null : null,
        verifiedAgainstSubmissionId:
          status === "Resolved"
            ? verificationSubmissionId || activeThread.submissionId
            : null,
        clientOperationId: crypto.randomUUID(),
      });
      showAppSuccess({
        title: "Đã cập nhật trạng thái",
        description: ADVISORY_THREAD_STATUS_LABELS[status],
      });
      setActionMessage("");
      retryDetail();
      onThreadUpdated?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.advisory");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  if (!activeThread) {
    return (
      <p className="px-4 py-16 text-center text-sm text-muted-foreground">
        Chọn một luồng trao đổi để xem chi tiết.
      </p>
    );
  }

  const canAddress = activeThread.canAddress && !reviewActionsLocked;
  const canResolve = activeThread.canResolve && !reviewActionsLocked;
  const canReopen = activeThread.canReopen && !reviewActionsLocked;
  const canWaive = activeThread.canWaive && !reviewActionsLocked;
  const showActionForm = canAddress || canResolve || canReopen || canWaive;

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              activeThread.type === "RequiredChange"
                ? "rounded-md bg-primary/10 text-[11px] font-semibold text-primary"
                : "rounded-md bg-muted text-[11px] font-medium text-foreground"
            }
          >
            {ADVISORY_THREAD_TYPE_LABELS[activeThread.type]}
          </Badge>
          <Badge variant="outline" className="rounded-md text-[11px]">
            {ADVISORY_THREAD_STATUS_LABELS[activeThread.status]}
          </Badge>
        </div>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {activeThread.targetLabel || ADVISORY_TARGET_TYPE_LABELS[activeThread.targetType]}
        </p>
        {activeThread.targetContext ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{activeThread.targetContext}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {canAddress ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUpdatingStatus}
              onClick={() => void handleStatusChange("Addressed")}
              className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
            >
              <CheckCircle2 className="size-3.5" />
              Đánh dấu đã xử lý
            </Button>
          ) : null}
          {canResolve ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUpdatingStatus}
              onClick={() => void handleStatusChange("Resolved", "Verified")}
              className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
            >
              <CheckCircle2 className="size-3.5" />
              Xác minh
            </Button>
          ) : null}
          {canWaive ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUpdatingStatus}
              onClick={() => void handleStatusChange("Resolved", "Waived")}
              className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
            >
              <CircleSlash2 className="size-3.5" />
              Miễn trừ
            </Button>
          ) : null}
          {canReopen ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUpdatingStatus}
              onClick={() => void handleStatusChange("Open")}
              className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
            >
              <RotateCcw className="size-3.5" />
              Mở lại
            </Button>
          ) : null}
          {showActionForm ? (
            <Textarea
              rows={2}
              value={actionMessage}
              onChange={(event) => setActionMessage(event.target.value)}
              placeholder="Ghi chú xử lý hoặc lý do miễn trừ (không bắt buộc)…"
              disabled={isUpdatingStatus}
              className="basis-full min-h-[56px] rounded-lg border-input bg-background text-xs"
            />
          ) : null}
          {reviewActionsLocked ? (
            <p className="basis-full text-[11px] text-muted-foreground">
              Thao tác review đang bị khóa; Discussion vẫn khả dụng.
            </p>
          ) : null}
        </div>
      </header>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {showMessageSkeleton ? (
          <>
            <Skeleton className="ml-auto h-12 w-2/3 rounded-2xl" />
            <Skeleton className="mr-auto h-12 w-1/2 rounded-2xl" />
          </>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Chưa có tin nhắn.</p>
        ) : (
          messages.map((msg) => {
            const isOwn =
              currentUserId != null && msg.authorUserId === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn("flex", isOwn ? "justify-end" : "justify-start")}
              >
                <article
                  className={cn(
                    "w-fit max-w-[min(85%,22rem)] rounded-2xl px-3 py-2",
                    isOwn
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border bg-muted/50 text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-baseline gap-2",
                      isOwn ? "justify-end" : "justify-start",
                    )}
                  >
                    {!isOwn ? (
                      <span className="text-[11px] font-semibold text-foreground">
                        {msg.authorName || "—"}
                      </span>
                    ) : null}
                    <time
                      className={cn(
                        "shrink-0 text-[10px]",
                        isOwn
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatDateTime(msg.createdAt)}
                    </time>
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 whitespace-pre-line text-sm leading-snug",
                      isOwn ? "text-primary-foreground" : "text-foreground",
                    )}
                  >
                    {msg.message}
                  </p>
                </article>
              </div>
            );
          })
        )}
        {activeThread.events
          .filter((event) => event.eventType !== "MessageAdded")
          .map((event) => (
            <article
              key={event.id}
              className="mx-auto w-fit max-w-[90%] rounded-lg border border-dashed border-border bg-muted/30 px-3 py-1.5 text-center text-[11px] text-muted-foreground"
            >
              <span className="font-semibold text-foreground">Hoạt động</span>
              <span className="mx-1">·</span>
              {event.message || event.eventType}
            </article>
          ))}
      </div>

      <footer className="border-t border-border p-4">
        {!canReplyToNotes ? (
          <p className="text-xs text-muted-foreground">Bạn chỉ có quyền xem ghi chú trong ngữ cảnh này.</p>
        ) : (
          <div className="flex gap-2">
            <Textarea
              rows={2}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Viết phản hồi… (Enter gửi, Shift+Enter xuống dòng)"
              disabled={isSending}
              className="min-h-[72px] flex-1 rounded-xl border-input bg-background text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendReply();
                }
              }}
            />
            <Button
              type="button"
              onClick={() => void handleSendReply()}
              disabled={isSending || !reply.trim()}
              aria-label="Gửi phản hồi"
              className="h-10 w-10 shrink-0 rounded-xl p-0"
            >
              {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
}
