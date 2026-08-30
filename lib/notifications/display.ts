import type { Notification } from "@/lib/api/entities/notification";
import {
  payloadString,
  resolveNotificationPayload,
  type NotificationPayload,
} from "@/lib/notifications/parse-payload";

const DISPLAY_KEYS = [
  "actorName",
  "studentName",
  "className",
  "programName",
] as const;

type DisplayKey = (typeof DISPLAY_KEYS)[number];

function labelsFromExtra(extra: string | null): Partial<Record<DisplayKey, string>> {
  if (!extra?.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(extra);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const record = parsed as Record<string, unknown>;
    const labels: Partial<Record<DisplayKey, string>> = {};
    for (const key of DISPLAY_KEYS) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        labels[key] = value.trim();
      }
    }
    return labels;
  } catch {
    return {};
  }
}

function payloadForNotification(notification: Notification): NotificationPayload {
  return resolveNotificationPayload({
    payload: notification.payload,
    payloadJson: notification.payloadJson,
  });
}

/** Actor display name from enriched payload (or JSON `extra`). */
export function getNotificationActorName(
  notification: Notification,
): string | null {
  const payload = payloadForNotification(notification);
  return (
    payloadString(payload, "actorName") ??
    labelsFromExtra(payloadString(payload, "extra"))["actorName"] ??
    null
  );
}
