"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Scissors } from "lucide-react";

import { HighlightRangeTimeline } from "@/components/portfolio/editor/highlight/highlight-range-timeline";
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
import { formatHighlightTime } from "@/lib/portfolio/highlight-time";

type HighlightTrimDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  durationSeconds: number;
  isSubmitting?: boolean;
  onSubmit: (payload: {
    startSeconds: number;
    endSeconds: number;
    description: string;
  }) => void;
};

export function HighlightTrimDialog({
  open,
  onOpenChange,
  videoUrl,
  durationSeconds,
  isSubmitting = false,
  onSubmit,
}: HighlightTrimDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const max = Math.max(1, durationSeconds);
  const defaultEnd = Math.min(5, max);

  const [startSeconds, setStartSeconds] = useState(0);
  const [endSeconds, setEndSeconds] = useState(defaultEnd);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setStartSeconds(0);
    setEndSeconds(Math.min(5, Math.max(1, durationSeconds)));
    setDescription("");
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }, [open, durationSeconds, videoUrl]);

  const seekTo = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, seconds), max);
  };

  const canSubmit = endSeconds > startSeconds && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg gap-3">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>Cắt highlight</DialogTitle>
          <DialogDescription>
            Kéo hai đầu thanh thời gian để chọn khoảng cần loại bỏ (
            {formatHighlightTime(durationSeconds)} tổng).
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl bg-black ring-1 ring-border">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full"
          />
        </div>

        <HighlightRangeTimeline
          mode="exclude"
          durationSeconds={max}
          startSeconds={startSeconds}
          endSeconds={endSeconds}
          disabled={isSubmitting}
          onSeek={seekTo}
          onChange={({ startSeconds: nextStart, endSeconds: nextEnd }) => {
            setStartSeconds(nextStart);
            setEndSeconds(nextEnd);
          }}
        />

        <div className="space-y-1.5">
          <Label htmlFor="highlight-trim-desc" className="text-[11px]">
            Ghi chú (tuỳ chọn)
          </Label>
          <Input
            id="highlight-trim-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="h-9 rounded-xl"
            placeholder="VD: bỏ đoạn mở đầu dài"
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
            onClick={() =>
              onSubmit({
                startSeconds,
                endSeconds,
                description: description.trim(),
              })
            }
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Scissors className="size-4" />
            )}
            Áp dụng cắt
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
