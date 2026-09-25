"use client";

import { useState } from "react";

import { AdvisoryThreadPanel } from "@/components/advisory/advisory-thread-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdvisoryCapabilities, AdvisoryThread } from "@/lib/api";
import { getAdvisoryFieldDefinition } from "@/lib/advisory/field-registry";
import { threadMatchesSelection, type SelectedNode } from "@/lib/advisory/manager-target";
import {
  ADVISORY_THREAD_ACTION_LABELS,
  ADVISORY_THREAD_TYPE_LABELS,
  getThreadStatusLabel,
} from "@/lib/expert/advisory-labels";
import { performAdvisoryThreadAction } from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";

type NodeFeedbackStripProps = {
  programId: string;
  selection: SelectedNode;
  threads: AdvisoryThread[];
  capabilities?: AdvisoryCapabilities;
  readOnly?: boolean;
  onChanged?: () => void;
};

export function NodeFeedbackStrip({
  programId,
  selection,
  threads,
  capabilities,
  readOnly = false,
  onChanged,
}: NodeFeedbackStripProps) {
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const visible = threads.filter((thread) => threadMatchesSelection(thread, selection));
  if (visible.length === 0) return null;

  async function runAction(thread: AdvisoryThread) {
    const action = thread.availableActions[0];
    if (!action || readOnly) return;
    setBusyId(thread.id);
    try {
      await performAdvisoryThreadAction(programId, thread.id, {
        action,
        concurrencyVersion: thread.concurrencyVersion,
        clientOperationId: crypto.randomUUID(),
      });
      onChanged?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "programs.advisory");
    } finally {
      setBusyId(null);
    }
  }

  function focusField(fieldKey: string) {
    const node = document.querySelector(`[data-advisory-field="${fieldKey}"]`);
    if (!(node instanceof HTMLElement)) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.classList.add("ring-2", "ring-primary");
    window.setTimeout(() => node.classList.remove("ring-2", "ring-primary"), 1600);
  }

  return (
    <section className="space-y-2 border-b border-border px-4 py-3">
      {readOnly ? (
        <p className="text-xs text-muted-foreground">Đang chờ chuyên gia thẩm định.</p>
      ) : null}
      {visible.map((thread) => {
        const field = thread.anchorField
          ? getAdvisoryFieldDefinition(thread.targetType, thread.anchorField)
          : null;
        const action = readOnly ? null : thread.availableActions[0];
        return (
          <article key={thread.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-md text-[10px]">
                {ADVISORY_THREAD_TYPE_LABELS[thread.type]}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {thread.targetExists
                  ? getThreadStatusLabel(thread.type, thread.status)
                  : "Mục đã bị xóa"}
              </span>
            </div>
            <p className="mt-2 text-sm text-foreground">
              {thread.latestMessagePreview || "Chưa có nội dung."}
            </p>
            {field ? (
              <button
                type="button"
                className="mt-1 text-xs font-medium text-primary hover:underline"
                onClick={() => focusField(field.fieldKey)}
              >
                Trường: {field.label}
              </button>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {action ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  disabled={busyId === thread.id}
                  onClick={() => void runAction(thread)}
                >
                  {ADVISORY_THREAD_ACTION_LABELS[action]}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs"
                onClick={() =>
                  setOpenThreadId((current) => (current === thread.id ? null : thread.id))
                }
              >
                Trả lời
              </Button>
            </div>
            {openThreadId === thread.id ? (
              <div className="mt-3 max-h-80 overflow-hidden rounded-lg border border-border">
                <AdvisoryThreadPanel
                  programId={programId}
                  thread={thread}
                  isAdvisor={false}
                  isManager
                  compact
                  canReply={capabilities?.canReply !== false && !readOnly}
                  reviewActionsLocked={readOnly}
                  onThreadUpdated={onChanged}
                />
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
