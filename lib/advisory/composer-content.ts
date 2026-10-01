import type { JSONContent } from "@tiptap/react";

import {
  mentionTokenSchema,
  parseMessageText,
  type MentionToken,
} from "@/lib/advisory/mention-token";

/** TipTap mention node `id` — `Type:uuid`, rendered to text as `@[Type:uuid]`. */
export function encodeMentionNodeId(token: MentionToken): string {
  return `${token.targetType}:${token.targetId}`;
}

export function decodeMentionNodeId(id: string | null | undefined): MentionToken | null {
  if (!id) return null;
  const separator = id.indexOf(":");
  if (separator < 0) return null;
  const parsed = mentionTokenSchema.safeParse({
    targetType: id.slice(0, separator),
    targetId: id.slice(separator + 1),
  });
  return parsed.success ? parsed.data : null;
}

/** Composer doc for an existing message (edit mode); one paragraph per line. */
export function messageTextToDoc(
  text: string,
  resolveLabel: (token: MentionToken) => string,
): JSONContent {
  const paragraphs = text.split("\n").map((line): JSONContent => {
    const content: JSONContent[] = [];
    for (const segment of parseMessageText(line)) {
      if (segment.kind === "text") {
        if (segment.text) content.push({ type: "text", text: segment.text });
        continue;
      }
      const token = { targetType: segment.targetType, targetId: segment.targetId };
      content.push({
        type: "mention",
        attrs: { id: encodeMentionNodeId(token), label: resolveLabel(token) },
      });
    }
    return content.length > 0 ? { type: "paragraph", content } : { type: "paragraph" };
  });

  return { type: "doc", content: paragraphs };
}
