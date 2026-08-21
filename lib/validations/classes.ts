import { z } from "zod";

import { classStatusSchema } from "@/lib/api/entities/class";
import {
  classSessionKindSchema,
  classSessionStatusSchema,
} from "@/lib/api/entities/class-session";
import { sessionAttendanceStatusSchema } from "@/lib/api/entities/session-attendance";
import { isLocalInputOnOrAfterLeadTime } from "@/lib/classes/lifecycle";

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

const classFormFieldsSchema = z.object({
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
  requiredSkillIds: z.array(z.string().uuid()).optional(),
});

function refineClassForm(
  value: z.infer<typeof classFormFieldsSchema>,
  ctx: z.RefinementCtx,
  requireCreateLeadTime: boolean,
) {
  if (value.startDate && value.endDate && value.endDate <= value.startDate) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "Ngày kết thúc phải sau ngày bắt đầu.",
    });
  }

  if (requireCreateLeadTime && value.startDate && !isLocalInputOnOrAfterLeadTime(value.startDate)) {
    ctx.addIssue({
      code: "custom",
      path: ["startDate"],
      message: "Ngày bắt đầu phải cách hôm nay ít nhất 14 ngày.",
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
}

/**
 * Manager class form fields (datetime-local). Mentor is not collected here —
 * assigned later by approving a mentor request on the class detail page.
 * Optional numbers stay as strings in the form, then coerce on submit.
 */
export function buildClassFormSchema(options?: { requireCreateLeadTime?: boolean }) {
  const requireCreateLeadTime = options?.requireCreateLeadTime ?? false;
  return classFormFieldsSchema.superRefine((value, ctx) => {
    refineClassForm(value, ctx, requireCreateLeadTime);
  });
}

/** Update-class form (no 14-day lead time). Prefer `buildClassFormSchema` for create. */
export const classFormSchema = buildClassFormSchema();

/** Manager session form fields (datetime-local). */
export const classSessionFormSchema = z
  .object({
    moduleId: z.string().uuid("Vui lòng chọn module."),
    activityId: z.string().optional(),
    assignmentId: z.string().optional(),
    sessionKind: z
      .enum(["Lesson", "FieldTrip", "AssignmentWindow"])
      .optional(),
    title: z
      .string()
      .min(1, "Tiêu đề buổi học không được để trống.")
      .max(255, "Tiêu đề buổi học tối đa 255 ký tự."),
    description: z.string().optional(),
    startTime: z.string().min(1, "Thời gian bắt đầu không được để trống."),
    /** Required for assignment windows; display-only for activity (BE derives End). */
    endTime: z.string().optional(),
    location: z.string().max(500, "Địa điểm tối đa 500 ký tự.").optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    meetingUrl: z
      .string()
      .max(2048, "Link buổi học tối đa 2048 ký tự.")
      .optional(),
    requiresAttendance: z.boolean().optional(),
    status: classSessionStatusSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const hasActivity = Boolean(value.activityId?.trim());
    const hasAssignment = Boolean(value.assignmentId?.trim());
    if (hasActivity === hasAssignment) {
      ctx.addIssue({
        code: "custom",
        path: hasActivity ? ["assignmentId"] : ["activityId"],
        message: "Chọn đúng một mục chương trình: hoạt động hoặc bài tập.",
      });
    }

    if (hasAssignment) {
      if (!value.endTime?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "Thời gian kết thúc không được để trống.",
        });
      } else if (
        value.startTime &&
        value.endTime &&
        value.endTime <= value.startTime
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "Thời gian kết thúc phải sau thời gian bắt đầu.",
        });
      }
    }

    const latText = value.latitude?.trim();
    const lngText = value.longitude?.trim();
    const hasLat = Boolean(latText);
    const hasLng = Boolean(lngText);
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: "custom",
        path: hasLat ? ["longitude"] : ["latitude"],
        message: "Nhập cả vĩ độ và kinh độ, hoặc để trống cả hai.",
      });
      return;
    }
    if (hasLat && hasLng) {
      const lat = Number(latText);
      const lng = Number(lngText);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        ctx.addIssue({
          code: "custom",
          path: ["latitude"],
          message: "Vĩ độ phải từ -90 đến 90.",
        });
      }
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        ctx.addIssue({
          code: "custom",
          path: ["longitude"],
          message: "Kinh độ phải từ -180 đến 180.",
        });
      }
    }
  });

/** .NET `DayOfWeek` names for bulk session generation. */
export const dotnetDayOfWeekSchema = z.enum([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);

/** `latitude`/`longitude` must be sent together when either is present. */
export const sessionCoordinatesSchema = z
  .object({
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const hasLat = value.latitude != null;
    const hasLng = value.longitude != null;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: "custom",
        message: "Vui lòng nhập cả vĩ độ và kinh độ.",
        path: hasLat ? ["longitude"] : ["latitude"],
      });
    }
  });

/** Body for `POST /api/classes/{classId}/sessions/generate`. */
export const generateClassSessionsSchema = z
  .object({
    daysOfWeek: z
      .array(dotnetDayOfWeekSchema)
      .min(1, "Chọn ít nhất một ngày trong tuần."),
    sessionStartTime: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, "Giờ bắt đầu phải theo định dạng HH:mm:ss (UTC)."),
    sessionEndTime: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, "Giờ kết thúc phải theo định dạng HH:mm:ss (UTC)."),
  })
  .superRefine((value, ctx) => {
    if (value.sessionEndTime <= value.sessionStartTime) {
      ctx.addIssue({
        code: "custom",
        message: "Giờ kết thúc phải sau giờ bắt đầu.",
        path: ["sessionEndTime"],
      });
    }
  });

function refineCurriculumItemXor(
  value: { activityId?: string | null; assignmentId?: string | null },
  ctx: z.RefinementCtx,
  required: boolean,
) {
  const activityId = value.activityId?.trim() || null;
  const assignmentId = value.assignmentId?.trim() || null;
  const hasActivity = Boolean(activityId);
  const hasAssignment = Boolean(assignmentId);
  const touched =
    value.activityId !== undefined || value.assignmentId !== undefined;

  if (!required && !touched) return;
  if (hasActivity === hasAssignment) {
    ctx.addIssue({
      code: "custom",
      path: hasActivity ? ["assignmentId"] : ["activityId"],
      message: "Chọn đúng một mục chương trình: hoạt động hoặc bài tập.",
    });
  }
}

const classSessionBodySchema = z.object({
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
  /** Required for assignment; omit for activity (BE = Start + DurationMinutes). */
  endTime: z.string().min(1, "Thời gian kết thúc không được để trống.").optional(),
  location: z
    .string()
    .max(500, "Địa điểm tối đa 500 ký tự.")
    .nullable()
    .optional(),
  meetingUrl: z
    .string()
    .max(2048, "Link buổi học tối đa 2048 ký tự.")
    .nullable()
    .optional(),
  requiresAttendance: z.boolean().optional(),
  requiresMentorCheckIn: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

function refineSessionEndTimeForCurriculumItem(
  value: {
    activityId?: string | null;
    assignmentId?: string | null;
    endTime?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  const hasAssignment = Boolean(value.assignmentId?.trim());
  if (hasAssignment && !value.endTime?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["endTime"],
      message: "Buổi bài tập cần thời gian kết thúc.",
    });
  }
}

/** Body for `POST /api/classes/{classId}/sessions`. */
export const createClassSessionSchema = classSessionBodySchema.superRefine(
  (value, ctx) => {
    refineCurriculumItemXor(value, ctx, true);
    refineSessionEndTimeForCurriculumItem(value, ctx);
  },
);

/** Body for `PUT /api/classes/{classId}/sessions/{id}`. */
export const updateClassSessionSchema = classSessionBodySchema
  .omit({ classId: true })
  .partial()
  .extend({
    status: classSessionStatusSchema.optional(),
  })
  .superRefine((value, ctx) => {
    refineCurriculumItemXor(value, ctx, false);
    // Only enforce End when this update sets/keeps an assignment link.
    if (value.assignmentId !== undefined || value.endTime !== undefined) {
      const hasAssignment = Boolean(value.assignmentId?.trim());
      if (hasAssignment && value.endTime !== undefined && !value.endTime?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "Buổi bài tập cần thời gian kết thúc.",
        });
      }
    }
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
export type DotNetDayOfWeek = z.infer<typeof dotnetDayOfWeekSchema>;
export type GenerateClassSessionsInput = z.infer<typeof generateClassSessionsSchema>;
