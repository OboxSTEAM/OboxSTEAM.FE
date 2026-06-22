import { z } from "zod";

import { courseSchema } from "@/lib/api/entities/course";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const courseDetailValueSchema = createApiValueSchema(courseSchema);

export const getCourseByIdResponseSchema = createApiResponseSchema(courseDetailValueSchema);

export type GetCourseByIdResponse = z.infer<typeof getCourseByIdResponseSchema>;
export type GetCourseByIdResult = GetCourseByIdResponse["value"];
