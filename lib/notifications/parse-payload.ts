import { z } from "zod";

/** Loose payload bag — BE omits null fields; keys vary by notification type. */
export const notificationPayloadSchema = z
  .record(z.string(), z.unknown())
  .catch({});

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

/** Safe parse of `payloadJson` string → camelCase object (empty on null/invalid). */
export function parseNotificationPayload(
  payloadJson: string | null | undefined,
): NotificationPayload {
  if (!payloadJson?.trim()) return {};

  try {
    const raw: unknown = JSON.parse(payloadJson);
    return notificationPayloadSchema.parse(raw);
  } catch {
    return {};
  }
}

export function payloadString(
  payload: NotificationPayload,
  key: string,
): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
