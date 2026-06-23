import { z } from "zod";

/** Per-student nav status on enrollment curriculum tree nodes. */
export const activityNavStatusSchema = z.enum([
  "completed",
  "current",
  "available",
  "locked",
]);

export const resumeStateKindSchema = z.enum(["video", "pdf", "doc"]);

export const resumeStateSchema = z.object({
  kind: resumeStateKindSchema,
  positionSeconds: z.number().nullable(),
  durationSeconds: z.number().nullable(),
  page: z.number().nullable(),
  scrollRatio: z.number().nullable(),
});

export const activityCheckpointResultSchema = z.object({
  activityId: z.string(),
  activityStatus: z.string(),
  resumeState: resumeStateSchema,
  lastAccessedAt: z.string(),
});

export const completeActivityDataSchema = z.object({
  progressPercent: z.number(),
  nextActivityId: z.string().nullable(),
  unlockedModuleIds: z.array(z.string()),
  activityStatus: activityNavStatusSchema,
});

export type ActivityNavStatus = z.infer<typeof activityNavStatusSchema>;
export type ResumeStateKind = z.infer<typeof resumeStateKindSchema>;
export type ResumeState = z.infer<typeof resumeStateSchema>;
export type ActivityCheckpointData = z.infer<typeof activityCheckpointResultSchema>;
export type CompleteActivityData = z.infer<typeof completeActivityDataSchema>;
