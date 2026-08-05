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
  /** BE sends 0–100 (%). Clamp; only (0, 1) treated as legacy ratio. */
  confidenceScore: z.coerce.number().transform((value) => {
    if (!Number.isFinite(value)) return 0;
    if (value > 0 && value < 1) {
      return Math.min(100, Math.max(0, value * 100));
    }
    return Math.min(100, Math.max(0, value));
  }),
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

/**
 * `GET /api/media/{mediaId}/progress` — transcode % + pipeline status.
 * BE may omit isFailed; derive from videoStatus when missing.
 */
export const mediaProgressSchema = z
  .object({
    mediaId: z.string().uuid().nullish(),
    videoStatus: mediaVideoStatusSchema,
    percentComplete: z.coerce.number().nullish(),
    isReady: z.boolean(),
    isFailed: z.boolean().nullish(),
    statusLabel: z.string().nullable().nullish(),
    fileUrl: z.string().nullable().nullish(),
  })
  .transform((value) => ({
    mediaId: value.mediaId ?? null,
    videoStatus: value.videoStatus,
    percentComplete:
      value.percentComplete == null
        ? null
        : Math.min(100, Math.max(0, Number(value.percentComplete))),
    isReady: value.isReady,
    isFailed: value.isFailed ?? value.videoStatus === "Failed",
    statusLabel: value.statusLabel ?? null,
    fileUrl: value.fileUrl ?? null,
  }));

export type MediaVideoStatus = z.infer<typeof mediaVideoStatusSchema>;
export type FaceSegment = z.infer<typeof faceSegmentSchema>;
export type LabelTimelineEntry = z.infer<typeof labelTimelineEntrySchema>;
export type MediaTag = z.infer<typeof mediaTagSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type MediaProgress = z.infer<typeof mediaProgressSchema>;
