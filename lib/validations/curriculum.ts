import { z } from "zod";
import { moduleTypeSchema } from "@/lib/api/entities/module";
import { activityTypeSchema } from "@/lib/api/entities/activity";

/** Path param for `GET /api/modules/{id}`. */
export const moduleIdParamSchema = z.object({
  id: z.string().uuid("ID module không hợp lệ."),
});

/** Path param for `GET /api/courses/{id}`. */
export const courseIdParamSchema = z.object({
  id: z.string().uuid("ID khóa học không hợp lệ."),
});

/** Path param for `GET /api/activities/{id}`. */
export const activityIdParamSchema = z.object({
  id: z.string().uuid("ID hoạt động không hợp lệ."),
});

export const createModuleSchema = z.object({
  code: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().min(1, "Mã module không hợp lệ.").nullable(),
  ),
  programId: z.string().uuid("ID chương trình không hợp lệ."),
  name: z.string().min(1, "Tên module là bắt buộc."),
  moduleType: moduleTypeSchema,
  moduleOrder: z.number().int().min(1, "Thứ tự học phải là số nguyên lớn hơn 0."),
  prerequisiteModuleId: z.string().uuid("ID module tiên quyết không hợp lệ.").nullable().optional(),
  isMandatory: z.boolean().default(true),
  price: z.number().min(0, "Học phí không được âm."),
  retakeFee: z.number().min(0, "Học phí học lại không được âm."),
  learningOutcomes: z.array(z.string()).nullable().optional(),
});

export const updateModuleSchema = createModuleSchema.partial().extend({
  programId: z.string().uuid("ID chương trình không hợp lệ.").optional(),
});

export const createCourseSchema = z.object({
  code: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().min(1, "Mã khóa học là bắt buộc.").nullable(),
  ),
  moduleId: z.string().uuid("ID module không hợp lệ."),
  name: z.string().min(1, "Tên khóa học là bắt buộc."),
  description: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().nullable(),
  ),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  moduleId: z.string().uuid("ID module không hợp lệ.").optional(),
});

export const createActivitySchema = z.object({
  code: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().min(1, "Mã hoạt động không hợp lệ.").nullable(),
  ),
  courseId: z.string().uuid("ID khóa học không hợp lệ."),
  name: z.string().min(1, "Tên hoạt động là bắt buộc."),
  activityType: activityTypeSchema,
  description: z.string().nullable().optional(),
  activityOrder: z.number().int().min(1, "Thứ tự hoạt động phải lớn hơn 0."),
  location: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  maxCapacity: z.number().int().min(1, "Sức chứa tối đa phải lớn hơn 0.").nullable().optional(),
  requireQrCheckin: z.boolean().default(false),
  requireMediaEvidence: z.boolean().default(false),
});

export const updateActivitySchema = createActivitySchema.partial().extend({
  courseId: z.string().uuid("ID khóa học không hợp lệ.").optional(),
});

export type ModuleIdParam = z.infer<typeof moduleIdParamSchema>;
export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
export type ActivityIdParam = z.infer<typeof activityIdParamSchema>;

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
