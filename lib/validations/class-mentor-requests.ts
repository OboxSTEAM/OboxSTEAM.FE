import { z } from "zod";

import {
  classMentorRequestStatusSchema,
} from "@/lib/api/entities/class-mentor-request";

/** Query params for `GET /api/class-mentor-requests` (manager). */
export const classMentorRequestListQuerySchema = z.object({
  classId: z.string().uuid().optional(),
  mentorId: z.string().uuid().optional(),
  status: classMentorRequestStatusSchema.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
});

/** Query params for `GET /api/class-mentor-requests/mine`. */
export const myClassMentorRequestListQuerySchema = z.object({
  status: classMentorRequestStatusSchema.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
});

/** Query params for `GET /api/class-mentor-requests/board`. */
export const mentorBoardQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  programId: z.string().uuid().optional(),
  matchMySkills: z.boolean().optional(),
});

/** Path param for request-scoped routes. */
export const classMentorRequestIdParamSchema = z.object({
  id: z.string().uuid("ID yêu cầu mentor không hợp lệ."),
});

/** Body for `POST /api/class-mentor-requests`. */
export const createClassMentorRequestSchema = z.object({
  classId: z.string().uuid("ID lớp học không hợp lệ."),
  message: z
    .string()
    .max(1000, "Tin nhắn tối đa 1000 ký tự.")
    .nullable()
    .optional(),
});

/** Body for approve / reject decision. */
export const classMentorRequestDecisionSchema = z.object({
  decisionNote: z
    .string()
    .max(1000, "Ghi chú tối đa 1000 ký tự.")
    .nullable()
    .optional(),
});

export type ClassMentorRequestListQuery = z.infer<
  typeof classMentorRequestListQuerySchema
>;
export type MyClassMentorRequestListQuery = z.infer<
  typeof myClassMentorRequestListQuerySchema
>;
export type MentorBoardQuery = z.infer<typeof mentorBoardQuerySchema>;
export type ClassMentorRequestIdParam = z.infer<
  typeof classMentorRequestIdParamSchema
>;
export type CreateClassMentorRequestInput = z.infer<
  typeof createClassMentorRequestSchema
>;
export type ClassMentorRequestDecisionInput = z.infer<
  typeof classMentorRequestDecisionSchema
>;
