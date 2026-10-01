import { diffWordsWithSpace } from "diff";

export type TextDiffSegment =
  | { kind: "equal" | "added" | "removed"; text: string }
  /** Unchanged run hidden between changes; `text` is the full hidden content. */
  | { kind: "collapsed"; text: string };

type TextDiffOptions = {
  /** Unchanged characters kept on each side of a change. */
  contextChars?: number;
};

const DEFAULT_CONTEXT_CHARS = 80;
/** Bounds the Myers search so pathological rewrites can't freeze the UI. */
const MAX_EDIT_LENGTH = 1500;

/** Word-level diff of two plain-text values with long unchanged runs collapsed. */
export function diffText(
  before: string,
  after: string,
  options: TextDiffOptions = {},
): TextDiffSegment[] {
  const contextChars = options.contextChars ?? DEFAULT_CONTEXT_CHARS;
  if (before === after) return before ? [{ kind: "equal", text: before }] : [];

  const changes = diffWordsWithSpace(before, after, { maxEditLength: MAX_EDIT_LENGTH });
  if (!changes) {
    return [
      ...(before ? [{ kind: "removed" as const, text: before }] : []),
      ...(after ? [{ kind: "added" as const, text: after }] : []),
    ];
  }

  const segments: TextDiffSegment[] = changes.map((change) => ({
    kind: change.added ? "added" : change.removed ? "removed" : "equal",
    text: change.value,
  }));
  return collapseUnchanged(segments, contextChars);
}

/** `true` when the diff only has whitespace-level changes. */
export function isWhitespaceOnlyDiff(segments: TextDiffSegment[]): boolean {
  return segments.every(
    (segment) =>
      segment.kind === "equal" || segment.kind === "collapsed" || segment.text.trim() === "",
  );
}

function collapseUnchanged(segments: TextDiffSegment[], contextChars: number): TextDiffSegment[] {
  const result: TextDiffSegment[] = [];
  const lastIndex = segments.length - 1;

  segments.forEach((segment, index) => {
    if (segment.kind !== "equal") {
      result.push(segment);
      return;
    }
    const isFirst = index === 0;
    const isLast = index === lastIndex;
    const keepHead = isFirst ? 0 : contextChars;
    const keepTail = isLast ? 0 : contextChars;
    const minHidden = 40;

    if (segment.text.length <= keepHead + keepTail + minHidden) {
      result.push(segment);
      return;
    }

    const headEnd = keepHead > 0 ? wordBoundaryAfter(segment.text, keepHead) : 0;
    const tailStart =
      keepTail > 0 ? wordBoundaryBefore(segment.text, segment.text.length - keepTail) : segment.text.length;
    if (tailStart - headEnd < minHidden) {
      result.push(segment);
      return;
    }

    if (headEnd > 0) result.push({ kind: "equal", text: segment.text.slice(0, headEnd) });
    result.push({ kind: "collapsed", text: segment.text.slice(headEnd, tailStart) });
    if (tailStart < segment.text.length) {
      result.push({ kind: "equal", text: segment.text.slice(tailStart) });
    }
  });

  return result;
}

function wordBoundaryAfter(text: string, index: number): number {
  const match = /\s/.exec(text.slice(index));
  return match ? index + match.index : text.length;
}

function wordBoundaryBefore(text: string, index: number): number {
  const slice = text.slice(0, index);
  const lastSpace = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("\n"));
  return lastSpace > 0 ? lastSpace + 1 : index;
}
