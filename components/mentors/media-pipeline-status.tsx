"use client";

import { CheckCircle2Icon, CircleIcon, Loader2, XCircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import type { MediaProgress, MediaVideoStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "upload", label: "Tải lên" },
  { key: "transcode", label: "Chuyển mã" },
  { key: "tagging", label: "Nhận diện AI" },
  { key: "ready", label: "Sẵn sàng" },
] as const;

/** Max catch-up when progress jumps (e.g. image instantly ready). */
const CATCH_UP_MS = 1400;
/** Treat uploads this fresh as “just uploaded” for mount reveal. */
const FRESH_UPLOAD_MS = 10_000;

type PipelineResolved = {
  status: MediaVideoStatus;
  ready: boolean;
  failed: boolean;
  percent: number | null;
  isTranscoding: boolean;
  isTagging: boolean;
  stepIndex: number;
  statusLabel: string | null;
};

function resolvePipelineStatus(
  videoStatus: MediaVideoStatus,
  isReady: boolean,
  progress?: MediaProgress | null,
): PipelineResolved {
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

function fillWithinStage(resolved: PipelineResolved): number {
  if (resolved.ready || resolved.failed) return 100;
  if (resolved.isTranscoding) {
    return resolved.percent == null ? 18 : Math.max(resolved.percent, 6);
  }
  if (resolved.isTagging) return 70;
  return 55;
}

function overallFromResolved(resolved: PipelineResolved): number {
  if (resolved.ready) return 100;
  const fill = fillWithinStage(resolved);
  return Math.min(
    99.5,
    ((resolved.stepIndex + fill / 100) / STAGES.length) * 100,
  );
}

function isFreshUpload(uploadedAt?: string | null): boolean {
  if (!uploadedAt) return false;
  const t = new Date(uploadedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < FRESH_UPLOAD_MS;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Smooth displayed % toward target. Fresh ready uploads reveal from 0;
 * already-ready on open snaps. Later jumps (instant image pipeline) catch up.
 */
function useSmoothedProgress(
  target: number,
  {
    mediaKey,
    revealFromStart,
  }: {
    mediaKey: string;
    revealFromStart: boolean;
  },
): number {
  const [display, setDisplay] = useState(() =>
    revealFromStart ? 0 : target,
  );
  const displayRef = useRef(display);
  displayRef.current = display;

  const mediaKeyRef = useRef(mediaKey);

  useEffect(() => {
    if (mediaKeyRef.current === mediaKey) return;
    mediaKeyRef.current = mediaKey;
    const next = revealFromStart ? 0 : target;
    displayRef.current = next;
    setDisplay(next);
  }, [mediaKey, revealFromStart, target]);

  useEffect(() => {
    const from = displayRef.current;
    const delta = target - from;

    if (Math.abs(delta) < 0.15) {
      if (from !== target) {
        displayRef.current = target;
        setDisplay(target);
      }
      return;
    }

    // Regression (rare) — snap back.
    if (delta < 0) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    const duration = Math.min(
      CATCH_UP_MS,
      Math.max(420, (delta / 100) * CATCH_UP_MS),
    );
    const startedAt = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const next = from + delta * easeOutCubic(t);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        displayRef.current = target;
        setDisplay(target);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, mediaKey]);

  return display;
}

function displayMeta(displayPercent: number, failed: boolean) {
  const stageFloat = (displayPercent / 100) * STAGES.length;
  const clamped = Math.min(STAGES.length, Math.max(0, stageFloat));
  const displayReady = !failed && displayPercent >= 99.5;
  const activeIndex = displayReady
    ? STAGES.length - 1
    : Math.min(STAGES.length - 1, Math.floor(clamped));

  return { stageFloat: clamped, displayReady, activeIndex };
}

function stageState(
  index: number,
  {
    stageFloat,
    displayReady,
    failed,
    failedStepIndex,
  }: {
    stageFloat: number;
    displayReady: boolean;
    failed: boolean;
    failedStepIndex: number;
  },
): "done" | "active" | "pending" | "failed" {
  if (failed && index === failedStepIndex) return "failed";
  if (displayReady || stageFloat >= index + 1) return "done";
  if (Math.floor(stageFloat) === index) return "active";
  return "pending";
}

function completedCount(
  stageFloat: number,
  displayReady: boolean,
  failed: boolean,
  failedStepIndex: number,
): number {
  if (displayReady) return STAGES.length;
  let count = 0;
  for (let i = 0; i < STAGES.length; i++) {
    const state = stageState(i, {
      stageFloat,
      displayReady,
      failed,
      failedStepIndex,
    });
    if (state === "done") count += 1;
  }
  return count;
}

function activeStatusLabel(
  resolved: PipelineResolved,
  displayReady: boolean,
): string {
  if (resolved.failed) return resolved.statusLabel?.trim() || "Thất bại";
  if (displayReady || resolved.ready) return "Sẵn sàng";
  if (resolved.isTranscoding) {
    return resolved.percent == null
      ? "Đang chuyển mã"
      : `Chuyển mã ${Math.round(resolved.percent)}%`;
  }
  if (resolved.isTagging) return "Nhận diện AI";
  return "Đã tải lên";
}

type MediaPipelineStatusProps = {
  videoStatus: MediaVideoStatus;
  isReady: boolean;
  progress?: MediaProgress | null;
  timedOut?: boolean;
  compact?: boolean;
  /** Stable id — resets smoothed progress when switching media. */
  mediaId?: string;
  uploadedAt?: string | null;
  className?: string;
};

/**
 * Pipeline progress for mentor media:
 * - Detail: checklist (label + N/4 + thin bar + read-only stages)
 * - List (`compact`): mini bar + short status, no stage list
 */
export function MediaPipelineStatus({
  videoStatus,
  isReady,
  progress,
  timedOut = false,
  compact = false,
  mediaId,
  uploadedAt = null,
  className,
}: MediaPipelineStatusProps) {
  const resolved = resolvePipelineStatus(videoStatus, isReady, progress);
  const target = overallFromResolved(resolved);
  const mediaKey = mediaId ?? `${videoStatus}:${isReady}`;
  // Fresh ready upload → animate 0→100. Already-ready on open → snap. In-flight → snap then catch up.
  const revealFromStart =
    resolved.ready && !resolved.failed && isFreshUpload(uploadedAt);

  const displayPercent = useSmoothedProgress(target, {
    mediaKey,
    revealFromStart,
  });

  const { stageFloat, displayReady, activeIndex } = displayMeta(
    displayPercent,
    resolved.failed,
  );
  const doneCount = completedCount(
    stageFloat,
    displayReady,
    resolved.failed,
    resolved.stepIndex,
  );
  const label = activeStatusLabel(resolved, displayReady);

  const indicatorTone = resolved.failed
    ? "[&_[data-slot=progress-indicator]]:!bg-destructive"
    : displayReady || doneCount === STAGES.length
      ? "[&_[data-slot=progress-indicator]]:!bg-[#7CB342]"
      : "[&_[data-slot=progress-indicator]]:!bg-foreground";

  const progressClass = cn("w-full gap-x-2 gap-y-1", indicatorTone);

  if (compact) {
    return (
      <div
        className={cn(
          "flex min-w-[9.5rem] max-w-[12rem] flex-col gap-1 whitespace-normal",
          className,
        )}
      >
        <Progress
          value={displayPercent}
          className={cn(progressClass, "[&_[data-slot=progress-track]]:h-1")}
        >
          <ProgressLabel
            className={cn(
              "min-w-0 flex-1 truncate text-[11px] font-medium leading-tight",
              resolved.failed
                ? "text-destructive"
                : displayReady
                  ? "text-[#3d5c22] dark:text-[#b8e086]"
                  : "text-foreground",
            )}
          >
            {label}
          </ProgressLabel>
          <ProgressValue className="shrink-0 text-[10px] text-muted-foreground">
            {() => `${doneCount}/${STAGES.length}`}
          </ProgressValue>
        </Progress>

        {timedOut && !resolved.ready && !resolved.failed ? (
          <p className="text-[10px] text-muted-foreground">Đang chậm</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full max-w-[15.5rem] flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3",
        className,
      )}
    >
      <Progress
        value={displayPercent}
        className={cn(progressClass, "[&_[data-slot=progress-track]]:h-1.5")}
      >
        <ProgressLabel className="text-xs font-semibold text-foreground">
          Tiến trình
        </ProgressLabel>
        <ProgressValue className="text-[11px] text-muted-foreground">
          {() =>
            resolved.failed
              ? "Lỗi"
              : `${doneCount}/${STAGES.length}`
          }
        </ProgressValue>
      </Progress>

      <ul className="flex flex-col gap-1.5">
        {STAGES.map((stage, index) => {
          const state = stageState(index, {
            stageFloat,
            displayReady,
            failed: resolved.failed,
            failedStepIndex: resolved.stepIndex,
          });
          const isActive = state === "active";
          const showSpinner =
            isActive &&
            (resolved.isTagging ||
              (resolved.isTranscoding && resolved.percent == null));

          return (
            <li
              key={stage.key}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                state === "done" || state === "failed" || state === "active"
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <div className="relative flex size-3.5 shrink-0 items-center justify-center">
                {state === "done" ? (
                  <CheckCircle2Icon className="size-3.5 text-[#7CB342]" />
                ) : state === "failed" ? (
                  <XCircleIcon className="size-3.5 text-destructive" />
                ) : showSpinner ? (
                  <Loader2 className="size-3 animate-spin text-primary" />
                ) : (
                  <CircleIcon
                    className={cn(
                      "size-3.5",
                      isActive ? "text-foreground" : "text-muted-foreground/70",
                    )}
                  />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate leading-tight">
                {stage.label}
                {isActive &&
                resolved.isTranscoding &&
                resolved.percent != null ? (
                  <span className="ml-1 font-mono text-[10px] tabular-nums text-muted-foreground">
                    {Math.round(resolved.percent)}%
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>

      {timedOut && !resolved.ready && !resolved.failed ? (
        <p className="text-[10px] text-muted-foreground">
          Đang chậm — thử tải lại
        </p>
      ) : null}

      <span className="sr-only">
        {label}
        {activeIndex >= 0 ? `, bước ${activeIndex + 1}` : null}
      </span>
    </div>
  );
}
