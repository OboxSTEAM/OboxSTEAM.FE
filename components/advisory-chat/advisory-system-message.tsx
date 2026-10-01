"use client";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { describeSystemMessage } from "@/lib/advisory/system-message";
import type { DiscussionMessage } from "@/lib/api";
import { formatRelativeTime } from "@/lib/classes/session-helpers";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  warning: "bg-amber-500/12 text-amber-900 dark:text-amber-300",
} as const;

/** Centered event row (curriculum updates, approval changes, publish, advisor change). */
export function AdvisorySystemMessage({ message }: { message: DiscussionMessage }) {
  const { hasChangesView, openChanges } = useAdvisoryChat();
  const view = describeSystemMessage(message);
  const versionRange = view.versionRange;

  return (
    <div className="flex justify-center px-2 py-1">
      <div
        className={cn(
          "max-w-[95%] rounded-xl px-3 py-1.5 text-center text-xs leading-relaxed",
          TONE_CLASSES[view.tone],
        )}
      >
        <p>
          {view.text}{" "}
          <time dateTime={message.createdAt} className="whitespace-nowrap opacity-70">
            · {formatRelativeTime(message.createdAt)}
          </time>
        </p>
        {view.detail ? <p className="mt-0.5 italic">“{view.detail}”</p> : null}
        {hasChangesView && versionRange ? (
          <button
            type="button"
            onClick={() => openChanges(versionRange)}
            className="mt-0.5 inline-flex min-h-6 items-center font-semibold text-foreground underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Xem thay đổi
          </button>
        ) : null}
      </div>
    </div>
  );
}
