import {
  HubConnection,
  HubConnectionState,
} from "@microsoft/signalr";

import type { Notification } from "@/lib/api/entities/notification";
import {
  flushAllCurriculumSyncHandlers,
  dispatchCurriculumSyncEvent,
} from "@/lib/realtime/curriculum-sync-bus";
import { flushAllMediaSyncHandlers } from "@/lib/realtime/media-sync-bus";
import {
  createNotificationHubConnection,
  parseNotificationReceived,
} from "@/lib/realtime/notification-hub";
import {
  bindProgramSyncHub,
  rejoinAllProgramSyncGroups,
  unbindProgramSyncHub,
} from "@/lib/realtime/program-sync-membership";
import {
  dispatchSeatsSyncEvent,
  flushAllSeatsSyncHandlers,
} from "@/lib/realtime/seats-sync-bus";
import {
  NOTIFICATION_RECEIVED_EVENT,
  SYNC_EVENT,
  parseSyncEvent,
} from "@/lib/realtime/sync-event";

type NotificationListener = (notification: Notification) => void;

let connection: HubConnection | null = null;
let startTask: Promise<HubConnection | null> | null = null;
let consumerCount = 0;
let notificationListener: NotificationListener | null = null;

/** Auth-only: deliver inbox push events. */
export function setSyncHubNotificationListener(
  listener: NotificationListener | null,
): void {
  notificationListener = listener;
}

function handleSyncPayload(payload: unknown): void {
  const event = parseSyncEvent(payload);
  if (!event) return;
  dispatchCurriculumSyncEvent(event);
  dispatchSeatsSyncEvent(event);
}

async function startHubInternal(): Promise<HubConnection | null> {
  const conn = createNotificationHubConnection();

  conn.on(SYNC_EVENT, handleSyncPayload);

  conn.on(NOTIFICATION_RECEIVED_EVENT, (payload: unknown) => {
    const notification = parseNotificationReceived(payload);
    if (!notification || !notificationListener) return;
    notificationListener(notification);
  });

  conn.onreconnected(() => {
    void rejoinAllProgramSyncGroups();
    flushAllCurriculumSyncHandlers();
    flushAllMediaSyncHandlers();
    flushAllSeatsSyncHandlers();
  });

  try {
    await conn.start();
  } catch {
    return null;
  }

  connection = conn;
  bindProgramSyncHub(conn);
  await rejoinAllProgramSyncGroups();
  return conn;
}

/** Start (or reuse) the shared notifications/sync hub. Works without auth for public seat sync. */
export async function ensureSyncHubStarted(): Promise<HubConnection | null> {
  if (connection?.state === HubConnectionState.Connected) {
    return connection;
  }

  if (!startTask) {
    startTask = startHubInternal().finally(() => {
      startTask = null;
    });
  }

  return startTask;
}

/** Reference-counted hub consumer — call release on cleanup. */
export function acquireSyncHub(): () => void {
  consumerCount += 1;
  void ensureSyncHubStarted();

  return () => {
    consumerCount = Math.max(0, consumerCount - 1);
    if (consumerCount > 0) return;

    if (connection) {
      connection.off(SYNC_EVENT);
      connection.off(NOTIFICATION_RECEIVED_EVENT);
      unbindProgramSyncHub(connection);
      void connection.stop().catch(() => {
        /* ignore teardown errors */
      });
      connection = null;
    }
  };
}

export function getSyncHubConnection(): HubConnection | null {
  return connection;
}
