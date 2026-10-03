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
  /**
   * Query name is unchanged. Matches a catalog skill whose name or code
   * contains the keyword, not free-text in the program description.
   */
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
  // Trimmed: PUT skips blank strings, so whitespace-only would silently keep the old value.
  code: z.string().trim().min(1, "Mã chương trình là bắt buộc."),
  name: z.string().trim().min(1, "Tên chương trình là bắt buộc."),
  seriesName: z.string().trim().min(1, "Tên series là bắt buộc."),
  description: z.string().trim().min(1, "Mô tả là bắt buộc."),
  category: programCategorySchema,
  level: programLevelSchema,
  estimatedDuration: z.string().trim().min(1, "Thời lượng dự kiến là bắt buộc."),
  /**
   * Omitted or null on update keeps the current links. `[]` clears them.
   * Create with no ids leaves the program without skills.
   */
  skillIds: z
    .array(
      z
        .string()
        .uuid("ID kỹ năng không hợp lệ.")
        .refine(
          (id) => id !== "00000000-0000-0000-0000-000000000000",
          "Cần chọn kỹ năng hợp lệ.",
        ),
    )
    .superRefine((ids, ctx) => {
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) {
          ctx.addIssue({
            code: "custom",
            message: "Không được chọn trùng kỹ năng.",
          });
          return;
        }
        seen.add(id);
      }
    })
    .optional(),
  thumbnailUrl: z.string().url("URL ảnh thumbnail không hợp lệ.").or(z.literal("")).nullable().optional(),
  status: programStatusSchema,
  price: z.number().min(0, "Giá không được âm."),
  /**
   * Kept transform-free so `z.input` === `z.output` — react-hook-form resolvers
   * reject schemas whose parsed shape differs from the form shape. Empty string
   * is normalized to `null` at the API boundary.
   */
  frameworkId: z
    .union([z.string().uuid("ID khung không hợp lệ."), z.literal(""), z.null()])
    .optional(),
  frameworkVersionId: z
    .union([
      z.string().uuid("ID phiên bản khung không hợp lệ."),
      z.literal(""),
      z.null(),
    ])
    .optional(),
});

/** Create omits status — BE defaults to Draft. Optional `file` for create-time thumbnail. */
export const createProgramSchema = programUpsertSchema.omit({ status: true });

export const createProgramRequestSchema = createProgramSchema.extend({
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
    )
    .optional()
    .nullable(),
});

/** Framework is fixed at creation; to use another one, create a new program. */
export const updateProgramSchema = programUpsertSchema.omit({
  frameworkId: true,
  frameworkVersionId: true,
});

/**
 * Non-curriculum subset of `PUT /api/programs/{id}` — accepted while a class is
 * running and never revokes an approval.
 */
export const updateProgramSettingsSchema = updateProgramSchema.pick({
  status: true,
  price: true,
});

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

/** Body for `POST /api/programs/{programId}/select-class`. */
export const selectProgramClassSchema = z.object({
  classId: z.string().uuid("ID lớp không hợp lệ."),
});

export type SelectProgramClassInput = z.infer<typeof selectProgramClassSchema>;

/** Body for `PUT /api/programs/{id}/advisor` — Draft or Approved only; on Approved it revokes approval. */
export const assignProgramAdvisorSchema = z.object({
  advisorExpertId: z.string().uuid("ID chuyên gia phụ trách không hợp lệ."),
});

export type AssignProgramAdvisorInput = z.infer<typeof assignProgramAdvisorSchema>;

