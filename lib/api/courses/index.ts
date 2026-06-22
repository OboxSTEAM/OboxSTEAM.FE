import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { courseIdParamSchema } from "@/lib/validations/curriculum";

import {
  getCourseByIdResponseSchema,
  type GetCourseByIdResult,
} from "./schemas";

export type {
  GetCourseByIdResponse,
  GetCourseByIdResult,
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
