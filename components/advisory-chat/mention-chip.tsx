"use client";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { MENTION_TARGET_TYPE_LABELS, type MentionToken } from "@/lib/advisory/mention-token";
import type { DiscussionReference } from "@/lib/api";
import { cn } from "@/lib/utils";

type MentionChipProps = {
  token: MentionToken;
  /** Server snapshot — label fallback once the component is deleted. */
  reference?: DiscussionReference | null;
  className?: string;
};

/** Clickable `@component` chip; struck through when the component no longer exists. */
export function MentionChip({ token, reference, className }: MentionChipProps) {
  const { mentions, navigateToMention } = useAdvisoryChat();
  const target = mentions.getTarget(token.targetType, token.targetId);
  const typeLabel = MENTION_TARGET_TYPE_LABELS[token.targetType];

  const isResolving = !target && mentions.isLoading;
  const isUnavailable = !isResolving && (!target || reference?.isAvailable === false);
  const label =
    target?.label ?? reference?.capturedLabel ?? (isResolving ? typeLabel : "Mục đã xoá");
  const path = target?.path.map((segment) => segment.label).join(" › ");
  const title = isUnavailable
    ? (reference?.unavailableReason ?? "Mục này không còn trong chương trình.")
    : path
      ? `${typeLabel} · ${path} › ${label}`
      : `${typeLabel} · ${label}`;

  return (
    <button
      type="button"
      title={title}
      aria-label={`${typeLabel}: ${label}${isUnavailable ? " (không còn tồn tại)" : ""}`}
      disabled={isUnavailable || isResolving}
      onClick={() => navigateToMention(token)}
      className={cn(
        "inline-flex max-w-full items-baseline rounded-md px-1 py-px align-baseline text-[0.8125rem] font-medium transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isUnavailable
          ? "cursor-not-allowed bg-muted text-muted-foreground line-through"
          : "bg-accent/15 text-foreground hover:bg-accent/25 disabled:cursor-progress",
        className,
      )}
    >
      <span className="truncate">@{label}</span>
    </button>
  );
}
