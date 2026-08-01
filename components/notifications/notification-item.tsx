"use client";

import type { Notification } from "@/lib/api/entities/notification";
import { parseApiDateTime } from "@/lib/api/datetime";
import { formatRelativeTime } from "@/lib/classes/session-helpers";
import { cn } from "@/lib/utils";

function formatCreatedAt(value: string): string {
  const date = parseApiDateTime(value);
  if (!date) return value;
  return formatRelativeTime(date.toISOString());
}

export function NotificationItem({
  notification,
  onSelect,
}: {
  notification: Notification;
  onSelect: (notification: Notification) => void;
}) {
  const isUnread = notification.readAt == null;
  const title = notification.title?.trim() || "Thông báo";
  const body = notification.body?.trim();

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        "flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left transition-colors",
        "hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isUnread && "bg-primary/5",
      )}
    >
      <div className="flex items-start gap-2">
        {isUnread ? (
          <span
            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
            aria-hidden
          />
        ) : (
          <span className="mt-1.5 size-1.5 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm text-foreground",
              isUnread ? "font-semibold" : "font-medium",
            )}
          >
            {title}
          </p>
          {body ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {body}
            </p>
          ) : null}
          <p className="mt-1 text-[11px] text-muted-foreground/80">
            {formatCreatedAt(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}
