import { parseApiDateTime } from "@/lib/api/datetime";
import type { Notification } from "@/lib/api/entities/notification";

export type NotificationRecencyGroupId = "today" | "yesterday" | "earlier";

export const NOTIFICATION_RECENCY_LABELS: Record<
  NotificationRecencyGroupId,
  string
> = {
  today: "Hôm nay",
  yesterday: "Hôm qua",
  earlier: "Trước đó",
};

const GROUP_ORDER: NotificationRecencyGroupId[] = [
  "today",
  "yesterday",
  "earlier",
];

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function getNotificationRecencyGroup(
  createdAt: string,
  now: Date = new Date(),
): NotificationRecencyGroupId {
  const created = parseApiDateTime(createdAt);
  if (!created) return "earlier";

  const createdDay = startOfLocalDay(created);
  const today = startOfLocalDay(now);
  const dayMs = 24 * 60 * 60 * 1000;

  if (createdDay === today) return "today";
  if (createdDay === today - dayMs) return "yesterday";
  return "earlier";
}

export type NotificationRecencyGroup = {
  id: NotificationRecencyGroupId;
  label: string;
  items: Notification[];
};

export function groupNotificationsByRecency(
  items: Notification[],
  now: Date = new Date(),
): NotificationRecencyGroup[] {
  const buckets: Record<NotificationRecencyGroupId, Notification[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  for (const item of items) {
    buckets[getNotificationRecencyGroup(item.createdAt, now)].push(item);
  }

  return GROUP_ORDER.filter((id) => buckets[id].length > 0).map((id) => ({
    id,
    label: NOTIFICATION_RECENCY_LABELS[id],
    items: buckets[id],
  }));
}
