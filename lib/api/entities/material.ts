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

export type MaterialType = z.infer<typeof materialTypeSchema>;
export type CurriculumMaterialSummary = z.infer<typeof curriculumMaterialSummarySchema>;
export type ActivityMaterial = z.infer<typeof activityMaterialSchema>;
export type Material = z.infer<typeof materialSchema>;
