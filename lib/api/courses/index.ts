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
  getCoursesResponseSchema,
  courseMutationValueSchema,
  updateCourseResponseSchema,
  type CreateCourseResult,
  type DeleteCourseResult,
  type GetCourseByIdResult,
  type GetCoursesResult,
  type UpdateCourseResult,
} from "./schemas";

export type {
  GetCourseByIdResponse,
  GetCourseByIdResult,
  GetCoursesResponse,
  GetCoursesResult,
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

export type GetCoursesQuery = {
  search?: string;
  sortBy?: string;
  isDescending?: boolean;
  page?: number;
  pageSize?: number;
  code?: string;
  moduleName?: string;
};

export async function getCourses(query: GetCoursesQuery = {}): Promise<GetCoursesResult> {
  const searchParams = new URLSearchParams();
  if (query.search) searchParams.append("search", query.search);
  if (query.sortBy) searchParams.append("sortBy", query.sortBy);
  if (query.isDescending !== undefined) {
    searchParams.append("isDescending", String(query.isDescending));
  }
  if (query.page) searchParams.append("page", String(query.page));
  if (query.pageSize) searchParams.append("pageSize", String(query.pageSize));
  if (query.code) searchParams.append("code", query.code);
  if (query.moduleName) searchParams.append("moduleName", query.moduleName);

  const queryString = searchParams.toString();
  const path = queryString ? `${COURSES_BASE}?${queryString}` : COURSES_BASE;

  const response = await apiFetchParsed(path, getCoursesResponseSchema, { method: "GET" });
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
