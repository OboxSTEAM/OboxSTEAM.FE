import { z } from "zod";

import { classStatusSchema } from "@/lib/api/entities/class";
import {
  classSessionKindSchema,
  classSessionStatusSchema,
} from "@/lib/api/entities/class-session";
import { sessionAttendanceStatusSchema } from "@/lib/api/entities/session-attendance";

export const classSortBySchema = z.enum([
  "name",
  "code",
  "startDate",
  "endDate",
  "status",
  "maxCapacity",
  "createdAt",
]);

/** Query params for `GET /api/classes`. */
export const classListQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: classSortBySchema.optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  programId: z.string().uuid().optional(),
  status: classStatusSchema.optional(),
  mentorId: z.string().uuid().optional(),
});

/** Path param for class-scoped routes. */
export const classIdParamSchema = z.object({
  classId: z.string().uuid("ID lớp học không hợp lệ."),
});

export const classSessionSortBySchema = z.enum([
  "title",
  "startTime",
  "endTime",
  "sessionKind",
  "status",
  "createdAt",
]);

/** Query params for `GET /api/classes/{classId}/sessions`. */
export const classSessionsQuerySchema = z.object({
  sortBy: classSessionSortBySchema.optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  moduleId: z.string().uuid().optional(),
  sessionKind: classSessionKindSchema.optional(),
  status: classSessionStatusSchema.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

/** Path params for session-scoped routes. */
export const classSessionParamsSchema = z.object({
  classId: z.string().uuid("ID lớp học không hợp lệ."),
  sessionId: z.string().uuid("ID buổi học không hợp lệ."),
});

/** Body for `POST /api/classes`. Mentor is assigned later via mentor requests. */
export const createClassSchema = z.object({
  code: z
    .string()
    .min(1, "Mã lớp không được để trống.")
    .max(50, "Mã lớp tối đa 50 ký tự."),
  name: z
    .string()
    .min(1, "Tên lớp không được để trống.")
    .max(255, "Tên lớp tối đa 255 ký tự."),
  programId: z.string().uuid("ID chương trình không hợp lệ."),
  mentorId: z.string().uuid("ID mentor không hợp lệ.").nullable().optional(),
  startDate: z.string().min(1, "Ngày bắt đầu không được để trống."),
  endDate: z.string().min(1, "Ngày kết thúc không được để trống."),
  maxCapacity: z
    .number()
    .int()
    .min(1, "Sĩ số tối đa phải lớn hơn 0.")
    .optional(),
  minHoursBeforeAssignmentJoin: z.number().int().optional(),
  scheduleSummary: z
    .string()
    .max(255, "Tóm tắt lịch học tối đa 255 ký tự.")
    .nullable()
    .optional(),
  requiredSkillIds: z.array(z.string().uuid()).nullable().optional(),
});

/** Body for `PUT /api/classes/{id}`. Status changes must use open/start/complete endpoints. */
export const updateClassSchema = createClassSchema.partial();

/**
 * Manager class form fields (datetime-local). Mentor is not collected here —
 * assigned later by approving a mentor request on the class detail page.
 * Optional numbers stay as strings in the form, then coerce on submit.
 */
export const classFormSchema = z
  .object({
    code: z
      .string()
      .min(1, "Mã lớp không được để trống.")
      .max(50, "Mã lớp tối đa 50 ký tự."),
    name: z
      .string()
      .min(1, "Tên lớp không được để trống.")
      .max(255, "Tên lớp tối đa 255 ký tự."),
    programId: z.string().uuid("Vui lòng chọn chương trình."),
    startDate: z.string().min(1, "Ngày bắt đầu không được để trống."),
    endDate: z.string().min(1, "Ngày kết thúc không được để trống."),
    maxCapacity: z.string().optional(),
    minHoursBeforeAssignmentJoin: z.string().optional(),
    scheduleSummary: z
      .string()
      .max(255, "Tóm tắt lịch học tối đa 255 ký tự.")
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.endDate && value.endDate <= value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Ngày kết thúc phải sau ngày bắt đầu.",
      });
    }

    if (value.maxCapacity?.trim()) {
      const n = Number(value.maxCapacity);
      if (!Number.isInteger(n) || n < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["maxCapacity"],
          message: "Sĩ số tối đa phải là số nguyên lớn hơn 0.",
        });
      }
    }

    if (value.minHoursBeforeAssignmentJoin?.trim()) {
      const n = Number(value.minHoursBeforeAssignmentJoin);
      if (!Number.isInteger(n) || n < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["minHoursBeforeAssignmentJoin"],
          message: "Số giờ không được âm.",
        });
      }
    }
  });

/** Manager session form fields (datetime-local). */
export const classSessionFormSchema = z
  .object({
    moduleId: z.string().uuid("Vui lòng chọn module."),
    activityId: z.string().optional(),
    assignmentId: z.string().optional(),
    sessionKind: classSessionKindSchema.optional(),
    title: z
      .string()
      .min(1, "Tiêu đề buổi học không được để trống.")
      .max(255, "Tiêu đề buổi học tối đa 255 ký tự."),
    description: z.string().optional(),
    startTime: z.string().min(1, "Thời gian bắt đầu không được để trống."),
    endTime: z.string().min(1, "Thời gian kết thúc không được để trống."),
    location: z.string().max(500, "Địa điểm tối đa 500 ký tự.").optional(),
    maxCapacity: z.string().optional(),
    requiresAttendance: z.boolean().optional(),
    status: classSessionStatusSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.startTime && value.endTime && value.endTime <= value.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "Thời gian kết thúc phải sau thời gian bắt đầu.",
      });
    }

    if (value.maxCapacity?.trim()) {
      const n = Number(value.maxCapacity);
      if (!Number.isInteger(n) || n < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["maxCapacity"],
          message: "Sĩ số tối đa phải là số nguyên lớn hơn 0.",
        });
      }
    }
  });

/** Body for `POST /api/classes/{classId}/sessions`. */
export const createClassSessionSchema = z.object({
  classId: z.string().uuid("ID lớp học không hợp lệ."),
  moduleId: z.string().uuid("ID module không hợp lệ."),
  activityId: z.string().uuid().nullable().optional(),
  assignmentId: z.string().uuid().nullable().optional(),
  sessionKind: classSessionKindSchema.optional(),
  title: z
    .string()
    .min(1, "Tiêu đề buổi học không được để trống.")
    .max(255, "Tiêu đề buổi học tối đa 255 ký tự."),
  description: z.string().nullable().optional(),
  startTime: z.string().min(1, "Thời gian bắt đầu không được để trống."),
  endTime: z.string().min(1, "Thời gian kết thúc không được để trống."),
  location: z
    .string()
    .max(500, "Địa điểm tối đa 500 ký tự.")
    .nullable()
    .optional(),
  maxCapacity: z.number().int().nullable().optional(),
  requiresAttendance: z.boolean().optional(),
});

/** Body for `PUT /api/classes/{classId}/sessions/{id}`. */
export const updateClassSessionSchema = createClassSessionSchema
  .omit({ classId: true })
  .partial()
  .extend({
    status: classSessionStatusSchema.optional(),
  });

/** Body for `POST /api/class-enrollments`. */
export const createClassEnrollmentSchema = z.object({
  programEnrollmentId: z.string().uuid("ID ghi danh chương trình không hợp lệ."),
  classId: z.string().uuid("ID lớp học không hợp lệ."),
});

/** Body for `PUT /api/class-enrollments/{id}` (transfer to another class). */
export const transferClassEnrollmentSchema = z.object({
  classId: z.string().uuid("ID lớp học không hợp lệ."),
});

/** Path param for `GET|PUT /api/class-enrollments/{id}`. */
export const classEnrollmentIdParamSchema = z.object({
  id: z.string().uuid("ID ghi danh lớp không hợp lệ."),
});

export const classEnrollmentSortBySchema = z.enum([
  "status",
  "enrolledAt",
  "createdAt",
  "className",
  "classCode",
]);

/** Query params for `GET /api/class-enrollments/program-enrollment/{programEnrollmentId}`. */
export const classEnrollmentsByProgramQuerySchema = z.object({
  sortBy: classEnrollmentSortBySchema.optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
});

export const sessionAttendanceSortBySchema = z.enum([
  "status",
  "checkedInAt",
  "studentId",
  "createdAt",
]);

/** Query params for `GET /api/classes/{classId}/sessions/{sessionId}/attendance`. */
export const sessionAttendanceQuerySchema = z.object({
  sortBy: sessionAttendanceSortBySchema.optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  status: sessionAttendanceStatusSchema.optional(),
  studentId: z.string().uuid().optional(),
});

/** Path params + body for `PUT .../attendance/students/{studentId}`. */
export const sessionAttendanceStudentParamsSchema = classSessionParamsSchema.extend({
  studentId: z.string().uuid("ID học viên không hợp lệ."),
});

export const updateSessionAttendanceSchema = z.object({
  status: sessionAttendanceStatusSchema,
});

export type ClassListQuery = z.infer<typeof classListQuerySchema>;
export type ClassIdParam = z.infer<typeof classIdParamSchema>;
export type ClassSessionParams = z.infer<typeof classSessionParamsSchema>;
export type ClassSessionsQuery = z.infer<typeof classSessionsQuerySchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ClassFormValues = z.infer<typeof classFormSchema>;
export type CreateClassSessionInput = z.infer<typeof createClassSessionSchema>;
export type UpdateClassSessionInput = z.infer<typeof updateClassSessionSchema>;
export type ClassSessionFormValues = z.infer<typeof classSessionFormSchema>;
export type CreateClassEnrollmentInput = z.infer<typeof createClassEnrollmentSchema>;
export type TransferClassEnrollmentInput = z.infer<typeof transferClassEnrollmentSchema>;
export type ClassEnrollmentIdParam = z.infer<typeof classEnrollmentIdParamSchema>;
export type ClassEnrollmentsByProgramQuery = z.infer<
  typeof classEnrollmentsByProgramQuerySchema
>;
export type SessionAttendanceQuery = z.infer<typeof sessionAttendanceQuerySchema>;
export type SessionAttendanceStudentParams = z.infer<
  typeof sessionAttendanceStudentParamsSchema
>;
export type UpdateSessionAttendanceInput = z.infer<typeof updateSessionAttendanceSchema>;
