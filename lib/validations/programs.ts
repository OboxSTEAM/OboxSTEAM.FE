import { z } from "zod";

import {
  programCategorySchema,
  programLevelSchema,
  programStatusSchema,
} from "@/lib/api/entities/program";

export const programSortBySchema = z.enum([
  "name",
  "code",
  "level",
  "rating",
  "price",
  "createdAt",
]);

/** Query params for `GET /api/programs` and `GET /api/programs/with-modules`. */
export const programListQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: programSortBySchema.optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  code: z.string().optional(),
  category: programCategorySchema.optional(),
  level: programLevelSchema.optional(),
  rating: z.number().optional(),
  skillsGained: z.string().optional(),
  status: programStatusSchema.optional(),
});

export const programIdParamSchema = z.object({
  id: z.string().uuid("ID chương trình không hợp lệ."),
});

export const reviewIdParamSchema = z.object({
  reviewId: z.string().uuid("ID đánh giá không hợp lệ."),
});

export const programReviewsSortBySchema = z.enum(["createdAt", "starRating"]);

/** Query params for `GET /api/programs/{programId}/reviews`. */
export const programReviewsQuerySchema = z.object({
  sortBy: programReviewsSortBySchema.optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
});

/** Body for `POST /api/programs` and `PUT /api/programs/{id}`. */
export const programUpsertSchema = z.object({
  code: z.string().min(1, "Mã chương trình là bắt buộc."),
  name: z.string().min(1, "Tên chương trình là bắt buộc."),
  seriesName: z.string().min(1, "Tên series là bắt buộc."),
  description: z.string().min(1, "Mô tả là bắt buộc."),
  category: programCategorySchema,
  level: programLevelSchema,
  estimatedDuration: z.string().min(1, "Thời lượng dự kiến là bắt buộc."),
  skillsGained: z.string().min(1, "Kỹ năng đạt được là bắt buộc."),
  thumbnailUrl: z.string().url("URL ảnh thumbnail không hợp lệ.").or(z.literal("")).nullable().optional(),
  status: programStatusSchema,
  price: z.number().min(0, "Giá không được âm."),
});

/** Create omits status — BE defaults to Draft. */
export const createProgramSchema = programUpsertSchema.omit({ status: true });
export const updateProgramSchema = programUpsertSchema;

export const uploadProgramThumbnailSchema = z.object({
  file: z
    .instanceof(File, { message: "Vui lòng chọn ảnh thumbnail." })
    .refine((file) => file.size > 0, "Tệp ảnh không hợp lệ.")
    .refine(
      (file) => file.type.startsWith("image/"),
      "Chỉ chấp nhận tệp hình ảnh (JPG, PNG, …).",
    )
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "Ảnh thumbnail không được vượt quá 5 MB.",
    ),
});

export type UploadProgramThumbnailInput = z.infer<
  typeof uploadProgramThumbnailSchema
>;

