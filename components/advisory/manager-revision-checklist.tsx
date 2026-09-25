"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { AdvisoryThread } from "@/lib/api";
import { selToQuery, threadToSelection } from "@/lib/advisory/manager-target";
import { getThreadStatusLabel } from "@/lib/expert/advisory-labels";

type ManagerRevisionChecklistProps = {
  threads: AdvisoryThread[];
  fixedRequiredCount: number;
  outstandingRequiredCount: number;
  canResubmit: boolean;
  onResubmit?: () => void;
};

export function ManagerRevisionChecklist({
  threads,
  fixedRequiredCount,
  outstandingRequiredCount,
  canResubmit,
  onResubmit,
}: ManagerRevisionChecklistProps) {
  const router = useRouter();
  const required = threads.filter((thread) => thread.type === "RequiredChange");
  const suggestions = threads.filter(
    (thread) => thread.type === "Suggestion" && thread.status !== "Resolved",
  );
  if (required.length === 0 && suggestions.length === 0) return null;
  const done = fixedRequiredCount;
  const total = outstandingRequiredCount;

  function openThread(thread: AdvisoryThread) {
    const query = selToQuery(threadToSelection(thread));
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Việc cần xử lý</p>
          <p className="text-xs text-muted-foreground">
            {total > 0 ? `${done}/${total} đã sửa` : "Không còn mục bắt buộc"}
          </p>
        </div>
        {onResubmit ? (
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-lg text-xs font-semibold"
            disabled={!canResubmit}
            onClick={onResubmit}
          >
            Gửi lại thẩm định
          </Button>
        ) : null}
      </div>
      <ul className="mt-3 space-y-1">
        {required.map((thread) => (
          <li key={thread.id}>
            <button
              type="button"
              onClick={() => openThread(thread)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted/60"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-foreground">
                  {thread.targetContext || thread.targetLabel || "Chương trình"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {thread.latestMessagePreview}
                </span>
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {getThreadStatusLabel(thread.type, thread.status)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {suggestions.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            Gợi ý ({suggestions.length})
          </summary>
          <ul className="mt-1 space-y-1">
            {suggestions.map((thread) => (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => openThread(thread)}
                  className="w-full truncate rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted/60"
                >
                  {thread.targetLabel || thread.latestMessagePreview}
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
