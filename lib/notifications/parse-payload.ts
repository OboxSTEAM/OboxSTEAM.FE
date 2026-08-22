import { z } from "zod";

/** Non-empty id string; unused keys are omitted by BE. */
const optionalIdSchema = z.string().trim().min(1).optional();

/**
 * Typed deeplink bag — mirrors OpenAPI `NotificationPayload`.
 * Prefer `Notification.payload` over parsing `payloadJson`.
 * `.passthrough()` keeps forward-compat keys (e.g. deeplinkPath) if BE adds them.
 */
export const notificationPayloadSchema = z
  .object({
    programId: optionalIdSchema,
    programEnrollmentId: optionalIdSchema,
    enrollmentId: optionalIdSchema,
    moduleId: optionalIdSchema,
    moduleEnrollmentId: optionalIdSchema,
    courseId: optionalIdSchema,
    activityId: optionalIdSchema,
    nextActivityId: optionalIdSchema,
    classId: optionalIdSchema,
    classEnrollmentId: optionalIdSchema,
    classSessionId: optionalIdSchema,
    classMentorRequestId: optionalIdSchema,
    assessmentRecoveryRequestId: optionalIdSchema,
    classRedeliveryRequestId: optionalIdSchema,
    paymentId: optionalIdSchema,
    paymentRequestId: optionalIdSchema,
    assignmentId: optionalIdSchema,
    submissionId: optionalIdSchema,
    materialId: optionalIdSchema,
    mediaAssetId: optionalIdSchema,
    highlightVideoId: optionalIdSchema,
    parentStudentId: optionalIdSchema,
    studentId: optionalIdSchema,
    extra: z.string().optional(),
  })
  .passthrough();

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

const EMPTY_PAYLOAD: NotificationPayload = {};

/** Safe parse of legacy `payloadJson` string → typed bag (empty on null/invalid). */
export function parseNotificationPayload(
  payloadJson: string | null | undefined,
): NotificationPayload {
  if (!payloadJson?.trim()) return EMPTY_PAYLOAD;

  try {
    const raw: unknown = JSON.parse(payloadJson);
    const parsed = notificationPayloadSchema.safeParse(raw);
    return parsed.success ? parsed.data : EMPTY_PAYLOAD;
  } catch {
    return EMPTY_PAYLOAD;
  }
}

/**
 * Prefer typed `payload` whenever present (including empty `{}`).
 * Parse `payloadJson` only for older rows/clients that omit `payload`.
 */
export function resolveNotificationPayload(input: {
  payload?: NotificationPayload | null;
  payloadJson?: string | null;
}): NotificationPayload {
  if (input.payload != null && typeof input.payload === "object") {
    const parsed = notificationPayloadSchema.safeParse(input.payload);
    return parsed.success ? parsed.data : EMPTY_PAYLOAD;
  }
  return parseNotificationPayload(input.payloadJson);
}

export function payloadString(
  payload: NotificationPayload,
  key: string,
): string | null {
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
