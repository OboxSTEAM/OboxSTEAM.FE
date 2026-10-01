"use client";

import { useMemo, useState } from "react";

import { diffText, type TextDiffSegment } from "@/lib/diff/text-diff";

/** Inline word diff for long text; unchanged runs collapse and expand on click. */
export function TextChange({ before, after }: { before: string; after: string }) {
  const segments = useMemo(() => diffText(before, after), [before, after]);
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(() => new Set());

  if (segments.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Trống</p>;
  }

  return (
    <p className="rounded-md bg-muted/40 px-2.5 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words text-foreground">
      {segments.map((segment, index) => (
        <DiffSegment
          key={index}
          segment={segment}
          isExpanded={expanded.has(index)}
          onExpand={() => setExpanded((prev) => new Set(prev).add(index))}
        />
      ))}
    </p>
  );
}

function DiffSegment({
  segment,
  isExpanded,
  onExpand,
}: {
  segment: TextDiffSegment;
  isExpanded: boolean;
  onExpand: () => void;
}) {
  switch (segment.kind) {
    case "added":
      return (
        <ins className="rounded-sm bg-emerald-500/15 text-emerald-800 no-underline dark:text-emerald-300">
          {segment.text}
        </ins>
      );
    case "removed":
      return (
        <del className="rounded-sm bg-destructive/10 text-destructive line-through decoration-destructive/60">
          {segment.text}
        </del>
      );
    case "collapsed":
      return isExpanded ? (
        <span className="text-muted-foreground">{segment.text}</span>
      ) : (
        <button
          type="button"
          onClick={onExpand}
          className="mx-0.5 rounded bg-muted px-1.5 py-0.5 align-baseline text-[11px] text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          … {segment.text.length.toLocaleString("vi-VN")} ký tự không đổi
        </button>
      );
    default:
      return <span className="text-muted-foreground">{segment.text}</span>;
  }
}
