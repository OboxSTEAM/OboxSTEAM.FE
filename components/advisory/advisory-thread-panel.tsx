"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  addAdvisoryMessage,
  getAdvisoryMessages,
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

type AdvisoryThreadPanelProps = {
  programId: string;
  thread: AdvisoryThread | null;
  isAdvisor: boolean;
  isManager: boolean;
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
  isAdvisor,
  isManager,
  onThreadUpdated,
}: AdvisoryThreadPanelProps) {
  const [replyDraft, setReplyDraft] = useState<{
    threadId: string | null;
    text: string;
  }>({ threadId: null, text: "" });
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data, isLoading, retry } = useClientFetch({
    enabled: thread != null,
    fetcher: () =>
      thread ? getAdvisoryMessages(programId, thread.id) : Promise.resolve(null),
    deps: [programId, thread?.id],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.threads"),
  });

  const messages = data?.data ?? [];
  const reply =
    replyDraft.threadId === (thread?.id ?? null) ? replyDraft.text : "";

  function setReply(text: string) {
    setReplyDraft({ threadId: thread?.id ?? null, text });
  }

  async function handleSendReply() {
    if (!thread) return;
    const trimmed = reply.trim();
    if (!trimmed) return;

    setIsSending(true);
    try {
      await addAdvisoryMessage(programId, thread.id, { message: trimmed });
      setReply("");
      retry();
      onThreadUpdated?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.advisory");
    } finally {
      setIsSending(false);
    }
  }

  async function handleStatusChange(status: AdvisoryThreadStatus) {
    if (!thread) return;
    setIsUpdatingStatus(true);
    try {
      await updateAdvisoryThreadStatus(programId, thread.id, { status });
      showAppSuccess({
        title: "Đã cập nhật trạng thái",
        description: ADVISORY_THREAD_STATUS_LABELS[status],
      });
      onThreadUpdated?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.advisory");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  if (!thread) {
    return (
      <p className="px-4 py-16 text-center text-sm text-muted-foreground">
        Chọn một luồng trao đổi để xem chi tiết.
      </p>
    );
  }

  const canAddress =
    isManager &&
    thread.type === "RequiredChange" &&
    thread.status === "Open";
  const canResolve =
    isAdvisor && thread.status !== "Resolved";
  const canReopen =
    isAdvisor && thread.status === "Resolved";

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              thread.type === "RequiredChange"
                ? "rounded-md bg-primary/10 text-[11px] font-semibold text-primary"
                : "rounded-md bg-muted text-[11px] font-medium text-foreground"
            }
          >
            {ADVISORY_THREAD_TYPE_LABELS[thread.type]}
          </Badge>
          <Badge variant="outline" className="rounded-md text-[11px]">
            {ADVISORY_THREAD_STATUS_LABELS[thread.status]}
          </Badge>
        </div>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {thread.targetLabel || ADVISORY_TARGET_TYPE_LABELS[thread.targetType]}
        </p>
        {thread.targetContext ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{thread.targetContext}</p>
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
          {canResolve && thread.status !== "Resolved" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUpdatingStatus}
              onClick={() => void handleStatusChange("Resolved")}
              className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
            >
              <CheckCircle2 className="size-3.5" />
              Đóng luồng
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
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Chưa có tin nhắn.</p>
        ) : (
          messages.map((msg) => (
            <article
              key={msg.id}
              className="rounded-xl border border-border bg-background/60 px-3 py-2.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {msg.authorName || "—"}
                </span>
                <time className="shrink-0 text-[10px] text-muted-foreground">
                  {formatDateTime(msg.createdAt)}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground">
                {msg.message}
              </p>
            </article>
          ))
        )}
      </div>

      <footer className="border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            rows={2}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Viết phản hồi…"
            disabled={isSending}
            className="min-h-[72px] flex-1 rounded-xl border-input bg-background text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
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
            <Send className="size-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
