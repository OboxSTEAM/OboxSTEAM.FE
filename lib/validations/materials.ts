import { z } from "zod";

/** Query param for enrollment-scoped `GET /api/activities/{id}`. */
export const activityDetailQuerySchema = z.object({
  programEnrollmentId: z.string().uuid("ID ghi danh không hợp lệ."),
});

/** Path param for `GET /api/materials/activity/{activityId}`. */
export const materialByActivityParamsSchema = z.object({
  activityId: z.string().uuid("ID hoạt động không hợp lệ."),
});

/** Query param for `GET /api/materials/activity/{activityId}`. */
export const materialByActivityQuerySchema = z.object({
  programEnrollmentId: z.string().uuid("ID ghi danh không hợp lệ."),
});

export type ActivityDetailQuery = z.infer<typeof activityDetailQuerySchema>;
export type MaterialByActivityParams = z.infer<typeof materialByActivityParamsSchema>;
export type MaterialByActivityQuery = z.infer<typeof materialByActivityQuerySchema>;
