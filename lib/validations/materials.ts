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

export const materialTypeFilterSchema = z.enum([
  "PDF",
  "DOC",
  "Video",
  "Image",
  "ExternalLink",
]);

/** Query params for `GET /api/materials`. */
export const materialListQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  materialType: materialTypeFilterSchema.optional(),
  programId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  activityId: z.string().uuid().optional(),
});

export type ActivityDetailQuery = z.infer<typeof activityDetailQuerySchema>;
export type MaterialByActivityParams = z.infer<typeof materialByActivityParamsSchema>;
export type MaterialByActivityQuery = z.infer<typeof materialByActivityQuerySchema>;
export type MaterialIdParam = z.infer<typeof materialIdParamSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type MaterialTypeFilter = z.infer<typeof materialTypeFilterSchema>;
export type MaterialListQuery = z.infer<typeof materialListQuerySchema>;
