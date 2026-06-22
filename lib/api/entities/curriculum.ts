import { z } from "zod";

import { curriculumCourseSchema } from "@/lib/api/entities/course";
import { moduleTypeSchema } from "@/lib/api/entities/module";

export const curriculumModuleSchema = z.object({
  moduleId: z.string(),
  moduleName: z.string(),
  moduleOrder: z.number(),
  moduleType: moduleTypeSchema,
  prerequisiteModuleId: z.string().nullable(),
  courses: z.array(curriculumCourseSchema),
  milestones: z.array(z.unknown()).default([]),
});

export const programCurriculumSchema = z.object({
  programId: z.string(),
  programName: z.string(),
  modules: z.array(curriculumModuleSchema),
});

export type CurriculumModule = z.infer<typeof curriculumModuleSchema>;
export type ProgramCurriculum = z.infer<typeof programCurriculumSchema>;
