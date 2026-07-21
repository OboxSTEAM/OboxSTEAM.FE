import { z } from "zod";

import { activitySchema, curriculumActivitySchema } from "@/lib/api/entities/activity";

/** Course node in the program curriculum tree. */
export const curriculumCourseSchema = z.object({
  courseId: z.string(),
  courseName: z.string(),
  courseOrder: z.number(),
  activities: z.array(curriculumActivitySchema),
});

export const courseSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  moduleId: z.string(),
  mentorId: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  activities: z.preprocess(
    (val) => val ?? [],
    z.array(activitySchema)
  ),
});

export type CurriculumCourse = z.infer<typeof curriculumCourseSchema>;
export type Course = z.infer<typeof courseSchema>;
