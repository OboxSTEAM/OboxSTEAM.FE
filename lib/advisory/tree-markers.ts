import { curriculumAnchorFor } from "@/lib/advisory/mention-navigation";
import type {
  CurriculumChangeItem,
  CurriculumChangeKind,
  CurriculumTargetType,
  MentionCount,
  MentionTarget,
} from "@/lib/api/advisory-chat/schemas";

export type TreeDiscussionCount = {
  /** Messages mentioning this component or anything under it. */
  messageCount: number;
  openPinCount: number;
  /** Part of the totals that mentions this exact component (not its children). */
  ownMessageCount: number;
  ownOpenPinCount: number;
};

const EMPTY_COUNT: TreeDiscussionCount = {
  messageCount: 0,
  openPinCount: 0,
  ownMessageCount: 0,
  ownOpenPinCount: 0,
};

/** Keyed by `data-curriculum-anchor` value (`module:{id}`, `activity:{id}`, …). */
export type TreeDiscussionCounts = ReadonlyMap<string, TreeDiscussionCount>;
export type TreeChangeMarkers = ReadonlyMap<string, CurriculumChangeKind>;

type TargetLookup = (
  targetType: CurriculumTargetType,
  targetId: string,
) => MentionTarget | undefined;

/**
 * Tree badge totals. Mention counts are exact per component, so each count is also
 * added to its module, course and activity rows; the program row keeps its own
 * count only, otherwise it would repeat the whole discussion.
 */
export function buildTreeDiscussionCounts(
  counts: readonly MentionCount[],
  getTarget: TargetLookup,
): TreeDiscussionCounts {
  const totals = new Map<string, TreeDiscussionCount>();

  const add = (key: string, item: MentionCount, isOwn = false) => {
    const current = totals.get(key) ?? EMPTY_COUNT;
    totals.set(key, {
      messageCount: current.messageCount + item.messageCount,
      openPinCount: current.openPinCount + item.openPinCount,
      ownMessageCount: current.ownMessageCount + (isOwn ? item.messageCount : 0),
      ownOpenPinCount: current.ownOpenPinCount + (isOwn ? item.openPinCount : 0),
    });
  };

  for (const item of counts) {
    if (item.messageCount === 0 && item.openPinCount === 0) continue;
    add(curriculumAnchorFor(item), item, true);

    const target = getTarget(item.targetType, item.targetId);
    if (!target) continue;
    if (target.moduleId && item.targetType !== "Module") add(`module:${target.moduleId}`, item);
    if (target.courseId && item.targetType !== "Course") add(`course:${target.courseId}`, item);
    if (target.activityId && item.targetType !== "Activity") {
      add(`activity:${target.activityId}`, item);
    }
  }
  return totals;
}

/** Exact count for one component (detail header), without the roll-up. */
export function findMentionCount(
  counts: readonly MentionCount[],
  targetType: CurriculumTargetType,
  targetId: string,
): TreeDiscussionCount {
  const id = targetId.toLowerCase();
  const match = counts.find(
    (item) => item.targetType === targetType && item.targetId.toLowerCase() === id,
  );
  const messageCount = match?.messageCount ?? 0;
  const openPinCount = match?.openPinCount ?? 0;
  return { messageCount, openPinCount, ownMessageCount: messageCount, ownOpenPinCount: openPinCount };
}

/**
 * Unseen changes for rows still in the tree (deleted components have no row).
 * The server already excludes the viewer's own edits from `isUnseen`.
 */
export function buildTreeChangeMarkers(items: readonly CurriculumChangeItem[]): TreeChangeMarkers {
  const markers = new Map<string, CurriculumChangeKind>();
  for (const item of items) {
    if (!item.isUnseen || item.changeKind === "Deleted") continue;
    markers.set(curriculumAnchorFor(item), item.changeKind);
  }
  return markers;
}
