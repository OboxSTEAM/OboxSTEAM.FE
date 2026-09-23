"use client";

import { useMemo, useState } from "react";
import { MessageSquare, MessagesSquare } from "lucide-react";

import { AdvisoryDiscussionPanel } from "@/components/advisory/advisory-discussion-panel";
import { AdvisoryThreadList } from "@/components/advisory/advisory-thread-list";
import { AdvisoryThreadPanel } from "@/components/advisory/advisory-thread-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getAdvisoryThread,
  getAdvisoryThreads,
  type AdvisoryCapabilities,
  type AdvisoryReference,
} from "@/lib/api";
import { selectVisibleAdvisoryThreads } from "@/lib/advisory/visible-threads";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

type CollaborationTab = "notes" | "discussion";

type AdvisoryCollaborationPanelProps = {
  programId: string;
  submissionId?: string | null;
  capabilities?: AdvisoryCapabilities;
  reviewActionsLocked?: boolean;
  initialThreadId?: string | null;
  pendingReference?: AdvisoryReference | null;
  onReferenceClick?: (reference: AdvisoryReference) => void;
  onReferenceConsumed?: () => void;
  className?: string;
};

export function AdvisoryCollaborationPanel({
  programId,
  submissionId = null,
  capabilities,
  reviewActionsLocked = false,
  initialThreadId = null,
  pendingReference = null,
  onReferenceClick,
  onReferenceConsumed,
  className,
}: AdvisoryCollaborationPanelProps) {
  const [tab, setTab] = useState<CollaborationTab>("notes");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(initialThreadId);

  const { data, isLoading, retry } = useClientFetch({
    fetcher: () => getAdvisoryThreads(programId),
    deps: [programId, submissionId],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.threads"),
  });

  const threads = useMemo(
    () => selectVisibleAdvisoryThreads(data?.data ?? [], submissionId),
    [data?.data, submissionId],
  );
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? null;
  const hasOutstanding = threads.some(
    (thread) => thread.type === "RequiredChange" && thread.status !== "Resolved",
  );

  const { data: selectedThreadData } = useClientFetch({
    enabled: selectedThreadId != null && selectedThread == null,
    fetcher: () =>
      selectedThreadId
        ? getAdvisoryThread(programId, selectedThreadId)
        : Promise.resolve(null),
    deps: [programId, selectedThreadId, selectedThread != null],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.threads"),
  });

  const effectiveThread = selectedThreadData?.data ?? selectedThread;

  const noteBadge = useMemo(() => {
    const count = threads.filter((thread) => thread.status === "Open").length;
    return count > 0 ? <Badge className="ml-1 rounded-full px-1.5 text-[10px]">{count}</Badge> : null;
  }, [threads]);

  return (
    <section className={cn("flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <header className="border-b border-border px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessagesSquare className="size-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Cộng tác</p>
            {hasOutstanding ? <span className="size-2 rounded-full bg-primary" aria-label="Có yêu cầu cần xử lý" /> : null}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => retry()} className="h-7 rounded-lg px-2 text-[11px]">
            Làm mới
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Kênh cộng tác">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "notes"}
            onClick={() => setTab("notes")}
            className={cn("flex h-8 items-center justify-center gap-1 rounded-md text-xs font-semibold", tab === "notes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
          >
            <MessageSquare className="size-3.5" />
            Góp ý {noteBadge}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "discussion"}
            onClick={() => setTab("discussion")}
            className={cn("flex h-8 items-center justify-center gap-1 rounded-md text-xs font-semibold", tab === "discussion" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
          >
            Trao đổi
          </button>
        </div>
      </header>

      {tab === "discussion" ? (
        <AdvisoryDiscussionPanel
          programId={programId}
          capabilities={capabilities}
          pendingReference={pendingReference}
          onReferenceClick={onReferenceClick}
          onReferenceConsumed={onReferenceConsumed}
          className="min-h-0 flex-1 rounded-none border-0"
        />
      ) : (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-h-0 overflow-y-auto border-b border-border lg:border-b-0 lg:border-r">
            <AdvisoryThreadList
              threads={threads}
              selectedThreadId={selectedThreadId}
              onSelect={setSelectedThreadId}
              isLoading={isLoading}
              emptyMessage="Chưa có yêu cầu hoặc góp ý cần xử lý."
            />
          </div>
          <div className="min-h-0 overflow-hidden">
            <AdvisoryThreadPanel
              programId={programId}
              thread={effectiveThread}
              isAdvisor={capabilities?.canCreateSuggestion === true}
              isManager={capabilities?.canEditCurriculum === true}
              reviewActionsLocked={reviewActionsLocked}
              canReplyToNotes={capabilities?.canReplyToNotes !== false}
              verificationSubmissionId={submissionId}
              onThreadUpdated={retry}
            />
          </div>
        </div>
      )}
    </section>
  );
}
