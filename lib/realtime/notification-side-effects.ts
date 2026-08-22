import type { NotificationType } from "@/lib/api/entities/notification";
import type { NotificationPayload } from "@/lib/notifications/parse-payload";
import { resolveNotificationPayload, payloadString } from "@/lib/notifications/parse-payload";
import { requestCurriculumSync } from "@/lib/realtime/curriculum-sync-bus";
import { dispatchMediaSyncEvent } from "@/lib/realtime/media-sync-bus";

/** Notifications that imply curriculum tree / lesson content changed (no syncEvent from BE). */
const CURRICULUM_SOFT_SYNC_TYPES = new Set<NotificationType>([
  "MaterialUpdated",
  "AssignmentPublished",
  "AssignmentEditedByMentor",
  "ClassQuizSetEditedByMentor",
  "ResearchSubmissionOpened",
  "ResearchReturnedForRevision",
  "ResearchGradedPassed",
  "ResearchGradedFailed",
  "ResearchWorkSubmitted",
  "ModuleUnlocked",
  "ModuleCompleted",
  "ModuleFailed",
  "ActivityCompleted",
]);

const MEDIA_SYNC_TYPES = new Set<NotificationType>([
  "MediaVideoReady",
  "MediaProcessingFailed",
  "MediaAiTaggingFailed",
  "MediaTagsProcessed",
]);

/**
 * Fan out hub `notificationReceived` into silent screen refresh buses.
 * Complements `syncEvent` (only `curriculum.structureChanged` on BE today).
 */
export function dispatchNotificationSideEffects(notification: {
  type: NotificationType;
  payload?: NotificationPayload | null;
  payloadJson?: string | null;
  entityId: string | null;
}): void {
  const payload = resolveNotificationPayload(notification);

  if (CURRICULUM_SOFT_SYNC_TYPES.has(notification.type)) {
    const programId = payloadString(payload, "programId");
    if (programId) {
      requestCurriculumSync(programId, { showToast: false });
    }
  }

  if (MEDIA_SYNC_TYPES.has(notification.type)) {
    const mediaId =
      payloadString(payload, "mediaAssetId") ??
      (notification.entityId?.trim() || null);
    dispatchMediaSyncEvent(mediaId);
  }
}
