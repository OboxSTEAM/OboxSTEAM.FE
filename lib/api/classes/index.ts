import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  classIdParamSchema,
  classListQuerySchema,
  classSessionParamsSchema,
  classSessionsQuerySchema,
  createClassSchema,
  createClassSessionSchema,
  sessionAttendanceQuerySchema,
  sessionAttendanceStudentParamsSchema,
  updateClassSchema,
  updateClassSessionSchema,
  updateSessionAttendanceSchema,
  type CreateClassInput,
  type CreateClassSessionInput,
  type UpdateClassInput,
  type UpdateClassSessionInput,
  type UpdateSessionAttendanceInput,
} from "@/lib/validations/classes";

import {
  classResponseSchema,
  classSessionResponseSchema,
  deleteClassSessionResponseSchema,
  getClassSessionWithStudentsResponseSchema,
  getClassSessionsResponseSchema,
  getClassWithSessionsResponseSchema,
  getClassWithStudentsResponseSchema,
  getClassesResponseSchema,
  getSessionAttendanceResponseSchema,
  sessionAttendanceResponseSchema,
  type ClassResult,
  type ClassSessionResult,
  type DeleteClassSessionResult,
  type GetClassSessionWithStudentsResult,
  type GetClassSessionsResult,
  type GetClassWithSessionsResult,
  type GetClassWithStudentsResult,
  type GetClassesResult,
  type GetSessionAttendanceResult,
  type SessionAttendanceResult,
} from "./schemas";

export type {
  ClassResponse,
  ClassResult,
  ClassSessionResponse,
  ClassSessionResult,
  DeleteClassSessionResponse,
  DeleteClassSessionResult,
  GetClassSessionWithStudentsResponse,
  GetClassSessionWithStudentsResult,
  GetClassSessionsResponse,
  GetClassSessionsResult,
  GetClassWithSessionsResponse,
  GetClassWithSessionsResult,
  GetClassWithStudentsResponse,
  GetClassWithStudentsResult,
  GetClassesResponse,
  GetClassesResult,
  GetSessionAttendanceResponse,
  GetSessionAttendanceResult,
  SessionAttendanceResponse,
  SessionAttendanceResult,
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
  ClassSessionStudent,
  ClassSessionWithStudents,
} from "@/lib/api/entities/class-session";

export type {
  SessionAttendance,
  SessionAttendanceStatus,
} from "@/lib/api/entities/session-attendance";

export type { Paginated } from "@/lib/api/entities/pagination";

export type {
  CreateClassInput,
  CreateClassSessionInput,
  UpdateClassInput,
  UpdateClassSessionInput,
  UpdateSessionAttendanceInput,
} from "@/lib/validations/classes";

export type ClassListQuery = z.infer<typeof classListQuerySchema>;
export type ClassSessionsQuery = z.infer<typeof classSessionsQuerySchema>;
export type SessionAttendanceQuery = z.infer<typeof sessionAttendanceQuerySchema>;

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

export type GetClassesOptions = {
  /**
   * List endpoint returns basic info only (SeatsTaken is not reliable).
   * When true, merges seatsTaken from GET /api/classes/{id} for the current page.
   */
  includeSeatsTaken?: boolean;
};

/**
 * List omits accurate SeatsTaken — fill from class detail for visible items.
 * @see catalog: GET /api/classes vs GET /api/classes/{id}
 */
async function enrichClassesListWithSeatsTaken(
  result: NonNullable<GetClassesResult>,
): Promise<NonNullable<GetClassesResult>> {
  const page = result.data;
  if (!page.items.length) return result;

  const items = await Promise.all(
    page.items.map(async (item) => {
      try {
        const detail = await getClassById(item.id);
        const seatsTaken = detail?.data?.seatsTaken;
        if (typeof seatsTaken !== "number") return item;
        return { ...item, seatsTaken };
      } catch {
        return item;
      }
    }),
  );

  return {
    ...result,
    data: {
      ...page,
      items,
    },
  };
}

export async function getClasses(
  params?: ClassListQuery,
  options?: GetClassesOptions,
): Promise<GetClassesResult> {
  const response = await apiFetchParsed(
    `${CLASSES_BASE}${buildQueryString(params, classListQuerySchema)}`,
    getClassesResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  const value = requireApiValue(response.value);

  if (options?.includeSeatsTaken) {
    return enrichClassesListWithSeatsTaken(value);
  }

  return value;
}

export async function getClassById(classId: string): Promise<ClassResult> {
  const { classId: parsedClassId } = classIdParamSchema.parse({ classId });

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsedClassId}`,
    classResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function createClass(input: CreateClassInput): Promise<ClassResult> {
  const body = createClassSchema.parse(input);

  const response = await apiFetchParsed(CLASSES_BASE, classResponseSchema, {
    method: "POST",
    body,
  });
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function updateClass(
  classId: string,
  input: UpdateClassInput,
): Promise<ClassResult> {
  const { classId: parsedClassId } = classIdParamSchema.parse({ classId });
  const body = updateClassSchema.parse(input);

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsedClassId}`,
    classResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Transitions a class Draft -> Open. */
export async function openClass(classId: string): Promise<ClassResult> {
  return postClassLifecycle(classId, "open");
}

/** Transitions a class Open -> InProgress. */
export async function startClass(classId: string): Promise<ClassResult> {
  return postClassLifecycle(classId, "start");
}

/** Transitions a class InProgress -> Completed. */
export async function completeClass(classId: string): Promise<ClassResult> {
  return postClassLifecycle(classId, "complete");
}

async function postClassLifecycle(
  classId: string,
  action: "open" | "start" | "complete",
): Promise<ClassResult> {
  const { classId: parsedClassId } = classIdParamSchema.parse({ classId });

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsedClassId}/${action}`,
    classResponseSchema,
    { method: "POST" },
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

export async function getClassSessionById(
  classId: string,
  sessionId: string,
): Promise<ClassSessionResult> {
  const parsed = classSessionParamsSchema.parse({ classId, sessionId });

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsed.classId}/sessions/${parsed.sessionId}`,
    classSessionResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getClassSessionWithStudents(
  classId: string,
  sessionId: string,
): Promise<GetClassSessionWithStudentsResult> {
  const parsed = classSessionParamsSchema.parse({ classId, sessionId });

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsed.classId}/sessions/with-students/${parsed.sessionId}`,
    getClassSessionWithStudentsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function createClassSession(
  input: CreateClassSessionInput,
): Promise<ClassSessionResult> {
  const body = createClassSessionSchema.parse(input);

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${body.classId}/sessions`,
    classSessionResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function updateClassSession(
  classId: string,
  sessionId: string,
  input: UpdateClassSessionInput,
): Promise<ClassSessionResult> {
  const parsed = classSessionParamsSchema.parse({ classId, sessionId });
  const body = updateClassSessionSchema.parse(input);

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsed.classId}/sessions/${parsed.sessionId}`,
    classSessionResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteClassSession(
  classId: string,
  sessionId: string,
): Promise<DeleteClassSessionResult> {
  const parsed = classSessionParamsSchema.parse({ classId, sessionId });

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsed.classId}/sessions/${parsed.sessionId}`,
    deleteClassSessionResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getSessionAttendance(
  classId: string,
  sessionId: string,
  params?: SessionAttendanceQuery,
): Promise<GetSessionAttendanceResult> {
  const parsed = classSessionParamsSchema.parse({ classId, sessionId });

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsed.classId}/sessions/${parsed.sessionId}/attendance${buildQueryString(params, sessionAttendanceQuerySchema)}`,
    getSessionAttendanceResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Upserts one student's attendance for a session (Mentor/Manager/SuperAdmin). */
export async function updateSessionAttendance(
  classId: string,
  sessionId: string,
  studentId: string,
  input: UpdateSessionAttendanceInput,
): Promise<SessionAttendanceResult> {
  const parsed = sessionAttendanceStudentParamsSchema.parse({
    classId,
    sessionId,
    studentId,
  });
  const body = updateSessionAttendanceSchema.parse(input);

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsed.classId}/sessions/${parsed.sessionId}/attendance/students/${parsed.studentId}`,
    sessionAttendanceResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
