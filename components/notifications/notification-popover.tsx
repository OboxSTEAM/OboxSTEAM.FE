"use client";

import { useEffect, useRef } from "react";

import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import {
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function NotificationPopoverPanel({
  className,
  onNavigate,
}: {
  className?: string;
  /** Called when an inbox item is opened (e.g. close the popover). */
  onNavigate?: () => void;
}) {
  const {
    items,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    markAllRead,
    openNotification,
  } = useNotifications();

  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const root =
      listRef.current?.closest("[data-slot='scroll-area-viewport']") ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { root, rootMargin: "48px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, items.length]);

  return (
    <PopoverContent
      align="end"
      sideOffset={8}
      className={cn(
        "w-[min(22rem,calc(100vw-1.5rem))] gap-0 p-0 shadow-lg",
        className,
      )}
    >
      <PopoverHeader className="flex-row items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <PopoverTitle className="font-heading text-sm font-semibold">
          Thông báo
        </PopoverTitle>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => void markAllRead()}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        ) : null}
      </PopoverHeader>

      <ScrollArea className="h-[min(22rem,50vh)]">
        <div ref={listRef} className="flex flex-col gap-0.5 p-1.5">
          {isLoading && items.length === 0 ? (
            <p className="px-2.5 py-8 text-center text-sm text-muted-foreground">
              Đang tải thông báo…
            </p>
          ) : items.length === 0 ? (
            <p className="px-2.5 py-8 text-center text-sm text-muted-foreground">
              Chưa có thông báo nào
            </p>
          ) : (
            <>
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onSelect={(item) => {
                    onNavigate?.();
                    void openNotification(item);
                  }}
                />
              ))}
              {hasMore ? (
                <div
                  ref={sentinelRef}
                  className="flex h-8 items-center justify-center"
                  aria-hidden={!isLoadingMore}
                >
                  {isLoadingMore ? (
                    <p className="text-xs text-muted-foreground">Đang tải…</p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </ScrollArea>
    </PopoverContent>
  );
}
