import { z } from "zod";

import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import {
  notificationSchema,
  notificationUnreadCountSchema,
} from "@/lib/api/entities/notification";
import {
  apiValueMessageOnlySchema,
  createApiResponseSchema,
  createApiValueSchema,
} from "@/lib/api/schemas";

export const paginatedNotificationsSchema = createPaginatedSchema(
  notificationSchema,
).extend({
  /** Rows with a type this client does not know yet are dropped so the rest of the page still loads. */
  items: z
    .array(z.unknown())
    .nullish()
    .transform((value) =>
      (value ?? []).flatMap((item) => {
        const parsed = notificationSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      }),
    ),
});

export const notificationsListValueSchema = createApiValueSchema(
  paginatedNotificationsSchema,
);
export const notificationUnreadCountValueSchema = createApiValueSchema(
  notificationUnreadCountSchema,
);

export const getNotificationsResponseSchema = createApiResponseSchema(
  notificationsListValueSchema,
);
export const getUnreadNotificationCountResponseSchema = createApiResponseSchema(
  notificationUnreadCountValueSchema,
);
export const markNotificationReadResponseSchema = createApiResponseSchema(
  apiValueMessageOnlySchema,
);
export const markAllNotificationsReadResponseSchema = createApiResponseSchema(
  apiValueMessageOnlySchema,
);

export type GetNotificationsResponse = z.infer<
  typeof getNotificationsResponseSchema
>;
export type GetUnreadNotificationCountResponse = z.infer<
  typeof getUnreadNotificationCountResponseSchema
>;
export type MarkNotificationReadResponse = z.infer<
  typeof markNotificationReadResponseSchema
>;
export type MarkAllNotificationsReadResponse = z.infer<
  typeof markAllNotificationsReadResponseSchema
>;

export type GetNotificationsResult = NonNullable<
  GetNotificationsResponse["value"]
>;
export type GetUnreadNotificationCountResult = NonNullable<
  GetUnreadNotificationCountResponse["value"]
>;
export type MarkNotificationReadResult = NonNullable<
  MarkNotificationReadResponse["value"]
>;
export type MarkAllNotificationsReadResult = NonNullable<
  MarkAllNotificationsReadResponse["value"]
>;
