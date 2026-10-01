"use client";

import { Fragment, useMemo } from "react";

import { MentionChip } from "@/components/advisory-chat/mention-chip";
import { mentionKey, parseMessageText } from "@/lib/advisory/mention-token";
import type { DiscussionReference } from "@/lib/api";
import { cn } from "@/lib/utils";

type MessageTextProps = {
  text: string;
  references?: DiscussionReference[];
  className?: string;
};

/** Message body with `@[Type:id]` tokens rendered as mention chips. */
export function MessageText({ text, references = [], className }: MessageTextProps) {
  const segments = useMemo(() => parseMessageText(text), [text]);
  const referencesByKey = useMemo(
    () =>
      new Map(
        references.map((reference) => [
          mentionKey(reference.targetType, reference.targetId),
          reference,
        ]),
      ),
    [references],
  );

  if (!text) return null;

  return (
    <p className={cn("text-sm leading-relaxed break-words whitespace-pre-wrap", className)}>
      {segments.map((segment, index) =>
        segment.kind === "text" ? (
          <Fragment key={index}>{segment.text}</Fragment>
        ) : (
          <MentionChip
            key={index}
            token={{ targetType: segment.targetType, targetId: segment.targetId }}
            reference={referencesByKey.get(mentionKey(segment.targetType, segment.targetId))}
          />
        ),
      )}
    </p>
  );
}
