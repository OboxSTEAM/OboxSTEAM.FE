"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Minus, Sparkles, X } from "lucide-react";

import { AdvisoryCollaborationPanel } from "@/components/advisory/advisory-collaboration-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getProgramAdvisoryWorkspace,
  type ProgramAdvisoryWorkspace,
  type ProgramWithModules,
} from "@/lib/api";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

type ManagerAdvisoryPanelProps = {
  program: ProgramWithModules;
  submissionId?: string | null;
  workspace?: ProgramAdvisoryWorkspace | null;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Launcher lives in the advisory status bar instead of the viewport corner. */
  hideLauncher?: boolean;
};

export function ManagerAdvisoryPanel({
  program,
  submissionId = null,
  workspace: providedWorkspace,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onOpenChange,
  hideLauncher = false,
}: ManagerAdvisoryPanelProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setOpen = useCallback(
    (open: boolean) => {
      if (!isControlled) {
        setInternalIsOpen(open);
      }
      onOpenChange?.(open);
    },
    [isControlled, onOpenChange],
  );

  const { data } = useClientFetch({
    enabled: providedWorkspace === undefined,
    fetcher: () => getProgramAdvisoryWorkspace(program.id),
    deps: [program.id, providedWorkspace],
    onError: (error) => showAppErrorFromUnknown(error, "expert.advisory.workspace"),
  });

  const workspace = providedWorkspace ?? data?.data ?? null;
  const activeSubmissionId =
    submissionId ?? workspace?.pendingSubmission?.id ?? workspace?.latestSubmission?.id;

  const unreadTotal =
    (workspace?.unreadDiscussionCount ?? 0) + (workspace?.unreadNoteCount ?? 0);
  const outstandingCount =
    workspace?.approvalBlockingCount ??
    workspace?.workflow?.outstandingRequirementCount ??
    0;

  // Close floating window on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  const advisorDisplayName =
    program.advisorExpertName ||
    workspace?.participants?.find((p) => p.role === "Advisor")?.displayName ||
    "Chuyên gia phụ trách";

  return (
    <>
      {/* Floating Messenger Window */}
      {isOpen ? (
        <div
          role="dialog"
          aria-label="Cửa sổ trao đổi với chuyên gia"
          className="fixed bottom-6 right-6 z-50 flex h-[min(680px,calc(100vh-5rem))] w-[min(760px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_rgba(0,0,0,0.22)] animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Messenger Window Header */}
          <header className="flex items-center justify-between border-b border-border bg-muted/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="size-4" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-heading text-xs font-bold text-foreground">
                  Cộng tác advisory
                </h3>
                <p className="truncate text-[11px] text-muted-foreground">
                  {advisorDisplayName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {outstandingCount > 0 ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-500/30 bg-amber-500/10 px-2 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
                >
                  {outstandingCount} yêu cầu
                </Badge>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="size-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Thu nhỏ cửa sổ trao đổi"
                title="Thu nhỏ"
              >
                <Minus className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="size-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Đóng cửa sổ trao đổi"
                title="Đóng"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </header>

          {/* Messenger Window Body */}
          <div className="flex-1 overflow-hidden">
            <AdvisoryCollaborationPanel
              programId={program.id}
              submissionId={activeSubmissionId}
              capabilities={workspace?.capabilities}
              reviewActionsLocked={workspace?.reviewActionsLocked}
              className="h-full min-h-0 rounded-none border-0"
            />
          </div>
        </div>
      ) : null}

      {/* Floating Messenger Launcher Pill */}
      {!hideLauncher && !isOpen ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-label="Mở trao đổi với chuyên gia"
          className={cn(
            "fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.14)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_12px_36px_rgba(0,0,0,0.18)] active:scale-[0.98]",
            unreadTotal > 0 && "ring-2 ring-primary/20",
          )}
        >
          <span className="relative flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="size-3.5" />
            {unreadTotal > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex size-2.5 items-center justify-center">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
            ) : null}
          </span>
          <span className="font-heading text-xs font-bold text-foreground">
            Cộng tác Advisory
          </span>
          {outstandingCount > 0 ? (
            <Badge className="rounded-full bg-amber-600 px-1.5 py-0 text-[10px] font-bold text-white">
              {outstandingCount}
            </Badge>
          ) : unreadTotal > 0 ? (
            <Badge className="rounded-full bg-primary px-1.5 py-0 text-[10px] font-bold text-primary-foreground">
              {unreadTotal}
            </Badge>
          ) : (
            <Sparkles className="size-3 text-muted-foreground" />
          )}
        </button>
      ) : null}
    </>
  );
}

export function AdvisoryCollaborateButton({
  outstandingCount,
  unreadTotal,
  expanded,
  onClick,
}: {
  outstandingCount: number;
  unreadTotal: number;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={expanded ? "Đóng trao đổi với chuyên gia" : "Mở trao đổi với chuyên gia"}
      className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground"
    >
      <MessageSquare className="size-3.5 text-primary" />
      Cộng tác Advisory
      {outstandingCount > 0 ? (
        <Badge className="rounded-full bg-amber-600 px-1.5 py-0 text-[10px] font-bold text-white">
          {outstandingCount}
        </Badge>
      ) : unreadTotal > 0 ? (
        <Badge className="rounded-full bg-primary px-1.5 py-0 text-[10px] font-bold text-primary-foreground">
          {unreadTotal}
        </Badge>
      ) : null}
    </button>
  );
}
