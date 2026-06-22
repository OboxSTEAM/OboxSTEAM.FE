import { z } from "zod";

export const materialTypeSchema = z.string();

/** Compact material reference in the program curriculum tree. */
export const curriculumMaterialSummarySchema = z.object({
  materialId: z.string(),
  materialName: z.string(),
  materialType: materialTypeSchema,
});

/** Full material payload on activity detail. */
export const activityMaterialSchema = z.object({
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
