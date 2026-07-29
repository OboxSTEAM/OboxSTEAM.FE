import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  notificationIdParamSchema,
  notificationListQuerySchema,
  type NotificationIdParam,
  type NotificationListQuery,
} from "@/lib/validations/notifications";

import {
  getNotificationsResponseSchema,
  getUnreadNotificationCountResponseSchema,
  markAllNotificationsReadResponseSchema,
  markNotificationReadResponseSchema,
  type GetNotificationsResult,
  type GetUnreadNotificationCountResult,
  type MarkAllNotificationsReadResult,
  type MarkNotificationReadResult,
} from "./schemas";

export type {
  GetNotificationsResponse,
  GetNotificationsResult,
  GetUnreadNotificationCountResponse,
  GetUnreadNotificationCountResult,
  MarkAllNotificationsReadResponse,
  MarkAllNotificationsReadResult,
  MarkNotificationReadResponse,
  MarkNotificationReadResult,
} from "./schemas";

export type {
  Notification,
  NotificationType,
  NotificationUnreadCount,
} from "@/lib/api/entities/notification";

export type { NotificationIdParam, NotificationListQuery };

const NOTIFICATIONS_BASE = "/api/notifications";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildNotificationListQuery(params?: NotificationListQuery): string {
  if (!params) return "";

  const parsed = notificationListQuerySchema.parse(params);
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/** `GET /api/notifications` — paginated inbox for the current user. */
export async function getNotifications(
  params?: NotificationListQuery,
): Promise<GetNotificationsResult> {
  const response = await apiFetchParsed(
    `${NOTIFICATIONS_BASE}${buildNotificationListQuery(params)}`,
    getNotificationsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/notifications/unread-count` — current user's unread total. */
export async function getUnreadNotificationCount(): Promise<GetUnreadNotificationCountResult> {
  const response = await apiFetchParsed(
    `${NOTIFICATIONS_BASE}/unread-count`,
    getUnreadNotificationCountResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PATCH /api/notifications/{id}/read` — recipient marks one notification read. */
export async function markNotificationRead(
  id: NotificationIdParam["id"],
): Promise<MarkNotificationReadResult> {
  const { id: notificationId } = notificationIdParamSchema.parse({ id });
  const response = await apiFetchParsed(
    `${NOTIFICATIONS_BASE}/${notificationId}/read`,
    markNotificationReadResponseSchema,
    { method: "PATCH" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PATCH /api/notifications/read-all` — marks all current-user notifications read. */
export async function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResult> {
  const response = await apiFetchParsed(
    `${NOTIFICATIONS_BASE}/read-all`,
    markAllNotificationsReadResponseSchema,
    { method: "PATCH" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
