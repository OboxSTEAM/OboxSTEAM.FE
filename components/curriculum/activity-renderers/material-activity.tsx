"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Activity, ResumeState } from "@/lib/api";
import { getMaterialByActivityId } from "@/lib/api";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  CHECKPOINT_DEBOUNCE_MS,
  EMBEDDED_FRAME_POLL_MS,
  VIDEO_CHECKPOINT_INTERVAL_MS,
  VIDEO_CHECKPOINT_MIN_DELTA_SECONDS,
} from "@/lib/curriculum/constants";
import {
  buildPdfSrc,
  readEmbeddedFrameProgress,
  restoreEmbeddedFrameScroll,
  type EmbeddedFrameProgress,
} from "@/lib/curriculum/embedded-frame-progress";
import { resolvePdfEmbedUrl } from "@/lib/curriculum/pdf-embed-url";
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

type MaterialKind = "video" | "pdf" | "doc";

function resolveMaterialKind(materialType: string): MaterialKind {
  const normalized = materialType.toLowerCase();
  if (normalized === "video") return "video";
  if (normalized === "pdf") return "pdf";
  return "doc";
}

function resolveInitialPdfPage(resumeState: ResumeState | null): number {
  if (resumeState?.kind === "pdf" && resumeState.page != null && resumeState.page > 0) {
    return resumeState.page;
  }
  return 1;
}

function resolveInitialScrollRatio(resumeState: ResumeState | null): number {
  if (resumeState?.scrollRatio != null && resumeState.scrollRatio > 0) {
    return resumeState.scrollRatio;
  }
  return 0;
}

function progressChanged(
  previous: EmbeddedFrameProgress | null,
  next: EmbeddedFrameProgress,
): boolean {
  if (!previous) return true;
  return (
    previous.page !== next.page ||
    Math.abs(previous.scrollRatio - next.scrollRatio) > 0.01
  );
}

type CheckpointSaverProps = {
  enrollmentId: string;
  activityId: string;
  isAlreadyComplete: boolean;
  buildResumeState: () => Parameters<typeof saveActivityCheckpoint>[2] | null;
};

function useCheckpointSaver({
  enrollmentId,
  activityId,
  isAlreadyComplete,
  buildResumeState,
}: CheckpointSaverProps) {
  const buildRef = useRef(buildResumeState);
  const persistRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    buildRef.current = buildResumeState;
  }, [buildResumeState]);

  const persistCheckpoint = useCallback(async () => {
    if (isAlreadyComplete) return;

    const payload = buildRef.current();
    if (!payload) return;

    try {
      await saveActivityCheckpoint(enrollmentId, activityId, payload);
    } catch {
      // Debounced saves should not interrupt the learner with toasts.
    }
  }, [activityId, enrollmentId, isAlreadyComplete]);

  persistRef.current = persistCheckpoint;

  const scheduleCheckpoint = useDebouncedCheckpoint(
    persistCheckpoint,
    CHECKPOINT_DEBOUNCE_MS,
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void persistRef.current?.();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void persistRef.current?.();
    };
  }, []);

  return { persistCheckpoint, scheduleCheckpoint };
}

function useEmbeddedFrameTracking({
  iframeRef,
  progressRef,
  enabled,
  onProgress,
  scheduleCheckpoint,
  readProgress = readEmbeddedFrameProgress,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  progressRef: React.MutableRefObject<EmbeddedFrameProgress>;
  enabled: boolean;
  onProgress: (scrollRatio: number) => void;
  scheduleCheckpoint: () => void;
  readProgress?: (
    iframe: HTMLIFrameElement | null,
  ) => EmbeddedFrameProgress | null;
}) {
  useEffect(() => {
    if (!enabled) return;

    const poll = () => {
      const next = readProgress(iframeRef.current);
      if (!next) return;

      onProgress(next.scrollRatio);

      if (progressChanged(progressRef.current, next)) {
        progressRef.current = next;
        scheduleCheckpoint();
      }
    };

    const intervalId = window.setInterval(poll, EMBEDDED_FRAME_POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [enabled, iframeRef, onProgress, progressRef, readProgress, scheduleCheckpoint]);
}

type VideoMaterialViewProps = {
  fileUrl: string;
  title: string;
  resumeState: ResumeState | null;
  compact: boolean;
  className?: string;
  enrollmentId: string;
  activityId: string;
  isAlreadyComplete: boolean;
  onCanCompleteChange?: (canComplete: boolean) => void;
};

function VideoMaterialView({
  fileUrl,
  title,
  resumeState,
  compact,
  className,
  enrollmentId,
  activityId,
  isAlreadyComplete,
  onCanCompleteChange,
}: VideoMaterialViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSeekTargetRef = useRef<number | null>(null);
  const lastSavedPositionRef = useRef<number | null>(null);
  const isSeekingRef = useRef(false);

  useEffect(() => {
    lastSavedPositionRef.current = null;
  }, [activityId, fileUrl]);

  const { canComplete, onVideoTimeUpdate, onVideoEnded } = useActivityCompletionGate({
    kind: "video",
    isAlreadyComplete,
  });

  const buildResumeState = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;

    return {
      resumeState: {
        kind: "video" as const,
        positionSeconds: Math.floor(video.currentTime),
        durationSeconds: Number.isFinite(video.duration)
          ? Math.round(video.duration)
          : undefined,
      },
    };
  }, []);

  const { persistCheckpoint } = useCheckpointSaver({
    enrollmentId,
    activityId,
    isAlreadyComplete,
    buildResumeState,
  });

  const persistCheckpointIfChanged = useCallback(
    async (force = false) => {
      const payload = buildResumeState();
      if (!payload) return;

      const position = payload.resumeState.positionSeconds;
      const lastSaved = lastSavedPositionRef.current;

      if (
        !force &&
        lastSaved != null &&
        Math.abs(position - lastSaved) < VIDEO_CHECKPOINT_MIN_DELTA_SECONDS
      ) {
        return;
      }

      lastSavedPositionRef.current = position;
      await persistCheckpoint();
    },
    [buildResumeState, persistCheckpoint],
  );

  useEffect(() => {
    onCanCompleteChange?.(canComplete);
  }, [canComplete, onCanCompleteChange]);

  useEffect(() => {
    if (isAlreadyComplete) return;

    const intervalId = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended) return;
      void persistCheckpointIfChanged();
    }, VIDEO_CHECKPOINT_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [activityId, isAlreadyComplete, persistCheckpointIfChanged]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || resumeState?.kind !== "video") return;
    if (resumeState.positionSeconds == null || resumeState.positionSeconds <= 0) return;

    const targetSeconds = resumeState.positionSeconds;
    lastSeekTargetRef.current = targetSeconds;
    lastSavedPositionRef.current = targetSeconds;

    const seekToResume = () => {
      if (lastSeekTargetRef.current !== targetSeconds) return;
      if (video.readyState < 1) return;

      const duration = Number.isFinite(video.duration) ? video.duration : null;
      const clampedTarget =
        duration != null && duration > 0
          ? Math.min(targetSeconds, Math.max(0, duration - 0.25))
          : targetSeconds;

      if (Math.abs(video.currentTime - clampedTarget) > 0.5) {
        isSeekingRef.current = true;
        video.currentTime = clampedTarget;
      }
    };

    const onSeeked = () => {
      isSeekingRef.current = false;
    };

    seekToResume();
    video.addEventListener("loadedmetadata", seekToResume);
    video.addEventListener("canplay", seekToResume);
    video.addEventListener("durationchange", seekToResume);
    video.addEventListener("seeked", onSeeked);

    return () => {
      video.removeEventListener("loadedmetadata", seekToResume);
      video.removeEventListener("canplay", seekToResume);
      video.removeEventListener("durationchange", seekToResume);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [activityId, fileUrl, resumeState]);

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
          key={activityId}
          ref={videoRef}
          src={fileUrl}
          title={title}
          controls
          preload="metadata"
          className={cn(
            "w-full",
            compact ? "max-h-full max-w-full object-contain" : "aspect-video",
          )}
          onSeeking={() => {
            isSeekingRef.current = true;
          }}
          onSeeked={() => {
            isSeekingRef.current = false;
          }}
          onTimeUpdate={(event) => {
            const target = event.currentTarget;
            onVideoTimeUpdate(target.currentTime, target.duration);
          }}
          onPause={() => {
            if (isSeekingRef.current) return;
            void persistCheckpointIfChanged(true);
          }}
          onEnded={() => {
            onVideoEnded();
            void persistCheckpointIfChanged(true);
          }}
        />
      </div>
    </div>
  );
}

type PdfMaterialViewProps = {
  fileUrl: string;
  title: string;
  resumeState: ResumeState | null;
  compact: boolean;
  className?: string;
  enrollmentId: string;
  activityId: string;
  isAlreadyComplete: boolean;
  onCanCompleteChange?: (canComplete: boolean) => void;
};

function PdfMaterialView({
  fileUrl,
  title,
  resumeState,
  compact,
  className,
  enrollmentId,
  activityId,
  isAlreadyComplete,
  onCanCompleteChange,
}: PdfMaterialViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<EmbeddedFrameProgress>({
    page: resolveInitialPdfPage(resumeState),
    scrollRatio: resolveInitialScrollRatio(resumeState),
  });
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isEmbedLoading, setIsEmbedLoading] = useState(true);

  const initialPage = resolveInitialPdfPage(resumeState);
  const initialScrollRatio = resolveInitialScrollRatio(resumeState);

  const { canComplete } = useActivityCompletionGate({
    kind: "pdf",
    isAlreadyComplete,
  });

  useEffect(() => {
    let cancelled = false;
    let revoke: (() => void) | undefined;

    setIsEmbedLoading(true);
    setEmbedUrl(null);

    void (async () => {
      try {
        const resolved = await resolvePdfEmbedUrl(fileUrl);
        if (cancelled) {
          resolved.revoke?.();
          return;
        }

        revoke = resolved.revoke;
        setEmbedUrl(resolved.embedUrl);
      } catch {
        if (!cancelled) {
          setEmbedUrl(fileUrl);
        }
      } finally {
        if (!cancelled) {
          setIsEmbedLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      revoke?.();
    };
  }, [activityId, fileUrl]);

  const buildResumeState = useCallback(() => {
    const live = readEmbeddedFrameProgress(iframeRef.current);
    const progress = live ?? progressRef.current;

    return {
      resumeState: {
        kind: "pdf" as const,
        page: progress.page,
        scrollRatio: progress.scrollRatio,
      },
    };
  }, []);

  const { scheduleCheckpoint } = useCheckpointSaver({
    enrollmentId,
    activityId,
    isAlreadyComplete,
    buildResumeState,
  });

  useEmbeddedFrameTracking({
    iframeRef,
    progressRef,
    enabled: !isAlreadyComplete && Boolean(embedUrl),
    onProgress: () => {},
    scheduleCheckpoint,
  });

  useEffect(() => {
    onCanCompleteChange?.(canComplete);
  }, [canComplete, onCanCompleteChange]);

  useEffect(() => {
    progressRef.current = {
      page: initialPage,
      scrollRatio: initialScrollRatio,
    };
  }, [activityId, fileUrl, initialPage, initialScrollRatio]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !embedUrl) return;

    const restore = () => {
      restoreEmbeddedFrameScroll(iframe, initialScrollRatio);
      const live = readEmbeddedFrameProgress(iframe);
      if (live) {
        progressRef.current = live;
      }
    };

    iframe.addEventListener("load", restore);
    return () => iframe.removeEventListener("load", restore);
  }, [activityId, embedUrl, initialScrollRatio]);

  if (isEmbedLoading || !embedUrl) {
    return (
      <div
        className={cn(
          compact ? "min-h-0 flex-1 animate-pulse rounded-xl bg-learn-surface-2" : "h-[min(70vh,720px)] animate-pulse rounded-xl bg-learn-surface-2",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        compact ? "flex min-h-0 flex-1 flex-col" : "space-y-3",
        className,
      )}
    >
      <iframe
        ref={iframeRef}
        src={buildPdfSrc(embedUrl, initialPage)}
        title={title}
        className={cn(
          "w-full rounded-xl bg-learn-surface",
          compact
            ? "min-h-0 flex-1"
            : "h-[min(70vh,720px)] border border-learn-border",
        )}
      />
    </div>
  );
}

type DocMaterialViewProps = {
  fileUrl: string;
  title: string;
  resumeState: ResumeState | null;
  compact: boolean;
  className?: string;
  enrollmentId: string;
  activityId: string;
  isAlreadyComplete: boolean;
  onCanCompleteChange?: (canComplete: boolean) => void;
};

function DocMaterialView({
  fileUrl,
  title,
  resumeState,
  compact,
  className,
  enrollmentId,
  activityId,
  isAlreadyComplete,
  onCanCompleteChange,
}: DocMaterialViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<EmbeddedFrameProgress>({
    page: 1,
    scrollRatio: resolveInitialScrollRatio(resumeState),
  });

  const { canComplete } = useActivityCompletionGate({
    kind: "doc",
    isAlreadyComplete,
  });

  const buildResumeState = useCallback(() => {
    const live = readEmbeddedFrameProgress(iframeRef.current);
    const progress = live ?? progressRef.current;

    return {
      resumeState: {
        kind: "doc" as const,
        scrollRatio: progress.scrollRatio,
      },
    };
  }, []);

  const { scheduleCheckpoint } = useCheckpointSaver({
    enrollmentId,
    activityId,
    isAlreadyComplete,
    buildResumeState,
  });

  const initialScrollRatio = resolveInitialScrollRatio(resumeState);

  useEmbeddedFrameTracking({
    iframeRef,
    progressRef,
    enabled: !isAlreadyComplete,
    onProgress: () => {},
    scheduleCheckpoint,
  });

  useEffect(() => {
    onCanCompleteChange?.(canComplete);
  }, [canComplete, onCanCompleteChange]);

  useEffect(() => {
    progressRef.current = {
      page: 1,
      scrollRatio: initialScrollRatio,
    };
  }, [activityId, fileUrl, initialScrollRatio]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const restore = () => {
      restoreEmbeddedFrameScroll(iframe, initialScrollRatio);
      const live = readEmbeddedFrameProgress(iframe);
      if (live) {
        progressRef.current = live;
      }
    };

    iframe.addEventListener("load", restore);
    return () => iframe.removeEventListener("load", restore);
  }, [activityId, fileUrl, initialScrollRatio]);

  return (
    <div
      className={cn(
        compact ? "flex min-h-0 flex-1 flex-col" : "space-y-3",
        className,
      )}
    >
      <iframe
        ref={iframeRef}
        src={fileUrl}
        title={title}
        className={cn(
          "w-full rounded-xl bg-learn-surface",
          compact
            ? "min-h-0 flex-1"
            : "h-[min(70vh,720px)] border border-learn-border",
        )}
      />
    </div>
  );
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

  const { data: materialResult, isLoading, hasError, retry } = useClientFetch({
    enabled: Boolean(materialMeta),
    fetcher: async () => getMaterialByActivityId(activity.id, enrollmentId),
    deps: [activity.id, enrollmentId, materialMeta?.id],
  });

  const fileUrl = materialResult?.data?.fileUrl ?? null;

  useEffect(() => {
    if (!materialMeta && !isAlreadyComplete) {
      onCanCompleteChange?.(true);
    }
  }, [materialMeta, isAlreadyComplete, onCanCompleteChange]);

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

  const sharedProps = {
    fileUrl,
    title: materialMeta.title,
    resumeState,
    compact,
    enrollmentId,
    activityId: activity.id,
    isAlreadyComplete,
    onCanCompleteChange,
    className,
  };

  if (materialKind === "video") {
    return <VideoMaterialView {...sharedProps} />;
  }

  if (materialKind === "pdf") {
    return <PdfMaterialView {...sharedProps} />;
  }

  return <DocMaterialView {...sharedProps} />;
}
