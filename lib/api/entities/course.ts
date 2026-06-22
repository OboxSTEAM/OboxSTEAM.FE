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
  code: z.string(),
  moduleId: z.string(),
  mentorId: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  activities: z.array(activitySchema).default([]),
});

export type CurriculumCourse = z.infer<typeof curriculumCourseSchema>;
export type Course = z.infer<typeof courseSchema>;
