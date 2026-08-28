import {
  HubConnection,
  HubConnectionState,
} from "@microsoft/signalr";

import { ensureSyncHubStarted } from "@/lib/realtime/sync-hub-connection";

const joinedProgramRefCounts = new Map<string, number>();
let hubConnection: HubConnection | null = null;

export function bindProgramSyncHub(connection: HubConnection): void {
  hubConnection = connection;
}

export function unbindProgramSyncHub(connection: HubConnection): void {
  if (hubConnection === connection) {
    hubConnection = null;
  }
}

/** Subscribe to program-scoped sync events (e.g. `seats.changed`). Ref-counted per program. */
export async function joinProgramSync(programId: string): Promise<void> {
  if (!programId) return;

  const nextCount = (joinedProgramRefCounts.get(programId) ?? 0) + 1;
  joinedProgramRefCounts.set(programId, nextCount);

  const conn = (await ensureSyncHubStarted()) ?? hubConnection;
  if (conn?.state !== HubConnectionState.Connected) return;

  hubConnection = conn;

  try {
    await conn.invoke("JoinProgramSync", programId);
  } catch {
    /* Hub join is best-effort; REST refetch still works. */
  }
}

export function leaveProgramSync(programId: string): void {
  if (!programId) return;

  const current = joinedProgramRefCounts.get(programId) ?? 0;
  if (current <= 1) {
    joinedProgramRefCounts.delete(programId);
    const conn = hubConnection;
    if (conn?.state === HubConnectionState.Connected) {
      void conn.invoke("LeaveProgramSync", programId).catch(() => {
        /* best-effort */
      });
    }
  } else {
    joinedProgramRefCounts.set(programId, current - 1);
  }
}

export async function rejoinAllProgramSyncGroups(): Promise<void> {
  const conn = hubConnection;
  if (conn?.state !== HubConnectionState.Connected) return;

  for (const programId of joinedProgramRefCounts.keys()) {
    try {
      await conn.invoke("JoinProgramSync", programId);
    } catch {
      /* ignore per-program join failures */
    }
  }
}
