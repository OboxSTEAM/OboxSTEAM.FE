"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Inbox } from "lucide-react";

import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNotifications } from "@/hooks/use-notifications";
import { getNotifications } from "@/lib/api/notifications";
import type { Notification } from "@/lib/api/entities/notification";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { groupNotificationsByRecency } from "@/lib/notifications/group-by-recency";

const PAGE_SIZE = 20;

export function NotificationsPageContent() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, isLoading: isAuthLoading } =
    useCurrentUser();
  const { openNotification, markAllRead, unreadCount } = useNotifications();

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const isMountedRef = useRef(false);
  const fetchGenerationRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const canFetch = isHydrated && !isAuthLoading && isAuthenticated;

  const loadPage = useCallback(
    async (page: number, append: boolean) => {
      if (!canFetch) return;

      const generation = ++fetchGenerationRef.current;
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const result = await getNotifications({
          page,
          pageSize: PAGE_SIZE,
          unreadOnly: unreadOnly || undefined,
        });

        if (!isMountedRef.current || generation !== fetchGenerationRef.current) {
          return;
        }

        setItems((prev) => {
          if (!append) return result.data.items;
          const seen = new Set(prev.map((item) => item.id));
          return [
            ...prev,
            ...result.data.items.filter((item) => !seen.has(item.id)),
          ];
        });
        setCurrentPage(result.data.currentPage);
        setHasMore(result.data.hasNext);
      } catch (error) {
        if (isMountedRef.current && generation === fetchGenerationRef.current) {
          showAppErrorFromUnknown(error, "generic");
        }
      } finally {
        if (isMountedRef.current && generation === fetchGenerationRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [canFetch, unreadOnly],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      fetchGenerationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?returnUrl=%2Fnotifications");
    }
  }, [isAuthenticated, isAuthLoading, isHydrated, router]);

  useEffect(() => {
    if (!canFetch) return;
    void loadPage(1, false);
  }, [canFetch, loadPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    void loadPage(currentPage + 1, true);
  }, [currentPage, hasMore, isLoading, isLoadingMore, loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { root: null, rootMargin: "80px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, items.length]);

  async function handleSelect(notification: Notification) {
    await openNotification(notification);
    setItems((prev) => {
      if (unreadOnly) {
        return prev.filter((item) => item.id !== notification.id);
      }
      const readAt = new Date().toISOString();
      return prev.map((item) =>
        item.id === notification.id ? { ...item, readAt } : item,
      );
    });
  }

  async function handleMarkAllRead() {
    await markAllRead();
    if (unreadOnly) {
      setItems([]);
      setHasMore(false);
      return;
    }
    const readAt = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) => (item.readAt == null ? { ...item, readAt } : item)),
    );
  }

  const groups = groupNotificationsByRecency(items);

  if (!isHydrated || isAuthLoading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-6 h-10 w-48 rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#2D2D2D]">
            Thông báo
          </h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">
            Xem tất cả hoặc chỉ thông báo chưa đọc, nhóm theo ngày.
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 rounded-xl"
            onClick={() => void handleMarkAllRead()}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        ) : null}
      </div>

      <Tabs
        value={unreadOnly ? "unread" : "all"}
        onValueChange={(value) => {
          setUnreadOnly(value === "unread");
          setItems([]);
          setCurrentPage(0);
        }}
        className="gap-4"
      >
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-1 rounded-none border-b border-[#E5E5E0] bg-transparent p-0"
        >
          <TabsTrigger
            value="all"
            className="rounded-none px-4 py-2.5 data-active:text-primary"
          >
            Tất cả
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="rounded-none px-4 py-2.5 data-active:text-primary"
          >
            Chưa đọc
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 overflow-hidden rounded-xl border border-[#E5E5E0] bg-white shadow-sm">
        {isLoading && items.length === 0 ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            {unreadOnly ? (
              <Bell className="size-8 text-[#4FC3F7]" aria-hidden />
            ) : (
              <Inbox className="size-8 text-[#4FC3F7]" aria-hidden />
            )}
            <p className="font-heading text-base font-semibold text-[#2D2D2D]">
              {unreadOnly ? "Không còn thông báo chưa đọc" : "Chưa có thông báo"}
            </p>
            <p className="text-sm text-[#6B6B6B]">
              {unreadOnly
                ? "Mọi thông báo mới sẽ hiện ở đây."
                : "Khi có cập nhật học tập hoặc thanh toán, bạn sẽ thấy tại đây."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E0]">
            {groups.map((group) => (
              <section key={group.id} className="px-2 py-3 sm:px-3">
                <h2 className="px-3 pb-1.5 text-xs font-semibold tracking-wide text-[#6B6B6B] uppercase">
                  {group.label}
                </h2>
                <ul className="space-y-0.5">
                  {group.items.map((notification) => (
                    <li key={notification.id}>
                      <NotificationItem
                        notification={notification}
                        variant="page"
                        onSelect={(item) => void handleSelect(item)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {hasMore ? (
              <div
                ref={sentinelRef}
                className="flex h-10 items-center justify-center"
              >
                {isLoadingMore ? (
                  <p className="text-xs text-[#6B6B6B]">Đang tải…</p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
