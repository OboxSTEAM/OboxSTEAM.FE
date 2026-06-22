import { z } from "zod";

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

export type ModuleIdParam = z.infer<typeof moduleIdParamSchema>;
export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
export type ActivityIdParam = z.infer<typeof activityIdParamSchema>;
