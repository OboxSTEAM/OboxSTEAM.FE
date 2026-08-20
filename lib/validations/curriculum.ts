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
  code: z.string().trim().min(1, "Mã module là bắt buộc."),
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

const durationMinutesSchema = z.preprocess(
  (val) => {
    if (val === "" || val === undefined || val === null) return null;
    if (typeof val === "number" && Number.isNaN(val)) return null;
    return val;
  },
  z.number().int().min(1, "Thời lượng phải là số nguyên lớn hơn 0.").nullable(),
);

export const createCourseSchema = z.object({
  code: z.string().trim().min(1, "Mã khóa học là bắt buộc."),
  moduleId: z.string().uuid("ID module không hợp lệ."),
  name: z.string().min(1, "Tên khóa học là bắt buộc."),
  description: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().nullable(),
  ),
  courseOrder: z.number().int().min(1, "Thứ tự khóa học phải lớn hơn 0."),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  moduleId: z.string().uuid("ID module không hợp lệ.").optional(),
});

export const createActivitySchema = z
  .object({
    code: z.string().trim().min(1, "Mã hoạt động là bắt buộc."),
    courseId: z.string().uuid("ID khóa học không hợp lệ."),
    name: z.string().min(1, "Tên hoạt động là bắt buộc."),
    activityType: activityTypeSchema,
    description: z.string().nullable().optional(),
    activityOrder: z.number().int().min(1, "Thứ tự hoạt động phải lớn hơn 0."),
    durationMinutes: durationMinutesSchema.optional(),
    requireQrCheckin: z.boolean().default(false),
    requireMediaEvidence: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.activityType === "SelfPaced") return;
    if (value.durationMinutes == null) {
      ctx.addIssue({
        code: "custom",
        path: ["durationMinutes"],
        message: "Nhập thời lượng (phút) cho hoạt động online/offline.",
      });
    }
  });

export const updateActivitySchema = z
  .object({
    code: z.string().trim().min(1, "Mã hoạt động là bắt buộc.").optional(),
    courseId: z.string().uuid("ID khóa học không hợp lệ.").optional(),
    name: z.string().min(1, "Tên hoạt động là bắt buộc.").optional(),
    activityType: activityTypeSchema.optional(),
    description: z.string().nullable().optional(),
    activityOrder: z.number().int().min(1, "Thứ tự hoạt động phải lớn hơn 0.").optional(),
    durationMinutes: durationMinutesSchema.optional(),
    requireQrCheckin: z.boolean().optional(),
    requireMediaEvidence: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.activityType === "SelfPaced") return;
    if (value.activityType && value.durationMinutes == null) {
      ctx.addIssue({
        code: "custom",
        path: ["durationMinutes"],
        message: "Nhập thời lượng (phút) cho hoạt động online/offline.",
      });
    }
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
