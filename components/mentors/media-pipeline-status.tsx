"use client";

import { Loader2 } from "lucide-react";

import type { MediaProgress, MediaVideoStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "upload", label: "Tải lên" },
  { key: "transcode", label: "Chuyển mã" },
  { key: "tagging", label: "AI" },
  { key: "ready", label: "Xong" },
] as const;

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

  // 0 upload · 1 transcode · 2 AI · 3 ready
  const stepIndex = failed
    ? status === "Failed" && !isTranscoding
      ? 2
      : 1
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

function segmentFillPercent({
  index,
  stepIndex,
  ready,
  failed,
  isTranscoding,
  isTagging,
  percent,
}: {
  index: number;
  stepIndex: number;
  ready: boolean;
  failed: boolean;
  isTranscoding: boolean;
  isTagging: boolean;
  percent: number | null;
}): number {
  if (ready || index < stepIndex) return 100;
  if (index > stepIndex) return 0;
  if (failed) return 100;
  if (isTranscoding) return percent == null ? 18 : Math.max(percent, 6);
  if (isTagging) return 70;
  return 100;
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
 * Staged pipeline bar for table / detail:
 * Upload → Transcode (% fill) → AI → Ready.
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

  const activeLabel = failed
    ? statusLabel?.trim() || "Thất bại"
    : ready
      ? "Sẵn sàng"
      : isTranscoding
        ? percent == null
          ? "Đang chuyển mã"
          : `Chuyển mã ${Math.round(percent)}%`
        : isTagging
          ? "Nhận diện AI"
          : "Đã tải lên";

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 whitespace-normal",
        compact ? "min-w-[12.5rem]" : "min-w-[16rem]",
        className,
      )}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
        <span aria-hidden className="min-w-0" />
        <p
          className={cn(
            "max-w-full truncate text-center text-xs font-medium",
            failed
              ? "text-destructive"
              : ready
                ? "text-[#3d5c22] dark:text-[#b8e086]"
                : "text-foreground",
          )}
        >
          {activeLabel}
        </p>
        <div className="flex min-w-0 items-center justify-end">
          {isTagging ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
          ) : isTranscoding && percent != null ? (
            <span className="font-mono text-[11px] font-semibold tabular-nums text-muted-foreground">
              {Math.round(percent)}%
            </span>
          ) : null}
        </div>
      </div>

      <div
        className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={
          ready
            ? 100
            : failed
              ? undefined
              : isTranscoding && percent != null
                ? Math.round((1 + percent / 100) * 25)
                : Math.round(((stepIndex + 0.5) / STAGES.length) * 100)
        }
        aria-label={activeLabel}
      >
        {STAGES.map((stage, index) => {
          const fill = segmentFillPercent({
            index,
            stepIndex,
            ready,
            failed,
            isTranscoding,
            isTagging,
            percent,
          });
          const isActive = !ready && index === stepIndex;
          const isDone = ready || index < stepIndex;

          return (
            <div
              key={stage.key}
              className="relative h-full min-w-0 flex-1 overflow-hidden rounded-sm bg-muted"
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-sm transition-[width] duration-500 ease-out",
                  failed && isActive
                    ? "bg-destructive"
                    : isDone || ready
                      ? "bg-[#7CB342]"
                      : isActive && isTagging
                        ? "animate-pulse bg-primary"
                        : isActive
                          ? "bg-primary"
                          : "bg-transparent",
                )}
                style={{ width: `${fill}%` }}
              />
            </div>
          );
        })}
      </div>

      {!compact ? (
        <div className="flex gap-0.5">
          {STAGES.map((stage, index) => {
            const isDone = ready || index < stepIndex;
            const isActive = !ready && !failed && index === stepIndex;
            return (
              <span
                key={stage.key}
                className={cn(
                  "min-w-0 flex-1 truncate text-center text-[10px] leading-tight",
                  failed && index === stepIndex
                    ? "font-medium text-destructive"
                    : isDone || ready
                      ? "font-medium text-[#3d5c22] dark:text-[#b8e086]"
                      : isActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                )}
              >
                {stage.label}
              </span>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-0.5">
          {STAGES.map((stage, index) => {
            const isDone = ready || index < stepIndex;
            const isActive = !ready && !failed && index === stepIndex;
            return (
              <span
                key={stage.key}
                className={cn(
                  "min-w-0 flex-1 truncate text-center text-[9px] leading-tight",
                  failed && index === stepIndex
                    ? "text-destructive"
                    : isDone || ready
                      ? "text-[#3d5c22]/80 dark:text-[#b8e086]/80"
                      : isActive
                        ? "text-foreground"
                        : "text-muted-foreground/80",
                )}
              >
                {stage.label}
              </span>
            );
          })}
        </div>
      )}

      {timedOut && !ready && !failed ? (
        <p className="text-[11px] text-muted-foreground">
          Đang chậm — thử tải lại
        </p>
      ) : null}
    </div>
  );
}
