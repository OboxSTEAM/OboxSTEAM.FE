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
import { resolveHubAccessToken } from "@/lib/auth/access-token";
import {
  bindProgramSyncHub,
  rejoinAllProgramSyncGroups,
  unbindProgramSyncHub,
} from "@/lib/realtime/program-sync-membership";
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

export type NotificationHubHandlers = {
  onReceived: NotificationReceivedHandler;
  onSyncEvent?: SyncEventHandler;
  /** Fired after automatic reconnect — re-run registered sync refetch handlers. */
  onReconnected?: () => void;
};

/** Build a hub connection; JWT is sent as `?access_token=` via accessTokenFactory. */
export function createNotificationHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${getApiBaseUrl()}${NOTIFICATION_HUB_PATH}`, {
      accessTokenFactory: () => resolveHubAccessToken(),
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.None)
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
  onReceivedOrHandlers: NotificationReceivedHandler | NotificationHubHandlers,
  onSyncEvent?: SyncEventHandler,
): Promise<() => Promise<void>> {
  const handlers: NotificationHubHandlers =
    typeof onReceivedOrHandlers === "function"
      ? { onReceived: onReceivedOrHandlers, onSyncEvent }
      : onReceivedOrHandlers;

  const connection = createNotificationHubConnection();

  connection.on(NOTIFICATION_RECEIVED_EVENT, (payload: unknown) => {
    const notification = parseNotificationReceived(payload);
    if (!notification) return;
    handlers.onReceived(notification);
  });

  if (handlers.onSyncEvent) {
    connection.on(SYNC_EVENT, (payload: unknown) => {
      const event = parseSyncEvent(payload);
      if (!event) return;
      handlers.onSyncEvent?.(event);
    });
  }

  if (handlers.onReconnected) {
    connection.onreconnected(() => {
      void rejoinAllProgramSyncGroups();
      handlers.onReconnected?.();
    });
  }

  if (connection.state === HubConnectionState.Disconnected) {
    await connection.start();
  }

  bindProgramSyncHub(connection);
  await rejoinAllProgramSyncGroups();

  return async () => {
    connection.off(NOTIFICATION_RECEIVED_EVENT);
    connection.off(SYNC_EVENT);
    unbindProgramSyncHub(connection);
    if (connection.state !== HubConnectionState.Disconnected) {
      await connection.stop();
    }
  };
}
