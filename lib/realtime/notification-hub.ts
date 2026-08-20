import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

import { getApiBaseUrl } from "@/lib/api/config";
import {
  notificationSchema,
  type Notification,
} from "@/lib/api/entities/notification";
import { getAuthSession } from "@/lib/auth/session";
import {
  NOTIFICATION_HUB_PATH,
  NOTIFICATION_RECEIVED_EVENT,
  SYNC_EVENT,
  parseSyncEvent,
  type SyncEvent,
} from "@/lib/realtime/sync-event";

export {
  NOTIFICATION_HUB_PATH,
  NOTIFICATION_RECEIVED_EVENT,
  SYNC_EVENT,
} from "@/lib/realtime/sync-event";

export type NotificationReceivedHandler = (
  notification: Notification,
) => void;

export type SyncEventHandler = (event: SyncEvent) => void;

/** Build a hub connection; JWT is sent as `?access_token=` via accessTokenFactory. */
export function createNotificationHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${getApiBaseUrl()}${NOTIFICATION_HUB_PATH}`, {
      accessTokenFactory: () => getAuthSession()?.accessToken ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

export function parseNotificationReceived(
  payload: unknown,
): Notification | null {
  const parsed = notificationSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

/**
 * Start the hub and subscribe to `notificationReceived` and optional `syncEvent`.
 * Returns a dispose fn that stops the connection and clears handlers.
 */
export async function startNotificationHub(
  onReceived: NotificationReceivedHandler,
  onSyncEvent?: SyncEventHandler,
): Promise<() => Promise<void>> {
  const connection = createNotificationHubConnection();

  connection.on(NOTIFICATION_RECEIVED_EVENT, (payload: unknown) => {
    const notification = parseNotificationReceived(payload);
    if (!notification) return;
    onReceived(notification);
  });

  if (onSyncEvent) {
    connection.on(SYNC_EVENT, (payload: unknown) => {
      const event = parseSyncEvent(payload);
      if (!event) return;
      onSyncEvent(event);
    });
  }

  if (connection.state === HubConnectionState.Disconnected) {
    await connection.start();
  }

  return async () => {
    connection.off(NOTIFICATION_RECEIVED_EVENT);
    connection.off(SYNC_EVENT);
    if (connection.state !== HubConnectionState.Disconnected) {
      await connection.stop();
    }
  };
}
