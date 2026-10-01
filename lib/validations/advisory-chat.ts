import { z } from "zod";

import {
  curriculumTargetTypeSchema,
  discussionPinStatusSchema,
} from "@/lib/api/advisory-chat/schemas";
import { programStatusSchema } from "@/lib/api/entities/program";

export const DISCUSSION_MESSAGE_MAX_LENGTH = 4000;
export const DISCUSSION_MAX_MENTIONS = 20;
export const DISCUSSION_MAX_ATTACHMENTS = 10;
export const DISCUSSION_PAGE_SIZE = 30;
export const DISCUSSION_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const DISCUSSION_ATTACHMENT_IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
] as const;
export const DISCUSSION_ATTACHMENT_EXTENSIONS = [
  ...DISCUSSION_ATTACHMENT_IMAGE_EXTENSIONS,
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "zip",
] as const;
export const APPROVAL_COMMENT_MAX_LENGTH = 2000;

const MESSAGE_TOO_LONG = `Tin nhắn không được quá ${DISCUSSION_MESSAGE_MAX_LENGTH} ký tự.`;
const CURRICULUM_CHANGES_BASE_PATTERN = /^(lastApproval|lastSeen|start|version:\d+)$/;

export const discussionMessageIdParamSchema = z.object({
  messageId: z.string().uuid("ID tin nhắn không hợp lệ."),
});

export const discussionAttachmentIdParamSchema = z.object({
  attachmentId: z.string().uuid("ID tệp đính kèm không hợp lệ."),
});

export const postDiscussionMessageSchema = z
  .object({
    text: z.string().max(DISCUSSION_MESSAGE_MAX_LENGTH, MESSAGE_TOO_LONG),
    attachmentIds: z
      .array(z.string().uuid("Tệp đính kèm không hợp lệ."))
      .max(
        DISCUSSION_MAX_ATTACHMENTS,
        `Mỗi tin nhắn đính kèm tối đa ${DISCUSSION_MAX_ATTACHMENTS} tệp.`,
      )
      .default([]),
    clientMessageId: z.string().trim().min(1).max(100),
  })
  .refine((value) => value.text.trim().length > 0 || value.attachmentIds.length > 0, {
    message: "Tin nhắn cần có nội dung hoặc tệp đính kèm.",
    path: ["text"],
  });

export const editDiscussionMessageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Tin nhắn không được để trống.")
    .max(DISCUSSION_MESSAGE_MAX_LENGTH, MESSAGE_TOO_LONG),
});

export const discussionMessagesQuerySchema = z
  .object({
    before: z.string().trim().min(1).optional(),
    after: z.string().trim().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    targetType: curriculumTargetTypeSchema.optional(),
    targetId: z.string().uuid().optional(),
  })
  .refine((value) => !(value.before && value.after), {
    message: "Không thể dùng đồng thời before và after.",
    path: ["after"],
  })
  .refine((value) => Boolean(value.targetType) === Boolean(value.targetId), {
    message: "Cần cả loại mục và ID mục khi lọc theo mục.",
    path: ["targetId"],
  });

export const discussionPinActionSchema = z.object({
  action: z.enum(["MarkAddressed", "Reopen", "Resolve"]),
});

export const discussionPinsQuerySchema = z.object({
  status: discussionPinStatusSchema.optional(),
});

export const recordDiscussionReadSchema = z.object({
  lastDisplayedSequence: z.number().int().min(0),
  cursor: z.string().trim().min(1).optional().nullable(),
});

export const approveProgramSchema = z.object({
  curriculumVersion: z.number().int().min(0),
  comment: z
    .string()
    .trim()
    .max(
      APPROVAL_COMMENT_MAX_LENGTH,
      `Nhận xét không được quá ${APPROVAL_COMMENT_MAX_LENGTH} ký tự.`,
    )
    .optional()
    .nullable(),
});

export const revokeProgramApprovalSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(
      APPROVAL_COMMENT_MAX_LENGTH,
      `Lý do không được quá ${APPROVAL_COMMENT_MAX_LENGTH} ký tự.`,
    )
    .optional()
    .nullable(),
});

export const curriculumChangesQuerySchema = z.object({
  base: z
    .string()
    .regex(CURRICULUM_CHANGES_BASE_PATTERN, "Mốc so sánh không hợp lệ.")
    .optional(),
  to: z.number().int().min(0).optional(),
});

export const markCurriculumChangesSeenSchema = z.object({
  version: z.number().int().min(0),
});

export const advisoryProgramsQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  status: programStatusSchema.optional(),
  unreadOnly: z.boolean().optional(),
});

export type DiscussionAttachmentKind = "Image" | "File";

function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/** Client-side mirror of BE attachment rules; returns a Vietnamese error or `null` when valid. */
export function validateDiscussionAttachmentFile(file: File): string | null {
  const extension = fileExtension(file.name);
  if (!(DISCUSSION_ATTACHMENT_EXTENSIONS as readonly string[]).includes(extension)) {
    return "Chỉ hỗ trợ ảnh (PNG, JPG, GIF, WebP), PDF, Word, PowerPoint, Excel và ZIP.";
  }
  if (file.size > DISCUSSION_ATTACHMENT_MAX_BYTES) {
    return "Mỗi tệp đính kèm tối đa 20 MB.";
  }
  if (file.size === 0) {
    return "Tệp đính kèm đang trống.";
  }
  return null;
}

export function getDiscussionAttachmentKind(fileName: string): DiscussionAttachmentKind {
  return (DISCUSSION_ATTACHMENT_IMAGE_EXTENSIONS as readonly string[]).includes(
    fileExtension(fileName),
  )
    ? "Image"
    : "File";
}

export type PostDiscussionMessageInput = z.input<typeof postDiscussionMessageSchema>;
export type EditDiscussionMessageInput = z.infer<typeof editDiscussionMessageSchema>;
export type DiscussionMessagesQuery = z.infer<typeof discussionMessagesQuerySchema>;
export type DiscussionPinActionInput = z.infer<typeof discussionPinActionSchema>;
export type DiscussionPinAction = DiscussionPinActionInput["action"];
export type DiscussionPinsQuery = z.infer<typeof discussionPinsQuerySchema>;
export type RecordDiscussionReadInput = z.infer<typeof recordDiscussionReadSchema>;
export type ApproveProgramInput = z.infer<typeof approveProgramSchema>;
export type RevokeProgramApprovalInput = z.infer<typeof revokeProgramApprovalSchema>;
export type CurriculumChangesQuery = z.infer<typeof curriculumChangesQuerySchema>;
export type MarkCurriculumChangesSeenInput = z.infer<
  typeof markCurriculumChangesSeenSchema
>;
export type AdvisoryProgramsQuery = z.infer<typeof advisoryProgramsQuerySchema>;
