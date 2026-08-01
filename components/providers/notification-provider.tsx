"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/components/providers/current-user-provider";
import type { Notification } from "@/lib/api/entities/notification";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { normalizeAccountRole } from "@/lib/auth/roles";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { resolveNotificationHrefFromNotification } from "@/lib/notifications/resolve-href";
import { startNotificationHub } from "@/lib/realtime/notification-hub";

const INBOX_PAGE_SIZE = 10;
const STALE_MS = 30_000;

export type NotificationContextValue = {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  isHubConnected: boolean;
  refreshInbox: () => Promise<void>;
  /** Refetch when inbox is older than STALE_MS (e.g. popover open). */
  refreshIfStale: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /** Mark read, then navigate when a deep-link resolves. */
  openNotification: (notification: Notification) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, profile, session } = useCurrentUser();
  const isActive = isHydrated && isAuthenticated;
  const accountRole = normalizeAccountRole(
    profile?.role ?? session?.user?.role,
  );

  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isHubConnected, setIsHubConnected] = useState(false);

  const isMountedRef = useRef(false);
  const fetchGenerationRef = useRef(0);
  const itemsRef = useRef<Notification[]>([]);
  const unreadCountRef = useRef(0);
  const lastFetchedAtRef = useRef(0);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const refreshInbox = useCallback(async () => {
    if (!isActive) return;

    const generation = ++fetchGenerationRef.current;
    // Yield so the auth effect does not call setState synchronously.
    await Promise.resolve();
    if (!isMountedRef.current || generation !== fetchGenerationRef.current) {
      return;
    }

    setIsLoading(true);

    try {
      const [listResult, countResult] = await Promise.all([
        getNotifications({ page: 1, pageSize: INBOX_PAGE_SIZE }),
        getUnreadNotificationCount(),
      ]);

      if (!isMountedRef.current || generation !== fetchGenerationRef.current) {
        return;
      }

      setItems(listResult.data.items);
      setCurrentPage(listResult.data.currentPage);
      setHasMore(listResult.data.hasNext);
      setUnreadCount(countResult.data.count);
      lastFetchedAtRef.current = Date.now();
    } catch (error) {
      if (isMountedRef.current && generation === fetchGenerationRef.current) {
        showAppErrorFromUnknown(error, "generic");
      }
    } finally {
      if (isMountedRef.current && generation === fetchGenerationRef.current) {
        setIsLoading(false);
      }
    }
  }, [isActive]);

  const refreshIfStale = useCallback(async () => {
    if (!isActive) return;
    if (Date.now() - lastFetchedAtRef.current < STALE_MS) return;
    await refreshInbox();
  }, [isActive, refreshInbox]);

  const loadMore = useCallback(async () => {
    if (!isActive || !hasMore || isLoadingMore || isLoading) return;

    const nextPage = currentPage + 1;
    setIsLoadingMore(true);

    try {
      const listResult = await getNotifications({
        page: nextPage,
        pageSize: INBOX_PAGE_SIZE,
      });

      if (!isMountedRef.current) return;

      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const appended = listResult.data.items.filter(
          (item) => !seen.has(item.id),
        );
        return [...prev, ...appended];
      });
      setCurrentPage(listResult.data.currentPage);
      setHasMore(listResult.data.hasNext);
    } catch (error) {
      if (isMountedRef.current) {
        showAppErrorFromUnknown(error, "generic");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [currentPage, hasMore, isActive, isLoading, isLoadingMore]);

  const markRead = useCallback(async (id: string) => {
    const existing = itemsRef.current.find((item) => item.id === id);
    if (!existing || existing.readAt != null) return;

    const previousReadAt = existing.readAt;
    const readAt = new Date().toISOString();

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, readAt } : item)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationRead(id);
    } catch (error) {
      if (!isMountedRef.current) return;
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, readAt: previousReadAt } : item,
        ),
      );
      setUnreadCount((prev) => prev + 1);
      showAppErrorFromUnknown(error, "generic");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const previousItems = itemsRef.current;
    const previousUnread = unreadCountRef.current;
    if (previousUnread === 0) return;

    const readAt = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.readAt == null ? { ...item, readAt } : item,
      ),
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch (error) {
      if (!isMountedRef.current) return;
      setItems(previousItems);
      setUnreadCount(previousUnread);
      showAppErrorFromUnknown(error, "generic");
    }
  }, []);

  const openNotification = useCallback(
    async (notification: Notification) => {
      await markRead(notification.id);

      const href = resolveNotificationHrefFromNotification({
        type: notification.type,
        payloadJson: notification.payloadJson,
        accountRole,
      });
      if (href) {
        router.push(href);
      }
    },
    [accountRole, markRead, router],
  );

  const handleNotificationReceived = useCallback(
    (notification: Notification) => {
      if (!isMountedRef.current) return;

      setItems((prev) => {
        if (prev.some((item) => item.id === notification.id)) return prev;
        return [notification, ...prev];
      });

      if (notification.readAt == null) {
        setUnreadCount((prev) => prev + 1);
      }

      showAppSuccess({
        title: notification.title?.trim() || "Thông báo mới",
        description: notification.body?.trim() || undefined,
      });
    },
    [],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      fetchGenerationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;
    // Seed inbox/unread when the session becomes active (external auth system).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional REST hydrate on auth
    void refreshInbox();
  }, [isActive, refreshInbox]);

  useEffect(() => {
    if (!isActive) return;

    let disposed = false;
    let stopHub: (() => Promise<void>) | null = null;

    void (async () => {
      try {
        stopHub = await startNotificationHub(handleNotificationReceived);
        if (disposed) {
          await stopHub();
          return;
        }
        if (isMountedRef.current) {
          setIsHubConnected(true);
        }
      } catch {
        // Hub is best-effort; REST inbox still works without SignalR.
        if (!disposed && isMountedRef.current) {
          setIsHubConnected(false);
        }
      }
    })();

    return () => {
      disposed = true;
      if (stopHub) {
        void stopHub()
          .catch(() => {
            /* ignore disconnect errors on teardown */
          })
          .finally(() => {
            if (isMountedRef.current) {
              setIsHubConnected(false);
            }
          });
      }
    };
  }, [handleNotificationReceived, isActive]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      items: isActive ? items : [],
      unreadCount: isActive ? unreadCount : 0,
      isLoading: isActive ? isLoading : false,
      isLoadingMore: isActive ? isLoadingMore : false,
      hasMore: isActive ? hasMore : false,
      isHubConnected: isActive ? isHubConnected : false,
      refreshInbox,
      refreshIfStale,
      loadMore,
      markRead,
      markAllRead,
      openNotification,
    }),
    [
      isActive,
      items,
      unreadCount,
      isLoading,
      isLoadingMore,
      hasMore,
      isHubConnected,
      refreshInbox,
      refreshIfStale,
      loadMore,
      markRead,
      markAllRead,
      openNotification,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
