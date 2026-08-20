import { z } from "zod";

/** Query params for `GET /api/highlight-video/stacks`. */
export const highlightStacksQuerySchema = z.object({
  classId: z.string().uuid("ID lớp học không hợp lệ."),
  studentId: z.string().uuid("ID học viên không hợp lệ.").optional(),
});

/** Path param for stack-scoped routes. */
export const highlightStackIdParamSchema = z.object({
  stackId: z.string().uuid("ID highlight stack không hợp lệ."),
});

/** Path params for item-scoped routes. */
export const highlightStackItemParamsSchema = z.object({
  stackId: z.string().uuid("ID highlight stack không hợp lệ."),
  itemId: z.string().uuid("ID highlight item không hợp lệ."),
});

/** Body for `POST /api/highlight-video/stacks`. */
export const createHighlightStackSchema = z.object({
  classId: z.string().uuid("ID lớp học không hợp lệ."),
  studentId: z.string().uuid("ID học viên không hợp lệ.").nullable().optional(),
  strengthDescription: z.string().nullable().optional(),
});

const highlightTimeRangeInputSchema = z.object({
  start: z.string().nullable().optional(),
  end: z.string().nullable().optional(),
});

/** Body for `POST /api/highlight-video/stacks/{stackId}/items/{itemId}/trim`. */
export const trimHighlightVideoSchema = z.object({
  trimDescription: z.string().nullable().optional(),
  excludeRanges: z.array(highlightTimeRangeInputSchema).nullable().optional(),
});

/** Body for `POST /api/highlight-video/stacks/{stackId}/items/{itemId}/add-segment`. */
export const addHighlightSegmentSchema = z.object({
  mediaId: z.string().uuid("ID media không hợp lệ."),
  start: z.string().nullable().optional(),
  end: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type HighlightStacksQuery = z.infer<typeof highlightStacksQuerySchema>;
export type HighlightStackIdParam = z.infer<typeof highlightStackIdParamSchema>;
export type HighlightStackItemParams = z.infer<
  typeof highlightStackItemParamsSchema
>;
export type CreateHighlightStackInput = z.infer<
  typeof createHighlightStackSchema
>;
export type TrimHighlightVideoInput = z.infer<typeof trimHighlightVideoSchema>;
export type AddHighlightSegmentInput = z.infer<
  typeof addHighlightSegmentSchema
>;
