import { z } from "zod";

export const highlightGenerationKindSchema = z.enum([
  "Initial",
  "Trim",
  "SegmentAdd",
]);

export const highlightVideoItemStatusSchema = z.enum([
  "None",
  "Processing",
  "Completed",
  "Failed",
  "Cancelled",
]);

export const highlightTimeRangeSchema = z.object({
  start: z.string().nullable(),
  end: z.string().nullable(),
});

export const highlightSourceSegmentSchema = z.object({
  startMs: z.number().int(),
  endMs: z.number().int().nullable(),
  outputStartMs: z.number().int().nullable().nullish().transform((v) => v ?? null),
  outputEndMs: z.number().int().nullable().nullish().transform((v) => v ?? null),
});

export const highlightSourceClipSchema = z.object({
  mediaId: z.string().uuid(),
  classId: z.string().uuid().nullable().nullish().transform((v) => v ?? null),
  classSessionId: z
    .string()
    .uuid()
    .nullable()
    .nullish()
    .transform((v) => v ?? null),
  activityId: z.string().uuid().nullable().nullish().transform((v) => v ?? null),
  activityName: z.string().nullable().nullish().transform((v) => v ?? null),
  segments: z
    .array(highlightSourceSegmentSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const highlightVideoItemSchema = z.object({
  id: z.string().uuid(),
  stackId: z.string().uuid(),
  parentItemId: z.string().uuid().nullable(),
  generationKind: highlightGenerationKindSchema,
  videoUrl: z.string().nullable(),
  durationMs: z.number().int().nullable(),
  status: highlightVideoItemStatusSchema,
  statusLabel: z.string().nullable(),
  requestedAt: z.string().nullable(),
  failureReason: z.string().nullable(),
  trimDescription: z.string().nullable(),
  trimExcludeRanges: z
    .array(highlightTimeRangeSchema)
    .nullish()
    .transform((value) => value ?? []),
  sourceClips: z
    .array(highlightSourceClipSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const highlightVideoStackSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
  strengthDescription: z.string().nullable(),
  createdAt: z.string(),
  itemCount: z.number().int(),
  maxItems: z.number().int(),
  hasProcessingItem: z.boolean(),
  canCreateItem: z.boolean(),
  items: z
    .array(highlightVideoItemSchema)
    .nullish()
    .transform((value) => value ?? []),
});

/** Face-tagged ranges on a class video for add-segment. */
export const highlightFaceSegmentSchema = z.object({
  startMs: z.number().int(),
  endMs: z.number().int(),
});

/** Tagged source media for a stack student (`GET .../source-media`). */
export const highlightSourceMediaSchema = z.object({
  mediaId: z.string().uuid(),
  fileUrl: z.string().nullable(),
  classId: z.string().uuid(),
  classSessionId: z.string().uuid().nullable(),
  durationMs: z.number().int().nullable(),
  uploadedAt: z.string().nullable(),
  faceSegments: z
    .array(highlightFaceSegmentSchema)
    .nullish()
    .transform((value) => value ?? []),
});

/** Item job progress (`GET .../items/{itemId}/progress`). */
export const highlightVideoProgressSchema = z.object({
  stackId: z.string().uuid(),
  itemId: z.string().uuid(),
  status: highlightVideoItemStatusSchema,
  statusLabel: z.string().nullable(),
  phase: z.string().nullable(),
  percentComplete: z.number().int().nullable(),
  failureReason: z.string().nullable(),
  videoUrl: z.string().nullable(),
  isTerminal: z.boolean(),
});

export type HighlightGenerationKind = z.infer<
  typeof highlightGenerationKindSchema
>;
export type HighlightVideoItemStatus = z.infer<
  typeof highlightVideoItemStatusSchema
>;
export type HighlightTimeRange = z.infer<typeof highlightTimeRangeSchema>;
export type HighlightSourceSegment = z.infer<
  typeof highlightSourceSegmentSchema
>;
export type HighlightSourceClip = z.infer<typeof highlightSourceClipSchema>;
export type HighlightVideoItem = z.infer<typeof highlightVideoItemSchema>;
export type HighlightVideoStack = z.infer<typeof highlightVideoStackSchema>;
export type HighlightFaceSegment = z.infer<typeof highlightFaceSegmentSchema>;
export type HighlightSourceMedia = z.infer<typeof highlightSourceMediaSchema>;
export type HighlightVideoProgress = z.infer<
  typeof highlightVideoProgressSchema
>;
