import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createCourseSchema,
  courseIdParamSchema,
  updateCourseSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
} from "@/lib/validations/curriculum";

import {
  createCourseResponseSchema,
  deleteCourseResponseSchema,
  getCourseByIdResponseSchema,
  courseMutationValueSchema,
  updateCourseResponseSchema,
  type CreateCourseResult,
  type DeleteCourseResult,
  type GetCourseByIdResult,
  type UpdateCourseResult,
} from "./schemas";

export type {
  GetCourseByIdResponse,
  GetCourseByIdResult,
  CreateCourseResponse,
  CreateCourseResult,
  UpdateCourseResponse,
  UpdateCourseResult,
  DeleteCourseResponse,
  DeleteCourseResult,
} from "./schemas";

export type { Course, CurriculumCourse } from "@/lib/api/entities/course";

const COURSES_BASE = "/api/courses";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

export async function getCourseById(id: string): Promise<GetCourseByIdResult> {
  const { id: courseId } = courseIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${COURSES_BASE}/${courseId}`,
    getCourseByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export const createCourse = createApiPost({
  path: COURSES_BASE,
  input: createCourseSchema,
  value: courseMutationValueSchema,
});

export async function updateCourse(
  id: string,
  input: UpdateCourseInput,
): Promise<UpdateCourseResult> {
  const { id: courseId } = courseIdParamSchema.parse({ id });
  const body = updateCourseSchema.parse(input);

  const response = await apiFetchParsed(
    `${COURSES_BASE}/${courseId}`,
    updateCourseResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteCourse(id: string): Promise<DeleteCourseResult> {
  const { id: courseId } = courseIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${COURSES_BASE}/${courseId}`,
    deleteCourseResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
