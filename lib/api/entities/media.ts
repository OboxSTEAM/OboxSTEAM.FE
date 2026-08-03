import { z } from "zod";

export const mediaVideoStatusSchema = z.enum([
  "None",
  "Transcoding",
  "PendingTagging",
  "TaggingComplete",
  "Failed",
]);

export const faceSegmentSchema = z.object({
  startMs: z.number().int(),
  endMs: z.number().int(),
});

export const labelTimelineEntrySchema = z.object({
  timestampMs: z.number().int(),
  labelName: z.string().nullable(),
  confidence: z.number(),
});

export const mediaTagSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  studentName: z.string().nullable(),
  confidenceScore: z.number(),
  isVerified: z.boolean(),
  hasOtherFaces: z.boolean(),
  faceSegments: z
    .array(faceSegmentSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  uploaderId: z.string().uuid(),
  classId: z.string().uuid(),
  classSessionId: z.string().uuid().nullable(),
  fileUrl: z.string().nullable(),
  fileType: z.string().nullable(),
  videoStatus: mediaVideoStatusSchema,
  statusLabel: z.string().nullable(),
  isReady: z.boolean(),
  uploadedAt: z.string().nullable(),
  labelTimeline: z
    .array(labelTimelineEntrySchema)
    .nullish()
    .transform((value) => value ?? []),
  tags: z
    .array(mediaTagSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type MediaVideoStatus = z.infer<typeof mediaVideoStatusSchema>;
export type FaceSegment = z.infer<typeof faceSegmentSchema>;
export type LabelTimelineEntry = z.infer<typeof labelTimelineEntrySchema>;
export type MediaTag = z.infer<typeof mediaTagSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
