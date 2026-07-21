import { z } from "zod";

import { courseSchema } from "@/lib/api/entities/course";

export const moduleTypeSchema = z.enum(["Theory", "Experiential", "Research"]);

export const moduleCourseSchema = courseSchema;

export const moduleSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  programId: z.string(),
  name: z.string(),
  moduleType: moduleTypeSchema,
  moduleOrder: z.number(),
  prerequisiteModuleId: z.string().nullable().optional(),
  isMandatory: z.boolean(),
  price: z.number(),
  retakeFee: z.number(),
  learningOutcomes: z.preprocess(
    (val) => val ?? [],
    z.array(z.string())
  ),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  courses: z.preprocess(
    (val) => val ?? [],
    z.array(moduleCourseSchema)
  ),
});

export type ModuleType = z.infer<typeof moduleTypeSchema>;
export type ModuleCourse = z.infer<typeof moduleCourseSchema>;
export type Module = z.infer<typeof moduleSchema>;
