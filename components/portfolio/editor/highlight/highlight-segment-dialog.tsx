"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { VideoThumb } from "@/components/media/video-thumb";
import {
  HighlightRangeTimeline,
  type HighlightTimelineMarker,
} from "@/components/portfolio/editor/highlight/highlight-range-timeline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HighlightSourceMedia } from "@/lib/api";
import {
  formatHighlightTime,
  msToSeconds,
} from "@/lib/portfolio/highlight-time";
import { cn } from "@/lib/utils";

type HighlightSegmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceMedia: HighlightSourceMedia[];
  isLoadingSourceMedia?: boolean;
  isSubmitting?: boolean;
  onSubmit: (payload: {
    mediaId: string;
    startSeconds: number;
    endSeconds: number;
    description: string;
  }) => void;
};

export function HighlightSegmentDialog({
  open,
  onOpenChange,
  sourceMedia,
  isLoadingSourceMedia = false,
  isSubmitting = false,
  onSubmit,
}: HighlightSegmentDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaId, setMediaId] = useState("");
  const [startSeconds, setStartSeconds] = useState(0);
  const [endSeconds, setEndSeconds] = useState(5);
  const [description, setDescription] = useState("");

  const selected = useMemo(
    () => sourceMedia.find((item) => item.mediaId === mediaId) ?? null,
    [sourceMedia, mediaId],
  );

  const durationSeconds = msToSeconds(selected?.durationMs);
  const max = Math.max(1, durationSeconds || 1);

  const markers: HighlightTimelineMarker[] = useMemo(
    () =>
      (selected?.faceSegments ?? []).map((segment, index) => ({
        id: `${selected?.mediaId ?? "media"}-face-${index}`,
        startSeconds: msToSeconds(segment.startMs),
        endSeconds: msToSeconds(segment.endMs),
        label: `Đoạn mặt ${index + 1}`,
      })),
    [selected],
  );

  useEffect(() => {
    if (!open) return;
    setDescription("");
    const first = sourceMedia[0];
    if (first) {
      setMediaId(first.mediaId);
    } else {
      setMediaId("");
    }
  }, [open, sourceMedia]);

  useEffect(() => {
    if (!selected) return;
    const dur = Math.max(1, msToSeconds(selected.durationMs) || 1);
    const firstFace = selected.faceSegments[0];
    if (firstFace) {
      const start = msToSeconds(firstFace.startMs);
      const end = Math.max(start + 0.5, msToSeconds(firstFace.endMs));
      setStartSeconds(start);
      setEndSeconds(Math.min(dur, end));
    } else {
      setStartSeconds(0);
      setEndSeconds(Math.min(5, dur));
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }, [selected]);

  const seekTo = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, seconds), max);
  };

  const canSubmit =
    Boolean(mediaId) && endSeconds > startSeconds && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-xl gap-3">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>Thêm đoạn từ video nguồn</DialogTitle>
          <DialogDescription>
            Chọn video đã gắn thẻ khuôn mặt, rồi kéo khoảng thời gian để chèn vào
            highlight.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Video nguồn
          </p>
          {isLoadingSourceMedia ? (
            <p className="text-xs text-muted-foreground">Đang tải…</p>
          ) : sourceMedia.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              Chưa có video đã tag khuôn mặt cho stack này.
            </p>
          ) : (
            <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {sourceMedia.map((item) => {
                const dur = msToSeconds(item.durationMs);
                const selectedCard = item.mediaId === mediaId;
                const segCount = item.faceSegments.length;
                return (
                  <div
                    key={item.mediaId}
                    className={cn(
                      "rounded-xl border p-1.5 text-left transition",
                      selectedCard
                        ? "border-[#4FC3F7] bg-[#4FC3F7]/10"
                        : "border-border bg-card",
                      !item.fileUrl && "opacity-60",
                    )}
                  >
                    {item.fileUrl ? (
                      <VideoThumb
                        src={item.fileUrl}
                        selected={selectedCard}
                        disabled={isSubmitting || !item.fileUrl}
                        className="w-full rounded-lg"
                        aria-label={`Chọn video · ${segCount} đoạn mặt`}
                        onClick={() => setMediaId(item.mediaId)}
                      />
                    ) : (
                      <div className="aspect-video rounded-lg bg-muted" />
                    )}
                    <div className="mt-1.5 space-y-0.5 px-0.5">
                      <p className="text-[11px] font-semibold tabular-nums text-foreground">
                        {dur > 0 ? formatHighlightTime(dur) : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {segCount} đoạn mặt
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selected?.fileUrl ? (
          <>
            <div className="overflow-hidden rounded-xl bg-black ring-1 ring-border">
              <video
                ref={videoRef}
                key={selected.mediaId}
                src={selected.fileUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full"
              />
            </div>

            <HighlightRangeTimeline
              mode="include"
              durationSeconds={max}
              startSeconds={startSeconds}
              endSeconds={endSeconds}
              markers={markers}
              disabled={isSubmitting}
              onSeek={seekTo}
              onChange={({ startSeconds: nextStart, endSeconds: nextEnd }) => {
                setStartSeconds(nextStart);
                setEndSeconds(nextEnd);
              }}
            />
          </>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="highlight-segment-desc" className="text-[11px]">
            Mô tả (tuỳ chọn)
          </Label>
          <Input
            id="highlight-segment-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="h-9 rounded-xl"
            placeholder="VD: đoạn thuyết trình"
            disabled={isSubmitting}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={!canSubmit}
            onClick={() => {
              if (!mediaId) return;
              onSubmit({
                mediaId,
                startSeconds,
                endSeconds,
                description: description.trim(),
              });
            }}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Thêm đoạn
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
