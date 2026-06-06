import { z } from "zod";

import { programLevelSchema } from "@/lib/api/entities/program";

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
  level: programLevelSchema.optional(),
  rating: z.number().optional(),
  skillsGained: z.string().optional(),
  status: z.string().optional(),
});

export const programIdParamSchema = z.object({
  id: z.string().uuid("ID chương trình không hợp lệ."),
});

/** Body for `POST /api/programs` and `PUT /api/programs/{id}`. */
export const programUpsertSchema = z.object({
  code: z.string().min(1, "Mã chương trình là bắt buộc."),
  name: z.string().min(1, "Tên chương trình là bắt buộc."),
  seriesName: z.string().min(1, "Tên series là bắt buộc."),
  description: z.string().min(1, "Mô tả là bắt buộc."),
  level: programLevelSchema,
  estimatedDuration: z.string().min(1, "Thời lượng dự kiến là bắt buộc."),
  skillsGained: z.string().min(1, "Kỹ năng đạt được là bắt buộc."),
  thumbnailUrl: z.url("URL ảnh thumbnail không hợp lệ."),
  status: z.string().min(1, "Trạng thái là bắt buộc."),
  price: z.number().min(0, "Giá không được âm."),
});

export const createProgramSchema = programUpsertSchema;
export const updateProgramSchema = programUpsertSchema;
