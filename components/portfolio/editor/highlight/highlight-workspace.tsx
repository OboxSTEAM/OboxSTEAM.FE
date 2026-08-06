"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clapperboard,
  Loader2,
  Plus,
  Scissors,
  Trash2,
  X,
} from "lucide-react";
import { useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useHighlightStackPolling } from "@/hooks/use-highlight-stack-polling";
import {
  addHighlightSegment,
  createHighlightStack,
  createPortfolioItem,
  deleteHighlightStack,
  deleteHighlightVideoItem,
  getHighlightStacks,
  getMyGallery,
  trimHighlightVideo,
  type ClassGalleryMedia,
  type HighlightVideoItem,
  type HighlightVideoStack,
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

type HighlightWorkspaceProps = {
  open: boolean;
  onClose: () => void;
  onAttachedItem?: (item: PortfolioItem) => void;
};

type ClassOption = {
  classId: string;
  label: string;
};

function latestItem(stack: HighlightVideoStack | null): HighlightVideoItem | null {
  const items = stack?.items ?? [];
  if (items.length === 0) return null;
  return [...items].sort((a, b) => {
    const aTime = a.requestedAt ?? "";
    const bTime = b.requestedAt ?? "";
    return bTime.localeCompare(aTime);
  })[0] ?? null;
}

function latestCompleted(stack: HighlightVideoStack | null): HighlightVideoItem | null {
  const items = (stack?.items ?? []).filter(
    (item) => item.status === "Completed" && Boolean(item.videoUrl),
  );
  if (items.length === 0) return null;
  return latestItem({ ...stack!, items }) ?? items[0] ?? null;
}

function ProcessingPanel({
  statusLabel,
  reduceMotion,
}: {
  statusLabel?: string | null;
  reduceMotion: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#4FC3F7]/30 bg-[#4FC3F7]/8 px-4 py-6 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#4FC3F7]/15 text-[#0f7cad]">
        <Loader2
          className={cn("size-6", !reduceMotion && "animate-spin")}
          strokeWidth={2.25}
        />
      </div>
      <p className="text-sm font-semibold text-foreground">
        Đang tạo highlight video…
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {statusLabel ??
          "AI đang nhận diện khuôn mặt và ghép theo mô tả điểm mạnh của bạn."}
      </p>
      <div className="mx-auto mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#4FC3F7]/20">
        <div
          className={cn(
            "h-full w-1/2 rounded-full bg-[#4FC3F7]",
            !reduceMotion && "animate-pulse",
          )}
        />
      </div>
    </div>
  );
}

export function HighlightWorkspace({
  open,
  onClose,
  onAttachedItem,
}: HighlightWorkspaceProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [classId, setClassId] = useState("");
  const [strengthDescription, setStrengthDescription] = useState("");
  const [activeStackId, setActiveStackId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);

  const [trimStart, setTrimStart] = useState("0:00");
  const [trimEnd, setTrimEnd] = useState("0:05");
  const [trimDescription, setTrimDescription] = useState("");

  const [segmentMediaId, setSegmentMediaId] = useState("");
  const [segmentStart, setSegmentStart] = useState("0:00");
  const [segmentEnd, setSegmentEnd] = useState("0:05");
  const [segmentDescription, setSegmentDescription] = useState("");
  const [pollNonce, setPollNonce] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: classSeed, isLoading: isLoadingClasses } = useClientFetch({
    enabled: open,
    fetcher: async () => {
      const result = await getMyGallery({
        page: 1,
        pageSize: 100,
        isDescending: true,
      });
      return result?.data?.items ?? [];
    },
    deps: [open],
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
    enabled: open && Boolean(classId),
    fetcher: async () => {
      if (!classId) return [];
      const result = await getHighlightStacks({ classId });
      return result?.data ?? [];
    },
    deps: [open, classId],
    onError: (error) => showAppErrorFromUnknown(error, "highlight.load"),
  });

  const { data: classMedia } = useClientFetch({
    enabled: open && Boolean(classId),
    fetcher: async () => {
      if (!classId) return [] as ClassGalleryMedia[];
      const result = await getMyGallery({
        classId,
        fileType: "video",
        page: 1,
        pageSize: 50,
        isDescending: true,
      });
      return (result?.data?.items ?? []).filter(
        (item) => item.isReady && Boolean(item.fileUrl),
      );
    },
    deps: [open, classId],
    onError: (error) => showAppErrorFromUnknown(error, "media.list"),
  });

  const {
    stack: polledStack,
    isPolling,
    setStack: setPolledStack,
  } = useHighlightStackPolling({
    stackId: activeStackId,
    pollNonce,
    enabled: open && Boolean(activeStackId),
    onCompleted: (stack) => {
      mutateStacks((current) =>
        (current ?? []).map((item) => (item.id === stack.id ? stack : item)),
      );
      showAppSuccess({ title: "Highlight đã sẵn sàng" });
    },
    onFailed: () => {
      showAppErrorFromUnknown(
        new Error("Highlight xử lý thất bại."),
        "highlight.create",
      );
    },
    onTimedOut: () => {
      showAppErrorFromUnknown(
        new Error("Hết thời gian chờ highlight."),
        "highlight.create",
      );
    },
  });

  const activeStack =
    polledStack ??
    (stacks ?? []).find((stack) => stack.id === activeStackId) ??
    null;
  const completedItem = latestCompleted(activeStack);
  const currentItem = latestItem(activeStack);
  const durationSeconds = msToSeconds(completedItem?.durationMs);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPolling && !isCreating) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, isPolling, isCreating]);

  if (!open) return null;

  const handleCreate = async () => {
    if (!classId) return;
    setIsCreating(true);
    try {
      const result = await createHighlightStack({
        classId,
        strengthDescription: strengthDescription.trim() || null,
      });
      const stack = result?.data;
      if (!stack) throw new Error("Không nhận được highlight stack.");
      setActiveStackId(stack.id);
      setPolledStack(stack);
      mutateStacks((current) => [stack, ...(current ?? [])]);
      showAppSuccess({ title: "Đã bắt đầu tạo highlight" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.create");
    } finally {
      setIsCreating(false);
    }
  };

  const handleTrim = async () => {
    if (!activeStackId || !completedItem) return;
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
      await trimHighlightVideo(activeStackId, completedItem.id, {
        trimDescription: trimDescription.trim() || null,
        excludeRanges: [
          {
            start: toHighlightApiTime(start),
            end: toHighlightApiTime(end),
          },
        ],
      });
      setPollNonce((value) => value + 1);
      showAppSuccess({ title: "Đã gửi yêu cầu cắt video" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.trim");
    } finally {
      setIsMutating(false);
    }
  };

  const handleAddSegment = async () => {
    if (!activeStackId || !completedItem || !segmentMediaId) return;
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
      await addHighlightSegment(activeStackId, completedItem.id, {
        mediaId: segmentMediaId,
        start: toHighlightApiTime(start),
        end: toHighlightApiTime(end),
        description: segmentDescription.trim() || null,
      });
      setPollNonce((value) => value + 1);
      showAppSuccess({ title: "Đã gửi yêu cầu thêm đoạn" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.segment");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteItem = async (item: HighlightVideoItem) => {
    if (!activeStackId) return;
    setIsMutating(true);
    try {
      await deleteHighlightVideoItem(activeStackId, item.id);
      refreshStacks();
      setPolledStack(null);
      showAppSuccess({ title: "Đã xóa phiên bản highlight" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.delete");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteStack = async (stackId: string) => {
    setIsMutating(true);
    try {
      await deleteHighlightStack(stackId);
      if (activeStackId === stackId) {
        setActiveStackId(null);
        setPolledStack(null);
      }
      refreshStacks();
      showAppSuccess({ title: "Đã xóa highlight stack" });
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.delete");
    } finally {
      setIsMutating(false);
    }
  };

  const handleAttach = async () => {
    if (!completedItem?.videoUrl) return;
    setIsAttaching(true);
    try {
      const result = await createPortfolioItem({
        itemType: "Project",
        title:
          activeStack?.strengthDescription?.trim() ||
          "Highlight video",
        mediaUrl: completedItem.videoUrl,
        description: activeStack?.strengthDescription ?? null,
        isVisible: true,
      });
      const item = result?.data;
      if (!item) throw new Error("Không tạo được mục portfolio.");
      showAppSuccess({
        title: "Đã gắn highlight vào portfolio",
        description: "Mục mới đã được thêm — chỉnh sửa tiếp trong tab Mục.",
      });
      onAttachedItem?.(item);
      onClose();
    } catch (error) {
      showAppErrorFromUnknown(error, "highlight.attach");
    } finally {
      setIsAttaching(false);
    }
  };

  const showProcessing =
    isPolling ||
    activeStack?.hasProcessingItem ||
    currentItem?.status === "Processing";

  const selectTriggerClass = "h-10 w-full min-w-0";
  const selectContentClass = "z-[70]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Đóng highlight workspace"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        onClick={() => {
          if (!isPolling && !isCreating) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Highlight video"
        className={cn(
          "relative z-[1] flex max-h-[min(92dvh,52rem)] w-full max-w-3xl flex-col",
          "overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f7cad]">
              Highlight
            </p>
            <h2 className="truncate text-sm font-semibold text-foreground">
              Mini editor video AI
            </h2>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Lớp học</Label>
              <Select
                value={classId}
                onValueChange={(value) => {
                  if (!value) return;
                  setClassId(value);
                  setActiveStackId(null);
                  setPolledStack(null);
                }}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <span className="truncate">
                    {classOptions.find((option) => option.classId === classId)
                      ?.label ??
                      (isLoadingClasses ? "Đang tải…" : "Chọn lớp")}
                  </span>
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {classOptions.map((option) => (
                    <SelectItem key={option.classId} value={option.classId}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="strength-desc">Mô tả điểm mạnh</Label>
              <Textarea
                id="strength-desc"
                value={strengthDescription}
                onChange={(event) => setStrengthDescription(event.target.value)}
                placeholder="Ví dụ: Tự tin thuyết trình, khéo léo khi lắp robot…"
                className="min-h-20 rounded-xl"
              />
            </div>
            <Button
              type="button"
              className="h-10 rounded-xl sm:col-span-2"
              disabled={!classId || isCreating || isPolling}
              onClick={() => void handleCreate()}
            >
              {isCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Clapperboard className="size-4" />
              )}
              Tạo highlight mới
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Stack của bạn</p>
            {isLoadingStacks ? (
              <p className="text-xs text-muted-foreground">Đang tải…</p>
            ) : (stacks ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                Chưa có highlight cho lớp này.
              </p>
            ) : (
              <ul className="space-y-2">
                {(stacks ?? []).map((stack) => {
                  const selected = stack.id === activeStackId;
                  return (
                    <li key={stack.id}>
                      <div
                        className={cn(
                          "flex items-start gap-2 rounded-xl border px-3 py-2.5 transition",
                          selected
                            ? "border-[#4FC3F7] bg-[#4FC3F7]/8"
                            : "border-border bg-card",
                        )}
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => {
                            setActiveStackId(stack.id);
                            setPolledStack(stack);
                          }}
                        >
                          <p className="truncate text-sm font-semibold">
                            {stack.strengthDescription?.trim() ||
                              "Highlight không tiêu đề"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {stack.itemCount}/{stack.maxItems} phiên bản
                            {stack.hasProcessingItem ? " · Đang xử lý" : ""}
                          </p>
                        </button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Xóa stack"
                          disabled={isMutating}
                          onClick={() => void handleDeleteStack(stack.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {activeStack ? (
            <div className="space-y-4 border-t border-border pt-4">
              {showProcessing ? (
                <ProcessingPanel
                  statusLabel={currentItem?.statusLabel}
                  reduceMotion={reduceMotion}
                />
              ) : null}

              {completedItem?.videoUrl ? (
                <div className="space-y-3">
                  <VideoThumb
                    src={completedItem.videoUrl}
                    durationLabel={
                      durationSeconds > 0
                        ? formatHighlightTime(durationSeconds)
                        : null
                    }
                    className="w-full rounded-2xl"
                    onClick={() => setIsPreviewOpen(true)}
                    aria-label="Xem highlight lớn hơn"
                  />
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
                  <p className="text-[11px] text-muted-foreground">
                    {completedItem.generationKind}
                    {durationSeconds > 0
                      ? ` · ${formatHighlightTime(durationSeconds)}`
                      : ""}
                    {completedItem.statusLabel
                      ? ` · ${completedItem.statusLabel}`
                      : ""}
                  </p>

                  <div className="grid gap-3 rounded-2xl border border-border p-3 sm:grid-cols-2">
                    <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold">
                      <Scissors className="size-3.5" />
                      Cắt bỏ khoảng thời gian
                    </p>
                    <div className="space-y-1">
                      <Label htmlFor="trim-start">Bắt đầu (mm:ss)</Label>
                      <Input
                        id="trim-start"
                        value={trimStart}
                        onChange={(event) => setTrimStart(event.target.value)}
                        className="h-9 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="trim-end">Kết thúc (mm:ss)</Label>
                      <Input
                        id="trim-end"
                        value={trimEnd}
                        onChange={(event) => setTrimEnd(event.target.value)}
                        className="h-9 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="trim-desc">Ghi chú cắt</Label>
                      <Input
                        id="trim-desc"
                        value={trimDescription}
                        onChange={(event) =>
                          setTrimDescription(event.target.value)
                        }
                        className="h-9 rounded-xl"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl sm:col-span-2"
                      disabled={isMutating || isPolling}
                      onClick={() => void handleTrim()}
                    >
                      {isMutating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Áp dụng cắt
                    </Button>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-border p-3 sm:grid-cols-2">
                    <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold">
                      <Plus className="size-3.5" />
                      Thêm đoạn từ gallery lớp
                    </p>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Media nguồn</Label>
                      <Select
                        value={segmentMediaId}
                        onValueChange={(value) => {
                          if (value) setSegmentMediaId(value);
                        }}
                      >
                        <SelectTrigger className="h-9 w-full min-w-0">
                          <span className="truncate">
                            {(() => {
                              const selected = (classMedia ?? []).find(
                                (item) => item.id === segmentMediaId,
                              );
                              if (!selected) return "Chọn video lớp";
                              return `${selected.className ?? "Video"} · ${selected.id.slice(0, 8)}`;
                            })()}
                          </span>
                        </SelectTrigger>
                        <SelectContent className={selectContentClass}>
                          {(classMedia ?? []).map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {(item.className ?? "Video") +
                                ` · ${item.id.slice(0, 8)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="seg-start">Bắt đầu</Label>
                      <Input
                        id="seg-start"
                        value={segmentStart}
                        onChange={(event) =>
                          setSegmentStart(event.target.value)
                        }
                        className="h-9 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="seg-end">Kết thúc</Label>
                      <Input
                        id="seg-end"
                        value={segmentEnd}
                        onChange={(event) => setSegmentEnd(event.target.value)}
                        className="h-9 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="seg-desc">Mô tả đoạn</Label>
                      <Input
                        id="seg-desc"
                        value={segmentDescription}
                        onChange={(event) =>
                          setSegmentDescription(event.target.value)
                        }
                        className="h-9 rounded-xl"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl sm:col-span-2"
                      disabled={
                        isMutating || isPolling || !segmentMediaId
                      }
                      onClick={() => void handleAddSegment()}
                    >
                      Thêm đoạn vào highlight
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="h-10 rounded-xl"
                      disabled={isAttaching}
                      onClick={() => void handleAttach()}
                    >
                      {isAttaching ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Gắn vào portfolio
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 rounded-xl"
                      disabled={isMutating}
                      onClick={() => void handleDeleteItem(completedItem)}
                    >
                      Xóa phiên bản này
                    </Button>
                  </div>
                </div>
              ) : !showProcessing ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  Chọn stack hoặc tạo highlight mới để bắt đầu.
                </p>
              ) : null}

              {(activeStack.items ?? []).length > 1 ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Lịch sử phiên bản
                  </p>
                  <ul className="space-y-1">
                    {(activeStack.items ?? []).map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-2.5 py-1.5 text-[11px]"
                      >
                        <span>
                          {item.generationKind} · {item.status}
                        </span>
                        <span className="text-muted-foreground">
                          {item.statusLabel ?? ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
