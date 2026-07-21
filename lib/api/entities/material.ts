import { z } from "zod";

export const materialTypeSchema = z.string();

/** Compact material reference in the program curriculum tree. */
export const curriculumMaterialSummarySchema = z.object({
  materialId: z.string(),
  materialName: z.string(),
  materialType: materialTypeSchema,
});

/** Full material payload on activity detail (fileUrl omitted until enrollment-scoped fetch). */
export const activityMaterialSchema = z.object({
  id: z.string(),
  activityId: z.string(),
  title: z.string(),
  materialType: materialTypeSchema,
  fileUrl: z.string().nullable(),
  fileSizeBytes: z.number().nullable(),
  uploaderId: z.string(),
  uploadedAt: z.string(),
});

/** Full material with signed file URL from `GET /api/materials/activity/{activityId}`. */
export const materialSchema = z.object({
  id: z.string(),
  activityId: z.string(),
  title: z.string(),
  materialType: materialTypeSchema,
  fileUrl: z.string(),
  fileSizeBytes: z.number().nullable(),
  uploaderId: z.string(),
  uploadedAt: z.string(),
});

/** Row in the global material list (`GET /api/materials`) — carries deep-link context. */
export const materialListItemSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  materialType: materialTypeSchema,
  uploadedAt: z.string(),
  activityId: z.string(),
  activityName: z.string().nullable(),
  courseId: z.string(),
  courseName: z.string().nullable(),
  programId: z.string(),
  programName: z.string().nullable(),
});

export type MaterialType = z.infer<typeof materialTypeSchema>;
export type CurriculumMaterialSummary = z.infer<typeof curriculumMaterialSummarySchema>;
export type ActivityMaterial = z.infer<typeof activityMaterialSchema>;
export type Material = z.infer<typeof materialSchema>;
export type MaterialListItem = z.infer<typeof materialListItemSchema>;
