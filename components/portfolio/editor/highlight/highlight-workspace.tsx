"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Check,
  Clapperboard,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Scissors,
  Square,
  Trash2,
} from "lucide-react";
import { useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MediaLightbox } from "@/components/media/media-lightbox";
import { VideoThumb } from "@/components/media/video-thumb";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useHighlightItemProgressPolling } from "@/hooks/use-highlight-stack-polling";
import {
  addHighlightSegment,
  cancelHighlightVideoItem,
  createHighlightStack,
  deleteHighlightStack,
  deleteHighlightVideoItem,
  getHighlightSourceMedia,
  getHighlightStackById,
  getHighlightStacks,
  getMyGallery,
  regenerateHighlightStack,
  retryHighlightVideoItem,
  syncPortfolioItems,
  trimHighlightVideo,
  type HighlightSourceMedia,
  type HighlightVideoItem,
  type HighlightVideoProgress,
  type HighlightVideoStack,
  type Portfolio,
  type PortfolioItem,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  formatHighlightTime,
  msToSeconds,
  parseHighlightTime,
  toHighlightApiTime,
} from "@/lib/portfolio/highlight-time";
import { cn } from "@/lib/utils";

/** Flow A — show / create at most 3 stacks per class. */
const MAX_VISIBLE_STACKS = 3;

type HighlightWorkspaceProps = {
  onClose?: () => void;
  /** Prefer sync → HighlightReel; kept for backward compat if sync finds a reel. */
  onAttachedItem?: (item: PortfolioItem) => void;
  onSyncedPortfolio?: (portfolio: Portfolio) => void;
};

type ClassOption = {
  classId: string;
  label: string;
};

type EditorPanel = "none" | "trim" | "segment";

function sortByRequestedAtDesc(items: HighlightVideoItem[]): HighlightVideoItem[] {
  return [...items].sort((a, b) => {
    const aTime = a.requestedAt ?? "";
    const bTime = b.requestedAt ?? "";
    return bTime.localeCompare(aTime);
  });
}

function latestItem(stack: HighlightVideoStack | null): HighlightVideoItem | null {
  const items = stack?.items ?? [];
  if (items.length === 0) return null;
  return sortByRequestedAtDesc(items)[0] ?? null;
}

function latestCompleted(stack: HighlightVideoStack | null): HighlightVideoItem | null {
  const items = (stack?.items ?? []).filter(
    (item) => item.status === "Completed" && Boolean(item.videoUrl),
  );
  if (items.length === 0) return null;
  return sortByRequestedAtDesc(items)[0] ?? null;
}

function findProcessingItem(
  stack: HighlightVideoStack | null,
): HighlightVideoItem | null {
  return (stack?.items ?? []).find((item) => item.status === "Processing") ?? null;
}

function findRetryableItem(
  stack: HighlightVideoStack | null,
): HighlightVideoItem | null {
  const candidates = (stack?.items ?? []).filter(
    (item) =>
      item.generationKind === "Initial" &&
      (item.status === "Failed" || item.status === "Cancelled"),
  );
  return sortByRequestedAtDesc(candidates)[0] ?? null;
}

function statusTone(status: HighlightVideoItem["status"]): string {
  switch (status) {
    case "Completed":
      return "bg-[#7CB342]/15 text-[#3d6b14]";
    case "Processing":
      return "bg-[#4FC3F7]/15 text-[#0f7cad]";
    case "Failed":
      return "bg-destructive/10 text-destructive";
    case "Cancelled":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function ZoneLabel({
  children,
  meta,
}: {
  children: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
        {children}
      </p>
      {meta ? (
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {meta}
        </span>
      ) : null}
    </div>
  );
}

function ProgressPanel({
  progress,
  statusLabel,
  reduceMotion,
  onCancel,
  isCancelling,
}: {
  progress: HighlightVideoProgress | null;
  statusLabel?: string | null;
  reduceMotion: boolean;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  const phase = progress?.phase ?? "";
  const isEncoding =
    /encod/i.test(phase) ||
    (progress?.percentComplete != null && progress.percentComplete > 0);
  const percent =
    progress?.percentComplete == null
      ? null
      : Math.min(100, Math.max(0, progress.percentComplete));

  return (
    <div className="rounded-xl border border-[#4FC3F7]/35 bg-[#4FC3F7]/8 px-3 py-3">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#4FC3F7]/20 text-[#0f7cad]">
          <Loader2
            className={cn("size-4", !reduceMotion && "animate-spin")}
            strokeWidth={2.25}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {isEncoding ? "Đang encode…" : "Đang dựng clip…"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {progress?.statusLabel ??
              statusLabel ??
              (isEncoding
                ? "MediaConvert đang xuất video."
                : "BuildingClips — AI ghép đoạn theo điểm mạnh.")}
          </p>
          {isEncoding && percent != null ? (
            <Progress value={percent} className="mt-2 gap-1">
              <ProgressLabel className="text-[11px]">Encoding</ProgressLabel>
              <ProgressValue className="text-[11px]" />
            </Progress>
          ) : (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#4FC3F7]/25">
              <div
                className={cn(
                  "h-full w-2/5 rounded-full bg-[#4FC3F7]",
                  !reduceMotion && "animate-pulse",
                )}
              />
            </div>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0 rounded-lg"
          disabled={isCancelling}
          onClick={onCancel}
        >
          {isCancelling ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Square className="size-3.5" />
          )}
          Hủy
        </Button>
      </div>
    </div>
  );
}

function TerminalIssuePanel({
  item,
  onRetry,
  onDelete,
  canRetry,
  isMutating,
}: {
  item: HighlightVideoItem;
  onRetry: () => void;
  onDelete: () => void;
  canRetry: boolean;
  isMutating: boolean;
}) {
  const isFailed = item.status === "Failed";
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        isFailed
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-muted/40",
      )}
    >
      <p className="text-sm font-semibold text-foreground">
        {isFailed ? "Highlight thất bại" : "Job đã hủy"}
      </p>
      {item.failureReason ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{item.failureReason}</p>
      ) : (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {isFailed
            ? "Có thể thử lại item Initial, hoặc xóa để giải phóng slot."
            : "Cancelled vẫn chiếm slot — Retry hoặc Delete để tiếp tục."}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {canRetry ? (
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-lg"
            disabled={isMutating}
            onClick={onRetry}
          >
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-lg"
          disabled={isMutating}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
          Xóa item
        </Button>
      </div>
    </div>
  );
}

export function HighlightWorkspace({
  onClose,
  onAttachedItem,
  onSyncedPortfolio,
}: HighlightWorkspaceProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [classId, setClassId] = useState("");
  const [strengthDescription, setStrengthDescription] = useState("");
  const [activeStackId, setActiveStackId] = useState<string | null>(null);
  const [pollItemId, setPollItemId] = useState<string | null>(null);
  const [pollNonce, setPollNonce] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editorPanel, setEditorPanel] = useState<EditorPanel>("none");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [trimStart, setTrimStart] = useState("0:00");
  const [trimEnd, setTrimEnd] = useState("0:05");
  const [trimDescription, setTrimDescription] = useState("");

  const [segmentMediaId, setSegmentMediaId] = useState("");
  const [segmentStart, setSegmentStart] = useState("0:00");
  const [segmentEnd, setSegmentEnd] = useState("0:05");
  const [segmentDescription, setSegmentDescription] = useState("");

  const { data: classSeed, isLoading: isLoadingClasses } = useClientFetch({
    enabled: true,
    fetcher: async () => {
      const result = await getMyGallery({
        page: 1,
        pageSize: 100,
        isDescending: true,
      });
      return result?.data?.items ?? [];
    },
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "media.list"),
  });

  const classOptions = useMemo(() => {
    const map = new Map<string, ClassOption>();
    for (const item of classSeed ?? []) {
      if (!map.has(item.classId)) {
        map.set(item.classId, {
          classId: item.classId,
          label:
            [item.className, item.programName].filter(Boolean).join(" · ") ||
            "Lớp học",
        });
      }
    }
    return [...map.values()];
  }, [classSeed]);

  useEffect(() => {
    if (!classId && classOptions[0]) {
      setClassId(classOptions[0].classId);
    }
  }, [classId, classOptions]);

  const {
    data: stacks,
    isLoading: isLoadingStacks,
    retry: refreshStacks,
    mutate: mutateStacks,
  } = useClientFetch({
    enabled: Boolean(classId),
    fetcher: async () => {
      if (!classId) return [];
      const result = await getHighlightStacks({ classId });
      return (result?.data ?? []).slice(0, MAX_VISIBLE_STACKS);
    },
    deps: [classId],
    onError: (error) => showAppErrorFromUnknown(error, "highlight.load"),
  });

  const {
    progress,
    stack: polledStack,
    isPolling,
    setStack: setPolledStack,
    setProgress,
  } = useHighlightItemProgressPolling({
    stackId: activeStackId,
    itemId: pollItemId,
    pollNonce,
    enabled: Boolean(activeStackId) && Boolean(pollItemId),
    onTerminal: ({ progress: terminal, stack }) => {
      mutateStacks((current) =>
        (current ?? []).map((item) => (item.id === stack.id ? stack : item)),
      );
      setPolledStack(stack);
      setPollItemId(null);
      if (terminal.status === "Completed") {
        showAppSuccess({ title: "Highlight đã sẵn sàng" });
      } else if (terminal.status === "Failed") {
        showAppErrorFromUnknown(
          new Error(terminal.failureReason ?? "Highlight xử lý thất bại."),
          "highlight.create",
        );
      }
    },
    onTimedOut: () => {
      setPollItemId(null);
      showAppErrorFromUnknown(
        new Error("Hết thời gian chờ highlight."),
        "highlight.progress",
      );
    },
  });

  const activeStack =
    polledStack ??
    (stacks ?? []).find((stack) => stack.id === activeStackId) ??
    null;

  const completedItem = latestCompleted(activeStack);
  const currentItem = latestItem(activeStack);
  const processingItem = findProcessingItem(activeStack);
  const retryableItem = findRetryableItem(activeStack);
  const durationSeconds = msToSeconds(completedItem?.durationMs);

  const showProcessing =
    isPolling ||
    activeStack?.hasProcessingItem ||
    processingItem != null ||
    currentItem?.status === "Processing";

  const terminalIssueItem =
    !showProcessing &&
    (retryableItem ??
      ((currentItem?.status === "Failed" || currentItem?.status === "Cancelled")
        ? currentItem
        : null));

  const canCreateStack = (stacks ?? []).length < MAX_VISIBLE_STACKS;
  const canCreateItem = Boolean(activeStack?.canCreateItem) && !showProcessing;

  const { data: sourceMedia, isLoading: isLoadingSourceMedia } = useClientFetch({
    enabled:
      Boolean(activeStackId) &&
      editorPanel === "segment" &&
      Boolean(completedItem),
    fetcher: async () => {
      if (!activeStackId) return [] as HighlightSourceMedia[];
      const result = await getHighlightSourceMedia(activeStackId);
      return result?.data ?? [];
    },
    deps: [activeStackId, editorPanel, completedItem?.id],
    onError: (error) => showAppErrorFromUnknown(error, "highlight.load"),
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPolling && !isCreating) {
        onClose?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, isPolling, isCreating]);

  /** Resume progress poll when selecting a stack that is already Processing. */
  useEffect(() => {
    if (!activeStack || pollItemId || isPolling) return;
    const processing = findProcessingItem(activeStack);
    if (processing) {
      setPollItemId(processing.id);
    }
  }, [activeStack, pollItemId, isPolling]);

  const selectClass = (nextClassId: string) => {
    if (nextClassId === classId) return;
    setClassId(nextClassId);
    setActiveStackId(null);
    setPolledStack(null);
    setPollItemId(null);
    setEditorPanel("none");
  };

  const beginPollForStack = (stack: HighlightVideoStack) => {
    setActiveStackId(stack.id);
    setPolledStack(stack);
    const processing = findProcessingItem(stack) ?? latestItem(stack);
    if (processing && processing.status === "Processing") {
      setPollItemId(processing.id);
      setPollNonce((value) => value + 1);
    } else {
      setPollItemId(null);
    }
  };

  const beginPollForItem = (
    stackId: string,
    item: HighlightVideoItem,
    stackHint?: HighlightVideoStack | null,
  ) => {
    setActiveStackId(stackId);
    if (stackHint) setPolledStack(stackHint);
    setPollItemId(item.id);
    setPollNonce((value) => value + 1);
    setProgress(null);
  };

  const handleCreate = async () => {
    if (!classId || !canCreateStack) return;
    setIsCreating(true);
    try {
      const result = await createHighlightStack({
        classId,
        strengthDescription: strengthDescription.trim() || null,
      });
      const stack = result?.data;
      if (!stack) throw new Error("Không nhận được highlight stack.");
      mutateStacks((current) =>
        [stack, ...(current ?? [])].slice(0, MAX_VISIBLE_STACKS),
      );
      beginPollForStack(stack);
      setEditorPanel("none");
      showAppSuccess({ title: "Đã bắt đầu tạo highlight" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.create");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!activeStackId || !canCreateItem) return;
    setIsMutating(true);
    try {
      const result = await regenerateHighlightStack(activeStackId);
      const stack = result?.data;
      if (!stack) throw new Error("Không nhận được stack sau regenerate.");
      mutateStacks((current) =>
        (current ?? []).map((item) => (item.id === stack.id ? stack : item)),
      );
      beginPollForStack(stack);
      showAppSuccess({ title: "Đã bắt đầu regenerate" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.regenerate");
    } finally {
      setIsMutating(false);
    }
  };

  const handleRetry = async () => {
    if (!activeStackId || !retryableItem) return;
    setIsMutating(true);
    try {
      const result = await retryHighlightVideoItem(
        activeStackId,
        retryableItem.id,
      );
      const item = result?.data;
      if (!item) throw new Error("Không nhận được item sau retry.");
      beginPollForItem(activeStackId, item, activeStack);
      showAppSuccess({ title: "Đã gửi retry" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.retry");
    } finally {
      setIsMutating(false);
    }
  };

  const handleCancel = async () => {
    if (!activeStackId || !pollItemId) return;
    setIsCancelling(true);
    try {
      await cancelHighlightVideoItem(activeStackId, pollItemId);
      setPollItemId(null);
      setProgress(null);
      const stackResult = await getHighlightStackById(activeStackId);
      const stack = stackResult?.data;
      if (stack) {
        setPolledStack(stack);
        mutateStacks((current) =>
          (current ?? []).map((item) => (item.id === stack.id ? stack : item)),
        );
      } else {
        refreshStacks();
      }
      showAppSuccess({
        title: "Đã hủy job",
        description:
          "Item Cancelled vẫn chiếm slot — Retry hoặc Delete để giải phóng.",
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.cancel");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleTrim = async () => {
    if (!activeStackId || !completedItem || !canCreateItem) return;
    const start = parseHighlightTime(trimStart);
    const end = parseHighlightTime(trimEnd);
    if (start == null || end == null || end <= start) {
      showAppErrorFromUnknown(
        new Error("Khoảng cắt không hợp lệ."),
        "highlight.trim",
      );
      return;
    }
    setIsMutating(true);
    try {
      const result = await trimHighlightVideo(activeStackId, completedItem.id, {
        trimDescription: trimDescription.trim() || null,
        excludeRanges: [
          {
            start: toHighlightApiTime(start),
            end: toHighlightApiTime(end),
          },
        ],
      });
      const item = result?.data;
      if (!item) throw new Error("Không nhận được item sau trim.");
      beginPollForItem(activeStackId, item, activeStack);
      setEditorPanel("none");
      showAppSuccess({ title: "Đã gửi yêu cầu cắt video" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.trim");
    } finally {
      setIsMutating(false);
    }
  };

  const handleAddSegment = async () => {
    if (!activeStackId || !completedItem || !segmentMediaId || !canCreateItem) {
      return;
    }
    const start = parseHighlightTime(segmentStart);
    const end = parseHighlightTime(segmentEnd);
    if (start == null || end == null || end <= start) {
      showAppErrorFromUnknown(
        new Error("Khoảng đoạn không hợp lệ."),
        "highlight.segment",
      );
      return;
    }
    setIsMutating(true);
    try {
      const result = await addHighlightSegment(
        activeStackId,
        completedItem.id,
        {
          mediaId: segmentMediaId,
          start: toHighlightApiTime(start),
          end: toHighlightApiTime(end),
          description: segmentDescription.trim() || null,
        },
      );
      const item = result?.data;
      if (!item) throw new Error("Không nhận được item sau add-segment.");
      beginPollForItem(activeStackId, item, activeStack);
      setEditorPanel("none");
      showAppSuccess({ title: "Đã gửi yêu cầu thêm đoạn" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.segment");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteItem = async (item: HighlightVideoItem) => {
    if (!activeStackId || item.status === "Processing") return;
    setIsMutating(true);
    try {
      await deleteHighlightVideoItem(activeStackId, item.id);
      setPollItemId(null);
      setPolledStack(null);
      refreshStacks();
      showAppSuccess({ title: "Đã xóa phiên bản highlight" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.delete");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteStack = async (stackId: string, stack: HighlightVideoStack) => {
    if (stack.hasProcessingItem) return;
    setIsMutating(true);
    try {
      await deleteHighlightStack(stackId);
      if (activeStackId === stackId) {
        setActiveStackId(null);
        setPolledStack(null);
        setPollItemId(null);
      }
      refreshStacks();
      showAppSuccess({ title: "Đã xóa highlight stack" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.delete");
    } finally {
      setIsMutating(false);
    }
  };

  const handleSyncPortfolio = async () => {
    if (!completedItem?.videoUrl) return;
    setIsSyncing(true);
    try {
      const result = await syncPortfolioItems();
      const portfolio = result?.data;
      if (!portfolio) throw new Error("Không nhận được portfolio sau sync.");
      onSyncedPortfolio?.(portfolio);
      const reels = (portfolio.items ?? []).filter(
        (item) => item.itemType === "HighlightReel",
      );
      const focus =
        reels.find((item) => item.mediaUrl === completedItem.videoUrl) ??
        [...reels].sort((a, b) => b.displayOrder - a.displayOrder)[0];
      if (focus) onAttachedItem?.(focus);
      showAppSuccess({
        title: "Đã đồng bộ HighlightReel",
        description: result.message || "Mở tab Mục để chỉnh tiếp.",
      });
      onClose?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.attach");
    } finally {
      setIsSyncing(false);
    }
  };

  const stackCount = (stacks ?? []).length;
  const activeTitle =
    activeStack?.strengthDescription?.trim() || "Highlight đang chọn";

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Chọn lớp, tạo stack điểm mạnh, rồi chỉnh / đồng bộ HighlightReel vào
        portfolio.
      </p>

      {/* Class picker — original */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Lớp học
        </p>
        {isLoadingClasses ? (
          <p className="text-xs text-muted-foreground">Đang tải lớp…</p>
        ) : classOptions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            Chưa có lớp trong gallery của bạn.
          </p>
        ) : (
          <ul className="space-y-1.5" role="listbox" aria-label="Chọn lớp học">
            {classOptions.map((option) => {
              const selected = option.classId === classId;
              return (
                <li key={option.classId} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => selectClass(option.classId)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
                      "outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
                      selected
                        ? "border-[#4FC3F7] bg-[#4FC3F7]/12 shadow-[0_0_0_1px_rgba(79,195,247,0.35)]"
                        : "border-border bg-card hover:border-[#4FC3F7]/45 hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-[#0f7cad] bg-[#0f7cad] text-white"
                          : "border-[#C9C9C2] bg-background",
                      )}
                      aria-hidden
                    >
                      {selected ? (
                        <Check className="size-2.5" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm leading-snug",
                          selected
                            ? "font-semibold text-[#0f7cad]"
                            : "font-medium text-foreground",
                        )}
                      >
                        {option.label}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Create — original */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="space-y-1">
          <Label htmlFor="strength-desc" className="text-[11px]">
            Điểm mạnh (tuỳ chọn)
          </Label>
          <Textarea
            id="strength-desc"
            value={strengthDescription}
            onChange={(event) => setStrengthDescription(event.target.value)}
            placeholder="VD: tự tin thuyết trình, khéo lắp robot…"
            className="min-h-16 resize-none rounded-lg text-sm"
            disabled={!classId}
          />
        </div>
        <Button
          type="button"
          className="h-9 w-full rounded-lg"
          disabled={!classId || !canCreateStack || isCreating || isPolling}
          onClick={() => void handleCreate()}
        >
          {isCreating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Clapperboard className="size-4" />
          )}
          Tạo stack
        </Button>
        {!canCreateStack && classId ? (
          <p className="text-[11px] text-muted-foreground">
            Tối đa {MAX_VISIBLE_STACKS} stack / lớp. Xóa stack cũ để tạo mới.
          </p>
        ) : null}
      </div>

      {/* Stack picker — redesigned */}
      <section className="space-y-2" aria-labelledby="highlight-zone-stacks">
        <ZoneLabel meta={`${stackCount}/${MAX_VISIBLE_STACKS}`}>
          <span id="highlight-zone-stacks">Stack</span>
        </ZoneLabel>
        {!classId ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            Chọn lớp ở trên để xem stack.
          </p>
        ) : isLoadingStacks ? (
          <p className="text-xs text-muted-foreground">Đang tải…</p>
        ) : stackCount === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            Chưa có highlight cho lớp này.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-border bg-card">
            {(stacks ?? []).map((stack, index) => {
              const selected = stack.id === activeStackId;
              const title =
                stack.strengthDescription?.trim() || `Stack ${index + 1}`;
              return (
                <li
                  key={stack.id}
                  className="flex items-stretch border-b border-border last:border-b-0"
                >
                  <button
                    type="button"
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2.5 text-left transition",
                      "outline-none focus-visible:bg-[#4FC3F7]/10",
                      selected ? "bg-[#FAFAF5]" : "hover:bg-muted/50",
                    )}
                    onClick={() => {
                      setActiveStackId(stack.id);
                      setPolledStack(stack);
                      setEditorPanel("none");
                      const processing = findProcessingItem(stack);
                      setPollItemId(processing?.id ?? null);
                      if (processing) setPollNonce((v) => v + 1);
                    }}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums",
                        selected
                          ? "bg-[#0f7cad] text-white"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-foreground">
                        {title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="tabular-nums">
                          {stack.itemCount}/{stack.maxItems} bản
                        </span>
                        {stack.hasProcessingItem ? (
                          <span className="inline-flex items-center gap-1 text-[#0f7cad]">
                            <span className="size-1.5 rounded-full bg-[#4FC3F7]" />
                            xử lý
                          </span>
                        ) : null}
                        {!stack.canCreateItem && !stack.hasProcessingItem ? (
                          <span>đầy</span>
                        ) : null}
                      </span>
                    </span>
                    {selected ? (
                      <Check
                        className="size-3.5 shrink-0 text-[#0f7cad]"
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="my-auto mr-1 shrink-0"
                    aria-label="Xóa stack"
                    disabled={isMutating || stack.hasProcessingItem}
                    onClick={() => void handleDeleteStack(stack.id, stack)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 4 — Stage: only when a stack is selected */}
      {activeStack ? (
        <section
          className="space-y-3 rounded-2xl border border-[#E5E5E0] bg-[#F5F5F0] p-3"
          aria-labelledby="highlight-zone-stage"
        >
          <div className="space-y-1">
            <ZoneLabel meta={`${activeStack.itemCount}/${activeStack.maxItems}`}>
              <span id="highlight-zone-stage">Chỉnh & đồng bộ</span>
            </ZoneLabel>
            <p className="line-clamp-2 text-xs font-medium text-foreground">
              {activeTitle}
            </p>
          </div>

          {showProcessing ? (
            <ProgressPanel
              progress={progress}
              statusLabel={
                processingItem?.statusLabel ?? currentItem?.statusLabel
              }
              reduceMotion={reduceMotion}
              onCancel={() => void handleCancel()}
              isCancelling={isCancelling}
            />
          ) : null}

          {terminalIssueItem ? (
            <TerminalIssuePanel
              item={terminalIssueItem}
              canRetry={
                terminalIssueItem.generationKind === "Initial" &&
                (terminalIssueItem.status === "Failed" ||
                  terminalIssueItem.status === "Cancelled")
              }
              isMutating={isMutating}
              onRetry={() => void handleRetry()}
              onDelete={() => void handleDeleteItem(terminalIssueItem)}
            />
          ) : null}

          {completedItem?.videoUrl ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl bg-[#2D2D2D] ring-1 ring-black/5">
                <VideoThumb
                  src={completedItem.videoUrl}
                  durationLabel={
                    durationSeconds > 0
                      ? formatHighlightTime(durationSeconds)
                      : null
                  }
                  className="w-full"
                  onClick={() => setIsPreviewOpen(true)}
                  aria-label="Xem highlight"
                />
              </div>
              <MediaLightbox
                items={[
                  {
                    id: completedItem.id,
                    url: completedItem.videoUrl,
                    kind: "video",
                    caption: completedItem.statusLabel,
                  },
                ]}
                index={isPreviewOpen ? 0 : null}
                open={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                enableNav={false}
              />

              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                    statusTone(completedItem.status),
                  )}
                >
                  {completedItem.generationKind}
                </span>
                {durationSeconds > 0 ? (
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {formatHighlightTime(durationSeconds)}
                  </span>
                ) : null}
              </div>

              {/* Edit tools — secondary, grouped */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Chỉnh sửa
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-lg bg-white"
                    disabled={!canCreateItem || isMutating}
                    onClick={() => void handleRegenerate()}
                  >
                    <RefreshCw className="size-3.5" />
                    Làm lại
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={editorPanel === "trim" ? "secondary" : "outline"}
                    className="h-9 rounded-lg bg-white"
                    disabled={!canCreateItem || isMutating}
                    onClick={() =>
                      setEditorPanel((panel) =>
                        panel === "trim" ? "none" : "trim",
                      )
                    }
                  >
                    <Scissors className="size-3.5" />
                    Cắt
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      editorPanel === "segment" ? "secondary" : "outline"
                    }
                    className="h-9 rounded-lg bg-white"
                    disabled={!canCreateItem || isMutating}
                    onClick={() =>
                      setEditorPanel((panel) =>
                        panel === "segment" ? "none" : "segment",
                      )
                    }
                  >
                    <Plus className="size-3.5" />
                    Đoạn
                  </Button>
                </div>
              </div>

              {editorPanel === "trim" ? (
                <div className="grid gap-2 rounded-xl bg-white p-2.5 ring-1 ring-border">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="trim-start" className="text-[11px]">
                        Loại bỏ từ
                      </Label>
                      <Input
                        id="trim-start"
                        value={trimStart}
                        onChange={(event) => setTrimStart(event.target.value)}
                        className="h-8 rounded-lg"
                        placeholder="0:00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="trim-end" className="text-[11px]">
                        đến
                      </Label>
                      <Input
                        id="trim-end"
                        value={trimEnd}
                        onChange={(event) => setTrimEnd(event.target.value)}
                        className="h-8 rounded-lg"
                        placeholder="0:05"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="trim-desc" className="text-[11px]">
                      Ghi chú
                    </Label>
                    <Input
                      id="trim-desc"
                      value={trimDescription}
                      onChange={(event) =>
                        setTrimDescription(event.target.value)
                      }
                      className="h-8 rounded-lg"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 w-full rounded-lg"
                    disabled={isMutating || isPolling}
                    onClick={() => void handleTrim()}
                  >
                    {isMutating ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : null}
                    Áp dụng cắt
                  </Button>
                </div>
              ) : null}

              {editorPanel === "segment" ? (
                <div className="grid gap-2 rounded-xl bg-white p-2.5 ring-1 ring-border">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Video nguồn</Label>
                    <Select
                      value={segmentMediaId}
                      onValueChange={(value) => {
                        if (value) setSegmentMediaId(value);
                      }}
                    >
                      <SelectTrigger className="h-8 w-full min-w-0">
                        <span className="truncate text-sm">
                          {(() => {
                            const selected = (sourceMedia ?? []).find(
                              (item) => item.mediaId === segmentMediaId,
                            );
                            if (isLoadingSourceMedia) return "Đang tải…";
                            if (!selected) return "Chọn video";
                            const dur = msToSeconds(selected.durationMs);
                            return `${selected.mediaId.slice(0, 8)} · ${dur > 0 ? formatHighlightTime(dur) : "—"} · ${selected.faceSegments.length} seg`;
                          })()}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="z-70">
                        {(sourceMedia ?? []).map((item) => {
                          const dur = msToSeconds(item.durationMs);
                          return (
                            <SelectItem
                              key={item.mediaId}
                              value={item.mediaId}
                            >
                              {`${item.mediaId.slice(0, 8)} · ${dur > 0 ? formatHighlightTime(dur) : "—"} · ${item.faceSegments.length} seg`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {(sourceMedia ?? []).length === 0 &&
                    !isLoadingSourceMedia ? (
                      <p className="text-[10px] text-muted-foreground">
                        Chưa có video đã tag khuôn mặt.
                      </p>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="seg-start" className="text-[11px]">
                        Bắt đầu
                      </Label>
                      <Input
                        id="seg-start"
                        value={segmentStart}
                        onChange={(event) =>
                          setSegmentStart(event.target.value)
                        }
                        className="h-8 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="seg-end" className="text-[11px]">
                        Kết thúc
                      </Label>
                      <Input
                        id="seg-end"
                        value={segmentEnd}
                        onChange={(event) => setSegmentEnd(event.target.value)}
                        className="h-8 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="seg-desc" className="text-[11px]">
                      Mô tả
                    </Label>
                    <Input
                      id="seg-desc"
                      value={segmentDescription}
                      onChange={(event) =>
                        setSegmentDescription(event.target.value)
                      }
                      className="h-8 rounded-lg"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 w-full rounded-lg"
                    disabled={isMutating || isPolling || !segmentMediaId}
                    onClick={() => void handleAddSegment()}
                  >
                    Thêm đoạn
                  </Button>
                </div>
              ) : null}

              {/* Goal CTA */}
              <div className="space-y-1.5 border-t border-[#E5E5E0] pt-3">
                <Button
                  type="button"
                  className="h-9 w-full rounded-xl"
                  disabled={isSyncing}
                  onClick={() => void handleSyncPortfolio()}
                >
                  {isSyncing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : null}
                  Đồng bộ vào portfolio
                </Button>
                <button
                  type="button"
                  className="mx-auto block text-[11px] text-muted-foreground underline-offset-2 hover:text-destructive hover:underline disabled:opacity-50"
                  disabled={isMutating}
                  onClick={() => void handleDeleteItem(completedItem)}
                >
                  Xóa bản video này
                </button>
              </div>
            </div>
          ) : !showProcessing && !terminalIssueItem ? (
            <p className="rounded-lg bg-white/70 px-3 py-5 text-center text-xs text-muted-foreground">
              Video chưa sẵn sàng.
            </p>
          ) : null}

          {(activeStack.items ?? []).length > 0 ? (
            <div className="space-y-1.5 border-t border-[#E5E5E0] pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Lịch sử bản
              </p>
              <ul className="overflow-hidden rounded-lg bg-white ring-1 ring-border">
                {sortByRequestedAtDesc(activeStack.items ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 border-b border-border px-2.5 py-1.5 text-[11px] last:border-b-0"
                  >
                    <span
                      className={cn(
                        "rounded px-1 py-0.5 text-[10px] font-semibold",
                        statusTone(item.status),
                      )}
                    >
                      {item.status}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {item.generationKind}
                    </span>
                    {item.status !== "Processing" ? (
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Xóa item"
                        disabled={isMutating}
                        onClick={() => void handleDeleteItem(item)}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
