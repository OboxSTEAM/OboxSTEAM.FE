import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { getClassMentorRequests } from "@/lib/api/class-mentor-requests";
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
  generateClassSessionsSchema,
  type CreateClassInput,
  type CreateClassSessionInput,
  type GenerateClassSessionsInput,
  type UpdateClassInput,
  type UpdateClassSessionInput,
  type UpdateSessionAttendanceInput,
} from "@/lib/validations/classes";

import {
  classResponseSchema,
  classSessionResponseSchema,
  deleteClassSessionResponseSchema,
  generateClassSessionsResponseSchema,
  getClassCurriculumProgressResponseSchema,
  getClassActivityStudentProgressResponseSchema,
  getClassAssignmentStudentProgressResponseSchema,
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
  type GetClassCurriculumProgressResult,
  type GetClassActivityStudentProgressResult,
  type GetClassAssignmentStudentProgressResult,
  type GetClassSessionWithStudentsResult,
  type GetClassSessionsResult,
  type GenerateClassSessionsResult,
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
  GetClassCurriculumProgressResponse,
  GetClassCurriculumProgressResult,
  GetClassActivityStudentProgressResponse,
  GetClassActivityStudentProgressResult,
  GetClassAssignmentStudentProgressResponse,
  GetClassAssignmentStudentProgressResult,
  GetClassSessionWithStudentsResponse,
  GetClassSessionWithStudentsResult,
  GetClassSessionsResponse,
  GetClassSessionsResult,
  GenerateClassSessionsResponse,
  GenerateClassSessionsResult,
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
  ClassKind,
  ClassStatus,
  ClassWithSessions,
} from "@/lib/api/entities/class";

export type {
  ClassCurriculumActivityNavStatus,
  ClassCurriculumActivityProgress,
  ClassCurriculumAssignmentNavStatus,
  ClassCurriculumAssignmentProgress,
  ClassCurriculumModuleProgress,
  ClassCurriculumProgress,
} from "@/lib/api/entities/class-curriculum-progress";

export type {
  ActivityCompletionSource,
  ClassActivityStudentProgress,
  ClassActivityStudentProgressItem,
  ClassAssignmentStudentProgress,
  ClassAssignmentStudentProgressItem,
} from "@/lib/api/entities/class-student-progress";

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
  GenerateClassSessionsInput,
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
 * For unassigned classes, also resolve pending mentor request count.
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
        const detailData = detail?.data;
        if (!detailData) return item;

        const mentorId = detailData.mentorId ?? item.mentorId;
        let pendingMentorRequestCount =
          detailData.pendingMentorRequestCount ??
          item.pendingMentorRequestCount ??
          0;

        if (!mentorId) {
          try {
            const pending = await getClassMentorRequests({
              classId: item.id,
              status: "Pending",
              page: 1,
              pageSize: 1,
            });
            pendingMentorRequestCount = pending?.data?.totalCount ?? pendingMentorRequestCount;
          } catch {
            // Keep detail/list count if request list fails.
          }
        }

        return {
          ...item,
          seatsTaken:
            typeof detailData.seatsTaken === "number"
              ? detailData.seatsTaken
              : item.seatsTaken,
          mentorId,
          pendingMentorRequestCount,
        };
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

/** Class-aggregate activity/assignment progress for the mentor curriculum tree. */
export async function getClassCurriculumProgress(
  classId: string,
): Promise<GetClassCurriculumProgressResult> {
  const { classId: parsedClassId } = classIdParamSchema.parse({ classId });

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsedClassId}/curriculum-progress`,
    getClassCurriculumProgressResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Per-student activity progress for the mentor curriculum detail pane. */
export async function getClassActivityStudentProgress(
  classId: string,
  activityId: string,
): Promise<GetClassActivityStudentProgressResult> {
  const { classId: parsedClassId } = classIdParamSchema.parse({ classId });
  const parsedActivityId = z
    .string()
    .uuid("ID hoạt động không hợp lệ.")
    .parse(activityId);

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsedClassId}/activities/${parsedActivityId}/student-progress`,
    getClassActivityStudentProgressResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Per-student assignment progress for the mentor curriculum detail pane. */
export async function getClassAssignmentStudentProgress(
  classId: string,
  assignmentId: string,
): Promise<GetClassAssignmentStudentProgressResult> {
  const { classId: parsedClassId } = classIdParamSchema.parse({ classId });
  const parsedAssignmentId = z
    .string()
    .uuid("ID bài tập không hợp lệ.")
    .parse(assignmentId);

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsedClassId}/assignments/${parsedAssignmentId}/student-progress`,
    getClassAssignmentStudentProgressResponseSchema,
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

/** Transitions a class Draft → ReadyForMentor. */
export async function markClassReadyForMentor(
  classId: string,
): Promise<ClassResult> {
  const { classId: parsedClassId } = classIdParamSchema.parse({ classId });

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsedClassId}/ready-for-mentor`,
    classResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Transitions a class ReadyForMentor → Open. */
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

function omitEndTimeForActivitySession<
  T extends {
    activityId?: string | null;
    assignmentId?: string | null;
    endTime?: string | null;
  },
>(body: T): Omit<T, "endTime"> | T {
  const hasActivity = Boolean(body.activityId?.trim());
  const hasAssignment = Boolean(body.assignmentId?.trim());
  if (hasActivity && !hasAssignment && "endTime" in body) {
    const { endTime: _omit, ...rest } = body;
    return rest;
  }
  return body;
}

/** BE derives SessionKind from the curriculum item — never send it. */
function omitClientSessionKind<T extends object>(
  body: T,
): Omit<T, "sessionKind"> {
  if (!("sessionKind" in body)) {
    return body as Omit<T, "sessionKind">;
  }
  const { sessionKind: _omit, ...rest } = body as T & {
    sessionKind?: unknown;
  };
  return rest;
}

export async function createClassSession(
  input: CreateClassSessionInput,
): Promise<ClassSessionResult> {
  const parsed = createClassSessionSchema.parse(input);
  const body = omitClientSessionKind(omitEndTimeForActivitySession(parsed));

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsed.classId}/sessions`,
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
  const parsedParams = classSessionParamsSchema.parse({ classId, sessionId });
  const parsed = updateClassSessionSchema.parse(input);
  const body = omitClientSessionKind(omitEndTimeForActivitySession(parsed));

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsedParams.classId}/sessions/${parsedParams.sessionId}`,
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

/** Bulk-generate weekly sessions from curriculum order (Admin/Manager). */
export async function generateClassSessions(
  classId: string,
  input: GenerateClassSessionsInput,
): Promise<GenerateClassSessionsResult> {
  const { classId: parsedClassId } = classIdParamSchema.parse({ classId });
  const body = generateClassSessionsSchema.parse(input);

  const response = await apiFetchParsed(
    `${CLASSES_BASE}/${parsedClassId}/sessions/generate`,
    generateClassSessionsResponseSchema,
    { method: "POST", body },
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
