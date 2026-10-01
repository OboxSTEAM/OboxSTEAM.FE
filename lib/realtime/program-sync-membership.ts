import {
  HubConnection,
  HubConnectionState,
} from "@microsoft/signalr";

import { ensureSyncHubStarted } from "@/lib/realtime/sync-hub-connection";

type SyncGroup = {
  joinMethod: string;
  leaveMethod: string;
  refCounts: Map<string, number>;
};

/** Public program group (`seats.changed`, public `curriculum.structureChanged`). */
const programGroup: SyncGroup = {
  joinMethod: "JoinProgramSync",
  leaveMethod: "LeaveProgramSync",
  refCounts: new Map(),
};

/**
 * Advisory chat group — participants only (hub throws otherwise). Membership doubles
 * as presence: the BE skips chat notifications for members.
 */
const advisoryGroup: SyncGroup = {
  joinMethod: "JoinAdvisorySync",
  leaveMethod: "LeaveAdvisorySync",
  refCounts: new Map(),
};

let hubConnection: HubConnection | null = null;

export function bindProgramSyncHub(connection: HubConnection): void {
  hubConnection = connection;
}

export function unbindProgramSyncHub(connection: HubConnection): void {
  if (hubConnection === connection) {
    hubConnection = null;
  }
}

async function joinGroup(group: SyncGroup, programId: string): Promise<boolean> {
  if (!programId) return false;

  group.refCounts.set(programId, (group.refCounts.get(programId) ?? 0) + 1);

  const conn = (await ensureSyncHubStarted()) ?? hubConnection;
  // Released while the hub was starting — joining now would leak membership.
  if (!group.refCounts.has(programId)) return false;
  if (conn?.state !== HubConnectionState.Connected) return false;

  hubConnection = conn;

  try {
    await conn.invoke(group.joinMethod, programId);
    return true;
  } catch {
    /* Hub join is best-effort; REST refetch still works. */
    return false;
  }
}

function leaveGroup(group: SyncGroup, programId: string): void {
  if (!programId) return;

  const current = group.refCounts.get(programId) ?? 0;
  if (current > 1) {
    group.refCounts.set(programId, current - 1);
    return;
  }

  group.refCounts.delete(programId);
  const conn = hubConnection;
  if (conn?.state === HubConnectionState.Connected) {
    void conn.invoke(group.leaveMethod, programId).catch(() => {
      /* best-effort */
    });
  }
}

/** Subscribe to program-scoped sync events (e.g. `seats.changed`). Ref-counted per program. */
export async function joinProgramSync(programId: string): Promise<void> {
  await joinGroup(programGroup, programId);
}

export function leaveProgramSync(programId: string): void {
  leaveGroup(programGroup, programId);
}

/**
 * Join the advisory chat group (`advisory.*` scopes + versioned `curriculum.structureChanged`).
 * Ref-counted per program; resolves `false` when the hub is offline or the user is not a participant.
 */
export function joinAdvisorySync(programId: string): Promise<boolean> {
  return joinGroup(advisoryGroup, programId);
}

export function leaveAdvisorySync(programId: string): void {
  leaveGroup(advisoryGroup, programId);
}

/** Re-join every held group — SignalR drops groups (and advisory presence) on disconnect. */
export async function rejoinAllProgramSyncGroups(): Promise<void> {
  const conn = hubConnection;
  if (conn?.state !== HubConnectionState.Connected) return;

  for (const group of [programGroup, advisoryGroup]) {
    for (const programId of group.refCounts.keys()) {
      try {
        await conn.invoke(group.joinMethod, programId);
      } catch {
        /* ignore per-program join failures */
      }
    }
  }
}
