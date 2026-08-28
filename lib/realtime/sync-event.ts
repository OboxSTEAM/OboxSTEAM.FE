import { z } from "zod";

export const NOTIFICATION_HUB_PATH = "/hubs/notifications";
export const NOTIFICATION_RECEIVED_EVENT = "notificationReceived";
export const SYNC_EVENT = "syncEvent";

export const syncEventSchema = z.object({
  scope: z.string(),
  entityType: z.string(),
  entityId: z.string().min(1),
  at: z.string().optional(),
});

export type SyncEvent = z.infer<typeof syncEventSchema>;

export function parseSyncEvent(payload: unknown): SyncEvent | null {
  const parsed = syncEventSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

export function isCurriculumStructureChanged(event: SyncEvent): boolean {
  return (
    event.scope === "curriculum.structureChanged" &&
    event.entityType === "Program"
  );
}

export function isSeatsChanged(event: SyncEvent): boolean {
  return event.scope === "seats.changed";
}
