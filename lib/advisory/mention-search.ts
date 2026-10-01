import type { CurriculumTargetType, MentionTarget } from "@/lib/api/advisory-chat/schemas";
import { MENTION_TARGET_TYPE_LABELS } from "@/lib/advisory/mention-token";
import { foldQueryTokens, foldVietnamese } from "@/lib/search/fold-text";

export const DEFAULT_MENTION_SEARCH_LIMIT = 20;

/** Picker group order — top-down through the curriculum tree. */
export const MENTION_GROUP_ORDER: readonly CurriculumTargetType[] = [
  "Program",
  "Module",
  "Course",
  "Activity",
  "Assignment",
  "ResearchMilestone",
  "Material",
];

export type MentionSearchEntry = {
  target: MentionTarget;
  /** Tree order from the API — the final tie-breaker. */
  order: number;
  foldedLabel: string;
  foldedCode: string;
  /** Label + code. */
  foldedName: string;
  /** Breadcrumb path + label + code. */
  foldedFull: string;
};

export type MentionResultGroup = {
  targetType: CurriculumTargetType;
  label: string;
  items: MentionTarget[];
};

/** Pre-fold labels, codes and breadcrumb paths once per target list. */
export function buildMentionSearchIndex(targets: MentionTarget[]): MentionSearchEntry[] {
  return targets.map((target, order) => {
    const foldedLabel = foldVietnamese(target.label);
    const foldedCode = foldVietnamese(target.code ?? "");
    const foldedPath = foldVietnamese(target.path.map((segment) => segment.label).join(" "));
    const foldedName = `${foldedLabel} ${foldedCode}`.trim();
    return {
      target,
      order,
      foldedLabel,
      foldedCode,
      foldedName,
      foldedFull: `${foldedPath} ${foldedName}`.trim(),
    };
  });
}

/**
 * Rank: label/code prefix → all tokens in label/code → all tokens incl. breadcrumb
 * path; ties keep tree order. Blank query returns the first `limit` in tree order.
 */
export function searchMentionTargets(
  entries: MentionSearchEntry[],
  query: string,
  limit = DEFAULT_MENTION_SEARCH_LIMIT,
): MentionTarget[] {
  const tokens = foldQueryTokens(query);
  if (tokens.length === 0) {
    return entries.slice(0, limit).map((entry) => entry.target);
  }

  const phrase = tokens.join(" ");
  const ranked: { entry: MentionSearchEntry; rank: number }[] = [];

  for (const entry of entries) {
    const rank = rankEntry(entry, phrase, tokens);
    if (rank !== null) ranked.push({ entry, rank });
  }

  ranked.sort((a, b) => a.rank - b.rank || a.entry.order - b.entry.order);
  return ranked.slice(0, limit).map(({ entry }) => entry.target);
}

/** Group ranked results by type in `MENTION_GROUP_ORDER`, keeping rank order inside. */
export function groupMentionResults(results: MentionTarget[]): MentionResultGroup[] {
  const byType = new Map<CurriculumTargetType, MentionTarget[]>();
  for (const target of results) {
    const bucket = byType.get(target.targetType) ?? [];
    bucket.push(target);
    byType.set(target.targetType, bucket);
  }

  return MENTION_GROUP_ORDER.flatMap((targetType) => {
    const items = byType.get(targetType);
    return items?.length
      ? [{ targetType, label: MENTION_TARGET_TYPE_LABELS[targetType], items }]
      : [];
  });
}

function rankEntry(
  entry: MentionSearchEntry,
  phrase: string,
  tokens: string[],
): number | null {
  if (entry.foldedLabel.startsWith(phrase) || entry.foldedCode.startsWith(phrase)) {
    return 0;
  }
  if (tokens.every((token) => entry.foldedName.includes(token))) return 1;
  if (tokens.every((token) => entry.foldedFull.includes(token))) return 2;
  return null;
}
