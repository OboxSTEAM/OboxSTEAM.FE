import { z } from "zod";

export const NOTIFICATION_HUB_PATH = "/hubs/notifications";
export const NOTIFICATION_RECEIVED_EVENT = "notificationReceived";
export const SYNC_EVENT = "syncEvent";

export const CURRICULUM_STRUCTURE_CHANGED_SCOPE = "curriculum.structureChanged";
export const ADVISORY_DISCUSSION_CHANGED_SCOPE = "advisory.discussionChanged";
export const ADVISORY_PIN_CHANGED_SCOPE = "advisory.pinChanged";
export const ADVISORY_APPROVAL_CHANGED_SCOPE = "advisory.approvalChanged";

/** Hub may serialize `payload` as an object or a JSON string. */
const syncPayloadSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}, z.unknown());

export const syncEventSchema = z.object({
  scope: z.string(),
  entityType: z.string(),
  entityId: z.string().min(1),
  at: z.string().optional(),
  payload: syncPayloadSchema.optional(),
});

export type SyncEvent = z.infer<typeof syncEventSchema>;

const advisoryDiscussionChangedPayloadSchema = z.object({
  latestSequence: z.number().int(),
  messageId: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
});

const advisoryPinChangedPayloadSchema = z.object({
  messageId: z.string().uuid(),
});

const advisoryApprovalChangedPayloadSchema = z.object({
  status: z.string(),
  curriculumVersion: z.number().int(),
});

export type AdvisoryDiscussionChangedPayload = z.infer<
  typeof advisoryDiscussionChangedPayloadSchema
>;
export type AdvisoryPinChangedPayload = z.infer<typeof advisoryPinChangedPayloadSchema>;
export type AdvisoryApprovalChangedPayload = z.infer<
  typeof advisoryApprovalChangedPayloadSchema
>;

/** Advisory group events for one program, narrowed by `scope`. */
export type AdvisorySyncEvent =
  | {
      scope: typeof ADVISORY_DISCUSSION_CHANGED_SCOPE;
      programId: string;
      payload: AdvisoryDiscussionChangedPayload;
    }
  | {
      scope: typeof ADVISORY_PIN_CHANGED_SCOPE;
      programId: string;
      payload: AdvisoryPinChangedPayload;
    }
  | {
      scope: typeof ADVISORY_APPROVAL_CHANGED_SCOPE;
      programId: string;
      payload: AdvisoryApprovalChangedPayload;
    };

export function parseSyncEvent(payload: unknown): SyncEvent | null {
  const parsed = syncEventSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

export function isCurriculumStructureChanged(event: SyncEvent): boolean {
  return (
    event.scope === CURRICULUM_STRUCTURE_CHANGED_SCOPE &&
    event.entityType === "Program"
  );
}

export function isSeatsChanged(event: SyncEvent): boolean {
  return event.scope === "seats.changed";
}

/** Narrow a hub event to an advisory scope with a valid payload, or `null`. */
export function parseAdvisorySyncEvent(event: SyncEvent): AdvisorySyncEvent | null {
  if (event.entityType !== "Program") return null;
  const programId = event.entityId;

  switch (event.scope) {
    case ADVISORY_DISCUSSION_CHANGED_SCOPE: {
      const parsed = advisoryDiscussionChangedPayloadSchema.safeParse(event.payload);
      return parsed.success
        ? { scope: event.scope, programId, payload: parsed.data }
        : null;
    }
    case ADVISORY_PIN_CHANGED_SCOPE: {
      const parsed = advisoryPinChangedPayloadSchema.safeParse(event.payload);
      return parsed.success
        ? { scope: event.scope, programId, payload: parsed.data }
        : null;
    }
    case ADVISORY_APPROVAL_CHANGED_SCOPE: {
      const parsed = advisoryApprovalChangedPayloadSchema.safeParse(event.payload);
      return parsed.success
        ? { scope: event.scope, programId, payload: parsed.data }
        : null;
    }
    default:
      return null;
  }
}
