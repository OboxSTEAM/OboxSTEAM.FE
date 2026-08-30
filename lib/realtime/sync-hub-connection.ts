import {
  HubConnection,
  HubConnectionState,
} from "@microsoft/signalr";

import type { Notification } from "@/lib/api/entities/notification";
import { AUTH_SESSION_CHANGED } from "@/lib/auth/session";
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

function detachConnection(conn: HubConnection): void {
  conn.off(SYNC_EVENT);
  conn.off(NOTIFICATION_RECEIVED_EVENT);
  unbindProgramSyncHub(conn);
}

function stopActiveConnection(): void {
  if (!connection) return;
  detachConnection(connection);
  void connection.stop().catch(() => {
    /* ignore teardown errors */
  });
  connection = null;
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
    detachConnection(conn);
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

/** Restart the hub when tokens change while consumers are still active. */
export async function restartSyncHubIfActive(): Promise<HubConnection | null> {
  if (consumerCount === 0) return null;

  stopActiveConnection();
  startTask = null;
  return ensureSyncHubStarted();
}

/** Reference-counted hub consumer — call release on cleanup. */
export function acquireSyncHub(): () => void {
  consumerCount += 1;
  void ensureSyncHubStarted();

  return () => {
    consumerCount = Math.max(0, consumerCount - 1);
    if (consumerCount > 0) return;
    stopActiveConnection();
  };
}

export function getSyncHubConnection(): HubConnection | null {
  return connection;
}

if (typeof window !== "undefined") {
  window.addEventListener(AUTH_SESSION_CHANGED, () => {
    void restartSyncHubIfActive();
  });
}
