import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  classIdParamSchema,
  classListQuerySchema,
  classSessionsQuerySchema,
} from "@/lib/validations/classes";

import {
  getClassSessionsResponseSchema,
  getClassWithSessionsResponseSchema,
  getClassWithStudentsResponseSchema,
  getClassesResponseSchema,
  type GetClassSessionsResult,
  type GetClassWithSessionsResult,
  type GetClassWithStudentsResult,
  type GetClassesResult,
} from "./schemas";

export type {
  GetClassSessionsResponse,
  GetClassSessionsResult,
  GetClassWithSessionsResponse,
  GetClassWithSessionsResult,
  GetClassWithStudentsResponse,
  GetClassWithStudentsResult,
  GetClassesResponse,
  GetClassesResult,
} from "./schemas";

export type {
  Class,
  ClassStatus,
  ClassWithSessions,
} from "@/lib/api/entities/class";

export type {
  ClassStudentEnrollmentStatus,
  ClassStudentRoster,
} from "@/lib/api/entities/class-student";

export type {
  ClassSession,
  ClassSessionKind,
  ClassSessionStatus,
} from "@/lib/api/entities/class-session";

export type { Paginated } from "@/lib/api/entities/pagination";

export type ClassListQuery = z.infer<typeof classListQuerySchema>;
export type ClassSessionsQuery = z.infer<typeof classSessionsQuerySchema>;

const CLASSES_BASE = "/api/classes";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildQueryString<T extends Record<string, unknown>>(
  params: T | undefined,
  schema: z.ZodType<T>,
): string {
  if (!params) {
    return "";
  }

  const parsed = schema.parse(params);
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function getClasses(params?: ClassListQuery): Promise<GetClassesResult> {
  const response = await apiFetchParsed(
    `${CLASSES_BASE}${buildQueryString(params, classListQuerySchema)}`,
    getClassesResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getClassWithStudents(
  classId: string,
): Promise<GetClassWithStudentsResult> {
  const { classId: parsedClassId } = classIdParamSchema.parse({ classId });

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/with-students/${parsedClassId}`,
    getClassWithStudentsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getClassSessions(
  classId: string,
  params?: ClassSessionsQuery,
): Promise<GetClassSessionsResult> {
  const { classId: parsedClassId } = classIdParamSchema.parse({ classId });

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsedClassId}/sessions${buildQueryString(params, classSessionsQuerySchema)}`,
    getClassSessionsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getClassWithSessions(
  classId: string,
): Promise<GetClassWithSessionsResult> {
  const { classId: parsedClassId } = classIdParamSchema.parse({ classId });

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/with-sessions/${parsedClassId}`,
    getClassWithSessionsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
