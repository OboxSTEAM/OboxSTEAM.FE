"use client";

import type { Notification } from "@/lib/api/entities/notification";
import { parseApiDateTime } from "@/lib/api/datetime";
import { formatRelativeTime } from "@/lib/classes/session-helpers";
import { getNotificationActorName } from "@/lib/notifications/display";
import { getNotificationTypeStyle } from "@/lib/notifications/type-style";
import { cn } from "@/lib/utils";

function formatCreatedAt(value: string): string {
  const date = parseApiDateTime(value);
  if (!date) return value;
  return formatRelativeTime(date.toISOString());
}

export function NotificationItem({
  notification,
  onSelect,
  variant = "compact",
}: {
  notification: Notification;
  onSelect: (notification: Notification) => void;
  variant?: "compact" | "page";
}) {
  const isUnread = notification.readAt == null;
  const title = notification.title?.trim() || "Thông báo";
  const body = notification.body?.trim();
  const actorName = getNotificationActorName(notification);
  const { icon: Icon, wrapClassName } = getNotificationTypeStyle(
    notification.type,
  );
  const isPage = variant === "page";

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        "flex w-full gap-3 text-left transition-colors",
        "hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isPage
          ? "rounded-xl px-3 py-3 sm:px-4"
          : "rounded-md px-2.5 py-2",
        isUnread && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
          wrapClassName,
        )}
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
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
                "text-sm text-foreground",
                isPage ? "line-clamp-2" : "truncate",
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
              {actorName ? `Từ ${actorName} · ` : null}
              {formatCreatedAt(notification.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
