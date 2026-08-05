import { z } from "zod";

/** Query params for `GET /api/media` (paginated). */
export const mediaListQuerySchema = z.object({
  classId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  classSessionId: z.string().uuid().optional(),
  fileType: z.string().optional(),
  videoStatus: z
    .enum([
      "None",
      "Transcoding",
      "PendingTagging",
      "TaggingComplete",
      "Failed",
    ])
    .optional(),
  sortBy: z.string().optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

/** Query params for `POST /api/media/upload`. */
export const mediaUploadQuerySchema = z.object({
  classId: z.string().uuid("ID lớp học không hợp lệ."),
  classSessionId: z.string().uuid("ID buổi học không hợp lệ.").optional(),
});

/** Path param for media-scoped routes. */
export const mediaIdParamSchema = z.object({
  mediaId: z.string().uuid("ID media không hợp lệ."),
});

/** Path params for tag routes. */
export const mediaTagParamsSchema = z.object({
  mediaId: z.string().uuid("ID media không hợp lệ."),
  studentId: z.string().uuid("ID học viên không hợp lệ."),
});

/** Body for `POST /api/media/{mediaId}/tags`. */
export const addMediaTagSchema = z.object({
  studentId: z.string().uuid("ID học viên không hợp lệ."),
});

/** Body for `PATCH /api/media/{mediaId}/tags/{studentId}`. */
export const updateMediaTagVerificationSchema = z.object({
  isVerified: z.boolean(),
});

export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
export type MediaUploadQuery = z.infer<typeof mediaUploadQuerySchema>;
export type MediaIdParam = z.infer<typeof mediaIdParamSchema>;
export type MediaTagParams = z.infer<typeof mediaTagParamsSchema>;
export type AddMediaTagInput = z.infer<typeof addMediaTagSchema>;
export type UpdateMediaTagVerificationInput = z.infer<
  typeof updateMediaTagVerificationSchema
>;
