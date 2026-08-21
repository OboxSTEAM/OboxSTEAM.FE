import { z } from "zod";

export const expertSortBySchema = z.enum(["fullName", "code", "createdAt"]);

export const expertListQuerySchema = z.object({
  search: z.string().trim().optional(),
  sortBy: expertSortBySchema.optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  code: z.string().trim().optional(),
});

/** Path param for `GET /api/experts/{expertId}`. */
export const expertIdParamSchema = z.object({
  expertId: z.string().uuid("ID chuyên gia không hợp lệ."),
});

export const expertProgramParamSchema = z.object({
  expertId: z.string().uuid("ID chuyên gia không hợp lệ."),
  programId: z.string().uuid("ID chương trình không hợp lệ."),
});

export const expertProgramInputSchema = z.object({
  programId: z.string().uuid("ID chương trình không hợp lệ."),
  roleInBoard: z.string().trim().max(255, "Vai trò không được quá 255 ký tự."),
});

export const expertProgramAssignmentSchema = z.object({
  roleInBoard: z.string().trim().max(255, "Vai trò không được quá 255 ký tự.").optional(),
});

export const expertDegreeIdParamSchema = expertIdParamSchema.extend({
  degreeId: z.string().uuid("ID bằng cấp không hợp lệ."),
});

export const expertPublicationIdParamSchema = expertIdParamSchema.extend({
  publicationId: z.string().uuid("ID bài báo không hợp lệ."),
});

function isHttpUrl(value: string): boolean {
  if (value === "") return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const optionalUrlSchema = z
  .string()
  .trim()
  .refine(isHttpUrl, "URL phải bắt đầu bằng http:// hoặc https://.");

const optionalYearSchema = z
  .number()
  .int("Năm phải là số nguyên.")
  .min(1900, "Năm không hợp lệ.")
  .max(2100, "Năm không hợp lệ.")
  .optional();

export const expertDegreeRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập học vị.")
    .max(255, "Học vị không được quá 255 ký tự."),
  institution: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập trường.")
    .max(255, "Tên trường không được quá 255 ký tự."),
  year: optionalYearSchema,
});

export const expertPublicationRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên bài.")
    .max(500, "Tên bài không được quá 500 ký tự."),
  venue: z
    .string()
    .trim()
    .max(255, "Tạp chí/hội nghị không được quá 255 ký tự.")
    .optional()
    .nullable(),
  year: optionalYearSchema,
  url: z
    .union([optionalUrlSchema, z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
});

export const expertUpsertSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập mã chuyên gia.")
    .max(50, "Mã chuyên gia không được quá 50 ký tự."),
  userId: z
    .union([z.string().uuid("ID tài khoản không hợp lệ."), z.literal("")])
    .optional(),
  fullName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ tên chuyên gia.")
    .max(255, "Họ tên không được quá 255 ký tự."),
  title: z.string().trim().max(255, "Chức danh không được quá 255 ký tự."),
  organization: z.string().trim().max(255, "Tổ chức không được quá 255 ký tự."),
  bio: z.string().trim().max(4000, "Giới thiệu không được quá 4000 ký tự."),
  avatarUrl: optionalUrlSchema,
  linkedInUrl: optionalUrlSchema,
  achievements: z.string().trim().max(4000, "Thành tựu không được quá 4000 ký tự."),
  specialization: z
    .array(z.string().trim().min(1).max(80, "Mỗi chuyên môn tối đa 80 ký tự."))
    .max(20, "Tối đa 20 chuyên môn.")
    .optional(),
  programs: z.array(expertProgramInputSchema),
});

export const createExpertSchema = expertUpsertSchema;
export const updateExpertSchema = expertUpsertSchema;

export const uploadExpertAvatarSchema = z.object({
  file: z
    .instanceof(File, { message: "Vui lòng chọn ảnh đại diện." })
    .refine((file) => file.size > 0, "Tệp ảnh không hợp lệ.")
    .refine(
      (file) => file.type.startsWith("image/"),
      "Chỉ chấp nhận tệp hình ảnh (JPG, PNG, …).",
    )
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "Ảnh đại diện không được vượt quá 5 MB.",
    ),
});

export type UploadExpertAvatarInput = z.infer<typeof uploadExpertAvatarSchema>;


export type ExpertListQuery = z.infer<typeof expertListQuerySchema>;
export type ExpertIdParam = z.infer<typeof expertIdParamSchema>;
export type ExpertProgramParam = z.infer<typeof expertProgramParamSchema>;
export type ExpertProgramInput = z.infer<typeof expertProgramInputSchema>;
export type ExpertProgramAssignmentInput = z.infer<
  typeof expertProgramAssignmentSchema
>;
export type CreateExpertInput = z.infer<typeof createExpertSchema>;
export type UpdateExpertInput = z.infer<typeof updateExpertSchema>;
export type ExpertDegreeRequestInput = z.infer<typeof expertDegreeRequestSchema>;
export type ExpertPublicationRequestInput = z.infer<
  typeof expertPublicationRequestSchema
>;
