"use client";

import type { HighlightSourceClip } from "@/lib/api";
import {
  formatHighlightTime,
  msToSeconds,
} from "@/lib/portfolio/highlight-time";
import { cn } from "@/lib/utils";

type HighlightSourceClipsStripProps = {
  clips: HighlightSourceClip[];
  className?: string;
};

function clipSpanSeconds(clip: HighlightSourceClip): {
  start: number;
  end: number;
} {
  const segments = clip.segments;
  if (segments.length === 0) return { start: 0, end: 0 };
  const starts = segments.map((segment) => segment.startMs);
  const ends = segments.map((segment) =>
    segment.endMs == null ? segment.startMs : segment.endMs,
  );
  return {
    start: msToSeconds(Math.min(...starts)),
    end: msToSeconds(Math.max(...ends)),
  };
}

/** Compact source-clip / segment visibility for a completed highlight item. */
export function HighlightSourceClipsStrip({
  clips,
  className,
}: HighlightSourceClipsStripProps) {
  const usable = clips.filter((clip) => clip.segments.length > 0);
  if (usable.length === 0) return null;

  const globalEnd = Math.max(
    ...usable.map((clip) => clipSpanSeconds(clip).end),
    0.1,
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Nguồn dựng
        </p>
        <p className="text-[10px] tabular-nums text-muted-foreground">
          {usable.length} clip ·{" "}
          {usable.reduce((sum, clip) => sum + clip.segments.length, 0)} đoạn
        </p>
      </div>

      <ul className="space-y-2">
        {usable.map((clip, clipIndex) => {
          const span = clipSpanSeconds(clip);
          const title =
            clip.activityName?.trim() || `Clip ${clipIndex + 1}`;
          return (
            <li
              key={`${clip.mediaId}-${clipIndex}`}
              className="rounded-xl border border-border bg-white/80 px-2.5 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-[11px] font-semibold text-foreground">
                  {title}
                </p>
                <p className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {formatHighlightTime(span.start)}–{formatHighlightTime(span.end)}
                </p>
              </div>
              <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-[#E5E5E0]">
                {clip.segments.map((segment, segmentIndex) => {
                  const start = msToSeconds(segment.startMs);
                  const end = msToSeconds(
                    segment.endMs == null ? segment.startMs : segment.endMs,
                  );
                  const left = (start / globalEnd) * 100;
                  const width = (Math.max(end - start, 0.05) / globalEnd) * 100;
                  return (
                    <span
                      key={`${clip.mediaId}-seg-${segmentIndex}`}
                      title={`${formatHighlightTime(start)}–${formatHighlightTime(end)}`}
                      className="absolute inset-y-0 rounded-full bg-[#0f7cad]"
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(width, 1.2)}%`,
                      }}
                    />
                  );
                })}
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                {clip.segments.length} đoạn · media{" "}
                <span className="font-mono tabular-nums">
                  {clip.mediaId.slice(0, 8)}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
