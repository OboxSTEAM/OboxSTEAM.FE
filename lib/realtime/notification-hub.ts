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

export const NOTIFICATION_HUB_PATH = "/hubs/notification";
export const NOTIFICATION_RECEIVED_EVENT = "notificationReceived";

export type NotificationReceivedHandler = (
  notification: Notification,
) => void;

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
 * Start the hub and subscribe to `notificationReceived`.
 * Returns a dispose fn that stops the connection and clears handlers.
 */
export async function startNotificationHub(
  onReceived: NotificationReceivedHandler,
): Promise<() => Promise<void>> {
  const connection = createNotificationHubConnection();

  connection.on(NOTIFICATION_RECEIVED_EVENT, (payload: unknown) => {
    const notification = parseNotificationReceived(payload);
    if (!notification) return;
    onReceived(notification);
  });

  if (connection.state === HubConnectionState.Disconnected) {
    await connection.start();
  }

  return async () => {
    connection.off(NOTIFICATION_RECEIVED_EVENT);
    if (connection.state !== HubConnectionState.Disconnected) {
      await connection.stop();
    }
  };
}
