import { z } from "zod";

import { courseSchema } from "@/lib/api/entities/course";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const courseDetailValueSchema = createApiValueSchema(courseSchema);

export const getCourseByIdResponseSchema = createApiResponseSchema(courseDetailValueSchema);

export const paginatedCoursesSchema = createPaginatedSchema(courseSchema);
export const coursesListValueSchema = createApiValueSchema(paginatedCoursesSchema);
export const getCoursesResponseSchema = createApiResponseSchema(coursesListValueSchema);

export const courseMutationValueSchema = createApiValueSchema(courseSchema);
export const courseDeleteValueSchema = createApiValueSchema(z.boolean());

export const createCourseResponseSchema = createApiResponseSchema(courseMutationValueSchema);
export const updateCourseResponseSchema = createApiResponseSchema(courseMutationValueSchema);
export const deleteCourseResponseSchema = createApiResponseSchema(courseDeleteValueSchema);

export type GetCourseByIdResponse = z.infer<typeof getCourseByIdResponseSchema>;
export type GetCourseByIdResult = GetCourseByIdResponse["value"];

export type GetCoursesResponse = z.infer<typeof getCoursesResponseSchema>;
export type GetCoursesResult = GetCoursesResponse["value"];

export type CreateCourseResponse = z.infer<typeof createCourseResponseSchema>;
export type CreateCourseResult = CreateCourseResponse["value"];

export type UpdateCourseResponse = z.infer<typeof updateCourseResponseSchema>;
export type UpdateCourseResult = UpdateCourseResponse["value"];

export type DeleteCourseResponse = z.infer<typeof deleteCourseResponseSchema>;
export type DeleteCourseResult = DeleteCourseResponse["value"];
