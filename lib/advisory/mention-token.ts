import { z } from "zod";

import {
  curriculumTargetTypeSchema,
  type CurriculumTargetType,
} from "@/lib/api/advisory-chat/schemas";

/** Component reference embedded in message text as `@[Type:uuid]`. */
export const mentionTokenSchema = z.object({
  targetType: curriculumTargetTypeSchema,
  targetId: z.string().uuid(),
});

export type MentionToken = z.infer<typeof mentionTokenSchema>;

export type MessageSegment =
  | { kind: "text"; text: string }
  | ({ kind: "mention"; raw: string } & MentionToken);

export const MENTION_TARGET_TYPE_LABELS: Record<CurriculumTargetType, string> = {
  Program: "Chương trình",
  Module: "Module",
  Course: "Khóa học",
  Activity: "Hoạt động",
  Assignment: "Bài tập",
  ResearchMilestone: "Mốc nghiên cứu",
  Material: "Tài liệu",
};

const MENTION_TOKEN_SOURCE = `@\\[(${curriculumTargetTypeSchema.options.join("|")}):([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\\]`;

/** Fresh global regex per call — shared `/g` instances carry `lastIndex` state. */
function mentionTokenRegex(): RegExp {
  return new RegExp(MENTION_TOKEN_SOURCE, "g");
}

/** Stable map key for a component: `Type:id` (id lowercased). */
export function mentionKey(targetType: CurriculumTargetType, targetId: string): string {
  return `${targetType}:${targetId.toLowerCase()}`;
}

export function serializeMention(token: MentionToken): string {
  return `@[${token.targetType}:${token.targetId}]`;
}

/** Split message text into plain text and mention segments, in order. */
export function parseMessageText(text: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(mentionTokenRegex())) {
    const parsed = mentionTokenSchema.safeParse({
      targetType: match[1],
      targetId: match[2],
    });
    if (!parsed.success) continue;

    if (match.index > lastIndex) {
      segments.push({ kind: "text", text: text.slice(lastIndex, match.index) });
    }
    segments.push({ kind: "mention", raw: match[0], ...parsed.data });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", text: text.slice(lastIndex) });
  }
  return segments;
}

/** Distinct mentioned components, in first-appearance order. */
export function extractMentions(text: string): MentionToken[] {
  const seen = new Set<string>();
  const mentions: MentionToken[] = [];
  for (const segment of parseMessageText(text)) {
    if (segment.kind !== "mention") continue;
    const key = mentionKey(segment.targetType, segment.targetId);
    if (seen.has(key)) continue;
    seen.add(key);
    mentions.push({ targetType: segment.targetType, targetId: segment.targetId });
  }
  return mentions;
}
