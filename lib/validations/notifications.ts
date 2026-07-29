import { z } from "zod";

/** Query params for `GET /api/notifications`. */
export const notificationListQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  unreadOnly: z.boolean().optional(),
});

/** Path params for notification-scoped routes. */
export const notificationIdParamSchema = z.object({
  id: z.string().uuid("ID thông báo không hợp lệ."),
});

export type NotificationListQuery = z.infer<
  typeof notificationListQuerySchema
>;
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
