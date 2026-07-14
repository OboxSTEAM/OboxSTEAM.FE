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

/** Path param for `PUT /api/materials/{materialId}`. */
export const materialIdParamSchema = z.object({
  id: z.string().uuid("ID tài liệu không hợp lệ."),
});

/** Form schema for updating material */
export const updateMaterialSchema = z.object({
  title: z.string().min(1, "Tiêu đề tài liệu là bắt buộc."),
});

export type ActivityDetailQuery = z.infer<typeof activityDetailQuerySchema>;
export type MaterialByActivityParams = z.infer<typeof materialByActivityParamsSchema>;
export type MaterialByActivityQuery = z.infer<typeof materialByActivityQuerySchema>;
export type MaterialIdParam = z.infer<typeof materialIdParamSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
