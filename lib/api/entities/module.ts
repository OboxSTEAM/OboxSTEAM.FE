import { z } from "zod";

export const moduleTypeSchema = z.enum(["Theory", "Experiential", "Research"]);

/** Placeholder until course entity is defined in the curriculum API. */
export const moduleCourseSchema = z.object({}).passthrough();

export const moduleSchema = z.object({
  id: z.string(),
  code: z.string(),
  programId: z.string(),
  name: z.string(),
  moduleType: moduleTypeSchema,
  moduleOrder: z.number(),
  prerequisiteModuleId: z.string().nullable(),
  isMandatory: z.boolean(),
  price: z.number(),
  retakeFee: z.number(),
  learningOutcomes: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  courses: z.array(moduleCourseSchema),
});

export type ModuleType = z.infer<typeof moduleTypeSchema>;
export type ModuleCourse = z.infer<typeof moduleCourseSchema>;
export type Module = z.infer<typeof moduleSchema>;
