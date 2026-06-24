"use client";

import { useCallback, useEffect, useRef } from "react";

import type { Activity, ResumeState } from "@/lib/api";
import { getMaterialByActivityId } from "@/lib/api";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  CHECKPOINT_DEBOUNCE_MS,
  SCROLL_COMPLETE_EPSILON,
} from "@/lib/curriculum/constants";
import {
  useActivityCompletionGate,
  useDebouncedCheckpoint,
} from "@/hooks/use-activity-completion-gate";
import { saveActivityCheckpoint } from "@/lib/api/program-enrollments";
import { cn } from "@/lib/utils";

type MaterialActivityProps = {
  activity: Activity;
  enrollmentId: string;
  resumeState: ResumeState | null;
  isAlreadyComplete: boolean;
  onCanCompleteChange?: (canComplete: boolean) => void;
  compact?: boolean;
  className?: string;
};

function resolveMaterialKind(materialType: string): "video" | "pdf" | "doc" {
  const normalized = materialType.toLowerCase();
  if (normalized === "video") return "video";
  if (normalized === "pdf") return "pdf";
  return "doc";
}

export function MaterialActivity({
  activity,
  enrollmentId,
  resumeState,
  isAlreadyComplete,
  onCanCompleteChange,
  compact = false,
  className,
}: MaterialActivityProps) {
  const materialMeta = activity.material;
  const materialKind = materialMeta ? resolveMaterialKind(materialMeta.materialType) : "manual";
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    canComplete,
    onVideoTimeUpdate,
    onVideoEnded,
    onScrollProgress,
  } = useActivityCompletionGate({
    kind: materialMeta ? materialKind : "manual",
    isAlreadyComplete,
  });

  const { data: materialResult, isLoading, hasError, retry } = useClientFetch({
    enabled: Boolean(materialMeta),
    fetcher: async () => getMaterialByActivityId(activity.id, enrollmentId),
    deps: [activity.id, enrollmentId, materialMeta?.id],
  });

  const fileUrl = materialResult?.data?.fileUrl ?? null;

  useEffect(() => {
    onCanCompleteChange?.(canComplete);
  }, [canComplete, onCanCompleteChange]);

  useEffect(() => {
    if (!materialMeta && !isAlreadyComplete) {
      onCanCompleteChange?.(true);
    }
  }, [materialMeta, isAlreadyComplete, onCanCompleteChange]);

  useEffect(() => {
    if (
      compact &&
      fileUrl &&
      !isAlreadyComplete &&
      (materialKind === "pdf" || materialKind === "doc")
    ) {
      onCanCompleteChange?.(true);
    }
  }, [compact, fileUrl, isAlreadyComplete, materialKind, onCanCompleteChange]);

  const persistCheckpoint = useCallback(async () => {
    if (!materialMeta || isAlreadyComplete) return;

    const video = videoRef.current;
    const scrollEl = scrollRef.current;

    if (materialKind === "video" && video) {
      await saveActivityCheckpoint(enrollmentId, activity.id, {
        resumeState: {
          kind: "video",
          positionSeconds: video.currentTime,
          durationSeconds: Number.isFinite(video.duration) ? video.duration : undefined,
        },
      });
      return;
    }

    if ((materialKind === "pdf" || materialKind === "doc") && scrollEl) {
      const scrollRatio =
        scrollEl.scrollHeight <= scrollEl.clientHeight
          ? 1
          : scrollEl.scrollTop / (scrollEl.scrollHeight - scrollEl.clientHeight);

      await saveActivityCheckpoint(enrollmentId, activity.id, {
        resumeState:
          materialKind === "pdf"
            ? {
                kind: "pdf",
                page: Math.max(1, Math.round(scrollRatio * 10) || 1),
                scrollRatio,
              }
            : {
                kind: "doc",
                scrollRatio,
              },
      });
    }
  }, [activity.id, enrollmentId, isAlreadyComplete, materialKind, materialMeta]);

  const scheduleCheckpoint = useDebouncedCheckpoint(persistCheckpoint, CHECKPOINT_DEBOUNCE_MS);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || materialKind !== "video" || !resumeState?.positionSeconds) return;
    if (resumeState.kind === "video" && resumeState.positionSeconds > 0) {
      video.currentTime = resumeState.positionSeconds;
    }
  }, [fileUrl, materialKind, resumeState]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !resumeState?.scrollRatio) return;
    if (resumeState.kind === "pdf" || resumeState.kind === "doc") {
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      scrollEl.scrollTop = maxScroll * resumeState.scrollRatio;
    }
  }, [fileUrl, resumeState]);

  if (!materialMeta) {
    return (
      <p className={cn("text-sm leading-relaxed text-learn-muted", className)}>
        {activity.description || "Nội dung sẽ được cập nhật."}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          compact ? "min-h-0 flex-1 animate-pulse rounded-xl bg-learn-surface-2" : "h-64 animate-pulse rounded-xl bg-learn-surface-2",
          className,
        )}
      />
    );
  }

  if (hasError || !fileUrl) {
    return (
      <div
        className={cn(
          "space-y-3 rounded-xl border border-learn-border bg-learn-surface-2 p-4",
          className,
        )}
      >
        <p className="text-sm text-learn-muted">Không tải được tài liệu học tập.</p>
        <button
          type="button"
          onClick={retry}
          className="text-sm font-medium text-learn-accent underline-offset-2 hover:underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (materialKind === "video") {
    return (
      <div
        className={cn(
          compact ? "flex min-h-0 flex-1 flex-col" : "overflow-hidden rounded-xl bg-black",
          className,
        )}
      >
        <div
          className={cn(
            "overflow-hidden bg-black",
            compact
              ? "flex min-h-0 flex-1 items-center justify-center rounded-xl"
              : "rounded-xl border border-learn-border-strong",
          )}
        >
          <video
            ref={videoRef}
            src={fileUrl}
            controls
            className={cn(
              "w-full",
              compact ? "max-h-full max-w-full object-contain" : "aspect-video",
            )}
            onTimeUpdate={(event) => {
              const target = event.currentTarget;
              onVideoTimeUpdate(target.currentTime, target.duration);
              scheduleCheckpoint();
            }}
            onEnded={() => {
              onVideoEnded();
              void persistCheckpoint();
            }}
          />
        </div>
      </div>
    );
  }

  if (materialKind === "pdf") {
    return (
      <div
        className={cn(
          compact ? "flex min-h-0 flex-1 flex-col gap-2" : "space-y-3",
          className,
        )}
      >
        <iframe
          src={fileUrl}
          title={materialMeta.title}
          className={cn(
            "w-full rounded-xl bg-learn-surface",
            compact
              ? "min-h-0 flex-1"
              : "h-[min(70vh,720px)] border border-learn-border",
          )}
        />
        <div
          ref={scrollRef}
          className={cn(
            "text-sm text-learn-muted",
            compact ? "shrink-0" : "max-h-48 overflow-y-auto rounded-xl border border-learn-border bg-learn-surface-2 p-4",
          )}
          onScroll={(event) => {
            if (compact) return;
            const target = event.currentTarget;
            const ratio =
              target.scrollHeight <= target.clientHeight
                ? 1
                : target.scrollTop / (target.scrollHeight - target.clientHeight);
            onScrollProgress(ratio);
            if (ratio >= 1 - SCROLL_COMPLETE_EPSILON) {
              void persistCheckpoint();
            } else {
              scheduleCheckpoint();
            }
          }}
        >
          <p className={compact ? "text-xs" : undefined}>
            Nếu PDF không hiển thị đầy đủ,{" "}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-learn-accent underline-offset-2 hover:underline"
            >
              mở tài liệu trong tab mới
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={cn(
        compact
          ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-learn-surface"
          : "max-h-[min(70vh,720px)] overflow-y-auto rounded-xl border border-learn-border bg-learn-surface p-6",
        className,
      )}
      onScroll={(event) => {
        const target = event.currentTarget;
        const ratio =
          target.scrollHeight <= target.clientHeight
            ? 1
            : target.scrollTop / (target.scrollHeight - target.clientHeight);
        onScrollProgress(ratio);
        if (ratio >= 1 - SCROLL_COMPLETE_EPSILON) {
          void persistCheckpoint();
        } else {
          scheduleCheckpoint();
        }
      }}
    >
      <iframe
        src={fileUrl}
        title={materialMeta.title}
        className={cn(
          "w-full rounded-lg",
          compact ? "min-h-0 flex-1" : "min-h-[480px] border border-learn-border",
        )}
      />
      <p className={cn("text-sm text-learn-muted", compact && "shrink-0 py-2")}>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-learn-accent underline-offset-2 hover:underline"
        >
          Tải / mở tài liệu
        </a>
      </p>
    </div>
  );
}
