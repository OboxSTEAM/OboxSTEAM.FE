"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { NotificationPopoverPanel } from "@/components/notifications/notification-popover";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export type NotificationBellProps = {
  className?: string;
  /** Extra classes for the trigger button (e.g. SiteHeader solid vs transparent). */
  triggerClassName?: string;
};

export function NotificationBell({
  className,
  triggerClassName,
}: NotificationBellProps) {
  const { unreadCount, refreshIfStale } = useNotifications();
  const [open, setOpen] = useState(false);
  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className={cn("relative", className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) void refreshIfStale();
        }}
      >
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "relative size-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground",
                triggerClassName,
              )}
              aria-label={
                unreadCount > 0
                  ? `Thông báo (${unreadCount} chưa đọc)`
                  : "Thông báo"
              }
            />
          }
        >
          <Bell className="size-5" />
          {badgeLabel ? (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground",
                unreadCount > 9 ? "h-4" : "size-4",
              )}
            >
              {badgeLabel}
            </span>
          ) : null}
        </PopoverTrigger>
        <NotificationPopoverPanel onNavigate={() => setOpen(false)} />
      </Popover>
    </div>
  );
}
