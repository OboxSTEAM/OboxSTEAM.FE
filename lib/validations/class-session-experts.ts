import { z } from "zod";

import { classSessionExpertStatusSchema } from "@/lib/api/entities/class-session-expert";

export const classSessionExpertListQuerySchema = z.object({
  classId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  expertId: z.string().uuid().optional(),
  status: classSessionExpertStatusSchema.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

export const myClassSessionExpertListQuerySchema = z.object({
  status: classSessionExpertStatusSchema.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

export const classSessionExpertIdParamSchema = z.object({
  id: z.string().uuid("ID lời mời không hợp lệ."),
});

export const inviteClassSessionExpertSchema = z.object({
  classSessionId: z.string().uuid("ID buổi học không hợp lệ."),
  expertId: z.string().uuid("ID chuyên gia không hợp lệ."),
});

export const submitClassSessionExpertFeedbackSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nhận xét.")
    .max(4000, "Nhận xét không được quá 4000 ký tự."),
  rating: z
    .number()
    .int("Đánh giá phải là số nguyên.")
    .min(1, "Đánh giá tối thiểu là 1.")
    .max(5, "Đánh giá tối đa là 5."),
});

export type ClassSessionExpertListQuery = z.infer<
  typeof classSessionExpertListQuerySchema
>;
export type MyClassSessionExpertListQuery = z.infer<
  typeof myClassSessionExpertListQuerySchema
>;
export type InviteClassSessionExpertInput = z.infer<
  typeof inviteClassSessionExpertSchema
>;
export type SubmitClassSessionExpertFeedbackInput = z.infer<
  typeof submitClassSessionExpertFeedbackSchema
>;
