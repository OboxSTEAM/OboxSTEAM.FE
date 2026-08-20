"use client";

import { useMemo } from "react";

import { Slider } from "@/components/ui/slider";
import { formatHighlightTime } from "@/lib/portfolio/highlight-time";
import { cn } from "@/lib/utils";

export type HighlightTimelineMarker = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  label?: string;
};

type HighlightRangeTimelineProps = {
  durationSeconds: number;
  startSeconds: number;
  endSeconds: number;
  onChange: (range: { startSeconds: number; endSeconds: number }) => void;
  /** `exclude` = trim cut-out; `include` = segment keep/add. */
  mode?: "exclude" | "include";
  markers?: HighlightTimelineMarker[];
  onSeek?: (seconds: number) => void;
  disabled?: boolean;
  className?: string;
  step?: number;
};

function clampRange(
  start: number,
  end: number,
  max: number,
  minGap: number,
): { startSeconds: number; endSeconds: number } {
  const safeMax = Math.max(minGap, max);
  let nextStart = Math.min(Math.max(0, start), safeMax - minGap);
  let nextEnd = Math.min(Math.max(nextStart + minGap, end), safeMax);
  if (nextEnd - nextStart < minGap) {
    nextEnd = Math.min(safeMax, nextStart + minGap);
    nextStart = Math.max(0, nextEnd - minGap);
  }
  return { startSeconds: nextStart, endSeconds: nextEnd };
}

export function HighlightRangeTimeline({
  durationSeconds,
  startSeconds,
  endSeconds,
  onChange,
  mode = "include",
  markers = [],
  onSeek,
  disabled = false,
  className,
  step = 0.1,
}: HighlightRangeTimelineProps) {
  const max = Math.max(step, durationSeconds);
  const minGap = Math.min(0.5, max);
  const range = clampRange(startSeconds, endSeconds, max, minGap);
  const selectionLabel =
    mode === "exclude" ? "Khoảng loại bỏ" : "Khoảng chọn";

  const markerBands = useMemo(
    () =>
      markers
        .filter((marker) => marker.endSeconds > marker.startSeconds)
        .map((marker) => ({
          ...marker,
          leftPct: (marker.startSeconds / max) * 100,
          widthPct:
            ((marker.endSeconds - marker.startSeconds) / max) * 100,
        })),
    [markers, max],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2 text-[11px] font-medium tabular-nums text-muted-foreground">
        <span>
          {selectionLabel}: {formatHighlightTime(range.startSeconds)} →{" "}
          {formatHighlightTime(range.endSeconds)}
        </span>
        <span>
          {formatHighlightTime(range.endSeconds - range.startSeconds)} /{" "}
          {formatHighlightTime(max)}
        </span>
      </div>

      <div className="relative pt-4 pb-1">
        {markerBands.length > 0 ? (
          <div className="absolute inset-x-0 top-0 h-3">
            {markerBands.map((marker) => (
              <button
                key={marker.id}
                type="button"
                disabled={disabled}
                title={
                  marker.label ??
                  `${formatHighlightTime(marker.startSeconds)}–${formatHighlightTime(marker.endSeconds)}`
                }
                aria-label={
                  marker.label ??
                  `Gắn khoảng ${formatHighlightTime(marker.startSeconds)} đến ${formatHighlightTime(marker.endSeconds)}`
                }
                className={cn(
                  "absolute top-0 h-3 rounded-sm bg-[#7CB342]/55 ring-1 ring-[#7CB342]/40",
                  "hover:bg-[#7CB342]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]",
                  disabled && "pointer-events-none opacity-50",
                )}
                style={{
                  left: `${marker.leftPct}%`,
                  width: `${Math.max(marker.widthPct, 0.8)}%`,
                }}
                onClick={() => {
                  const next = clampRange(
                    marker.startSeconds,
                    marker.endSeconds,
                    max,
                    minGap,
                  );
                  onChange(next);
                  onSeek?.(next.startSeconds);
                }}
              />
            ))}
          </div>
        ) : null}

        <Slider
          min={0}
          max={max}
          step={step}
          disabled={disabled}
          value={[range.startSeconds, range.endSeconds]}
          onValueChange={(next) => {
            const values = Array.isArray(next) ? next : [next];
            const a = Number(values[0]);
            const b = Number(values[1] ?? values[0]);
            if (!Number.isFinite(a) || !Number.isFinite(b)) return;
            const start = Math.min(a, b);
            const end = Math.max(a, b);
            const clamped = clampRange(start, end, max, minGap);
            onChange(clamped);
            onSeek?.(clamped.startSeconds);
          }}
          className={cn(
            "**:data-[slot=slider-track]:h-2.5",
            mode === "exclude"
              ? "**:data-[slot=slider-range]:bg-primary/80"
              : "**:data-[slot=slider-range]:bg-[#0f7cad]",
            "**:data-[slot=slider-thumb]:size-4",
          )}
          aria-label={selectionLabel}
        />
      </div>

      {markerBands.length > 0 ? (
        <p className="text-[10px] text-muted-foreground">
          Thanh xanh lá = đoạn khuôn mặt — bấm để gắn khoảng chọn.
        </p>
      ) : null}
    </div>
  );
}
