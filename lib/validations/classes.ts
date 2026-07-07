import { z } from "zod";

import { classStatusSchema } from "@/lib/api/entities/class";
import {
  classSessionKindSchema,
  classSessionStatusSchema,
} from "@/lib/api/entities/class-session";

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

/** Body for `POST /api/class-enrollments`. */
export const createClassEnrollmentSchema = z.object({
  programEnrollmentId: z.string().uuid("ID ghi danh chương trình không hợp lệ."),
  classId: z.string().uuid("ID lớp học không hợp lệ."),
});

export type ClassListQuery = z.infer<typeof classListQuerySchema>;
export type ClassIdParam = z.infer<typeof classIdParamSchema>;
export type ClassSessionsQuery = z.infer<typeof classSessionsQuerySchema>;
export type CreateClassEnrollmentInput = z.infer<typeof createClassEnrollmentSchema>;
