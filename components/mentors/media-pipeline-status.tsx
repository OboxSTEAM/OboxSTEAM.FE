"use client";

import { Check, Loader2, X } from "lucide-react";

import type { MediaProgress, MediaVideoStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const STEP_COUNT = 4;

function resolvePipelineStatus(
  videoStatus: MediaVideoStatus,
  isReady: boolean,
  progress?: MediaProgress | null,
) {
  const status = progress?.videoStatus ?? videoStatus;
  const failed = progress?.isFailed ?? status === "Failed";
  const isTranscoding = !failed && status === "Transcoding";
  const isTagging = !failed && status === "PendingTagging";
  const ready =
    !failed &&
    !isTranscoding &&
    !isTagging &&
    (status === "TaggingComplete" ||
      progress?.isReady === true ||
      (status === "None" && isReady) ||
      isReady);

  const rawPercent = progress?.percentComplete;
  const percent =
    rawPercent == null || Number.isNaN(Number(rawPercent))
      ? null
      : Math.min(100, Math.max(0, Number(rawPercent)));

  const stepIndex = failed
    ? 2
    : ready
      ? 3
      : isTagging
        ? 2
        : isTranscoding
          ? 1
          : 0;

  return {
    status,
    ready,
    failed,
    percent,
    isTranscoding,
    isTagging,
    stepIndex,
    statusLabel: progress?.statusLabel ?? null,
  };
}

function StepDots({
  stepIndex,
  failed,
  ready,
}: {
  stepIndex: number;
  failed: boolean;
  ready: boolean;
}) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: STEP_COUNT }, (_, index) => {
        const isDone = ready || index < stepIndex;
        const isCurrent = !ready && !failed && index === stepIndex;
        return (
          <span
            key={index}
            className={cn(
              "size-1.5 rounded-full transition-colors",
              failed && index === stepIndex
                ? "bg-destructive"
                : isDone
                  ? "bg-[#7CB342]"
                  : isCurrent
                    ? "bg-primary"
                    : "bg-border",
            )}
          />
        );
      })}
    </div>
  );
}

type MediaPipelineStatusProps = {
  videoStatus: MediaVideoStatus;
  isReady: boolean;
  progress?: MediaProgress | null;
  timedOut?: boolean;
  compact?: boolean;
  className?: string;
};

/**
 * Compact media pipeline for table / detail:
 * dots for stage · clear status line · % bar only while Transcoding.
 */
export function MediaPipelineStatus({
  videoStatus,
  isReady,
  progress,
  timedOut = false,
  compact = false,
  className,
}: MediaPipelineStatusProps) {
  const {
    ready,
    failed,
    percent,
    isTranscoding,
    isTagging,
    stepIndex,
    statusLabel,
  } = resolvePipelineStatus(videoStatus, isReady, progress);

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 whitespace-normal",
        compact ? "min-w-[9.5rem]" : "min-w-[12rem]",
        className,
      )}
    >
      <StepDots stepIndex={stepIndex} failed={failed} ready={ready} />

      {failed ? (
        <div className="flex items-start gap-1.5 text-destructive">
          <X className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.25} />
          <p className="text-xs leading-snug">
            {statusLabel?.trim() || "Xử lý thất bại"}
          </p>
        </div>
      ) : null}

      {isTranscoding ? (
        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground">Chuyển mã</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {percent == null ? "—" : `${Math.round(percent)}%`}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-[width] duration-500 ease-out",
                percent == null && "animate-pulse",
              )}
              style={{
                width: `${percent == null ? 15 : Math.max(percent, 4)}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {isTagging ? (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
          <span>Nhận diện AI</span>
        </div>
      ) : null}

      {ready ? (
        <div className="flex items-center gap-1.5 text-xs text-[#3d5c22] dark:text-[#b8e086]">
          <Check className="size-3.5 shrink-0" strokeWidth={2.5} />
          <span>Sẵn sàng</span>
        </div>
      ) : null}

      {timedOut && !ready && !failed ? (
        <p className="text-[11px] text-muted-foreground">Đang chậm — thử tải lại</p>
      ) : null}

      {!compact && !ready && !failed && !isTranscoding && !isTagging ? (
        <p className="text-xs text-muted-foreground">Đã tải lên</p>
      ) : null}
    </div>
  );
}
