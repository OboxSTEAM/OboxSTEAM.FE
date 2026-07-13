import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  completeActivitySchema,
  enrollmentActivityParamsSchema,
  enrollmentIdParamSchema,
  myProgramEnrollmentsQuerySchema,
  saveActivityCheckpointSchema,
  studentIdParamSchema,
  studentProgramEnrollmentsQuerySchema,
} from "@/lib/validations/program-enrollments";

import {
  completeActivityResponseSchema,
  getEnrollmentCurriculumResponseSchema,
  getMyProgramEnrollmentsResponseSchema,
  getProgramEnrollmentClassResponseSchema,
  getProgramEnrollmentModuleEnrollmentsResponseSchema,
  getStudentProgramEnrollmentsResponseSchema,
  saveActivityCheckpointResponseSchema,
  type CompleteActivityResult,
  type GetEnrollmentCurriculumResult,
  type GetMyProgramEnrollmentsResult,
  type GetProgramEnrollmentClassResult,
  type GetProgramEnrollmentModuleEnrollmentsResult,
  type GetStudentProgramEnrollmentsResult,
  type SaveActivityCheckpointResult,
} from "./schemas";

export type {
  CompleteActivityResponse,
  CompleteActivityResult,
  GetEnrollmentCurriculumResponse,
  GetEnrollmentCurriculumResult,
  GetProgramEnrollmentClassResponse,
  GetProgramEnrollmentClassResult,
  GetProgramEnrollmentModuleEnrollmentsResponse,
  GetProgramEnrollmentModuleEnrollmentsResult,
  GetMyProgramEnrollmentsResponse,
  GetMyProgramEnrollmentsResult,
  GetStudentProgramEnrollmentsResponse,
  GetStudentProgramEnrollmentsResult,
  SaveActivityCheckpointResponse,
  SaveActivityCheckpointResult,
} from "./schemas";

export type {
  ActivityCheckpointData,
  ActivityNavStatus,
  CompleteActivityData,
  ResumeState,
  ResumeStateKind,
} from "@/lib/api/entities/activity-progress";

export type {
  EnrollmentCurriculum,
  EnrollmentCurriculumActivity,
  EnrollmentCurriculumAssignment,
  EnrollmentCurriculumCourse,
  EnrollmentCurriculumMilestone,
  EnrollmentCurriculumModule,
} from "@/lib/api/entities/enrollment-curriculum";

export type {
  AssignmentType,
  EnrollmentAssignmentStatus,
} from "@/lib/api/entities/assignment";

export type {
  ProgramEnrollment,
  ProgramEnrollmentStatus,
} from "@/lib/api/entities/program-enrollment";

export type { ProgramEnrollmentClass } from "@/lib/api/entities/program-enrollment-class";

export type {
  ModuleEnrollment,
  ModuleEnrollmentStatus,
} from "@/lib/api/entities/module-enrollment";

export type MyProgramEnrollmentsQuery = z.infer<typeof myProgramEnrollmentsQuerySchema>;
export type StudentProgramEnrollmentsQuery = z.infer<
  typeof studentProgramEnrollmentsQuerySchema
>;
export type CompleteActivityInput = z.infer<typeof completeActivitySchema>;
export type SaveActivityCheckpointInput = z.infer<typeof saveActivityCheckpointSchema>;

const PROGRAM_ENROLLMENTS_BASE = "/api/program-enrollments";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildProgramEnrollmentsQuery<T extends Record<string, unknown>>(
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

export async function getMyProgramEnrollments(
  params?: MyProgramEnrollmentsQuery,
): Promise<GetMyProgramEnrollmentsResult> {
  const response = await apiFetchParsed(
    `${PROGRAM_ENROLLMENTS_BASE}/me${buildProgramEnrollmentsQuery(params, myProgramEnrollmentsQuerySchema)}`,
    getMyProgramEnrollmentsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getProgramEnrollmentsByStudentId(
  studentId: string,
  params?: StudentProgramEnrollmentsQuery,
): Promise<GetStudentProgramEnrollmentsResult> {
  const { studentId: parsedStudentId } = studentIdParamSchema.parse({ studentId });

  const response = await apiFetchParsed(
    `${PROGRAM_ENROLLMENTS_BASE}/student/${parsedStudentId}${buildProgramEnrollmentsQuery(params, studentProgramEnrollmentsQuerySchema)}`,
    getStudentProgramEnrollmentsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getEnrollmentCurriculum(
  enrollmentId: string,
): Promise<GetEnrollmentCurriculumResult> {
  const { enrollmentId: parsedEnrollmentId } = enrollmentIdParamSchema.parse({
    enrollmentId,
  });

  const response = await apiFetchParsed(
    `${PROGRAM_ENROLLMENTS_BASE}/${parsedEnrollmentId}/curriculum`,
    getEnrollmentCurriculumResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getProgramEnrollmentClass(
  enrollmentId: string,
): Promise<GetProgramEnrollmentClassResult> {
  const { enrollmentId: parsedEnrollmentId } = enrollmentIdParamSchema.parse({
    enrollmentId,
  });

  const response = await apiFetchParsed(
    `${PROGRAM_ENROLLMENTS_BASE}/${parsedEnrollmentId}/class`,
    getProgramEnrollmentClassResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/program-enrollments/{enrollmentId}/module-enrollments` */
export async function getProgramEnrollmentModuleEnrollments(
  enrollmentId: string,
): Promise<GetProgramEnrollmentModuleEnrollmentsResult> {
  const { enrollmentId: parsedEnrollmentId } = enrollmentIdParamSchema.parse({
    enrollmentId,
  });

  const response = await apiFetchParsed(
    `${PROGRAM_ENROLLMENTS_BASE}/${parsedEnrollmentId}/module-enrollments`,
    getProgramEnrollmentModuleEnrollmentsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function saveActivityCheckpoint(
  enrollmentId: string,
  activityId: string,
  input: SaveActivityCheckpointInput,
): Promise<SaveActivityCheckpointResult> {
  const { enrollmentId: parsedEnrollmentId, activityId: parsedActivityId } =
    enrollmentActivityParamsSchema.parse({ enrollmentId, activityId });
  const body = saveActivityCheckpointSchema.parse(input);

  const response = await apiFetchParsed(
    `${PROGRAM_ENROLLMENTS_BASE}/${parsedEnrollmentId}/activities/${parsedActivityId}/checkpoint`,
    saveActivityCheckpointResponseSchema,
    { method: "PATCH", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function completeActivity(
  enrollmentId: string,
  activityId: string,
  input: CompleteActivityInput,
): Promise<CompleteActivityResult> {
  const { enrollmentId: parsedEnrollmentId, activityId: parsedActivityId } =
    enrollmentActivityParamsSchema.parse({ enrollmentId, activityId });
  const body = completeActivitySchema.parse(input);

  const response = await apiFetchParsed(
    `${PROGRAM_ENROLLMENTS_BASE}/${parsedEnrollmentId}/activities/${parsedActivityId}/complete`,
    completeActivityResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
