import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createProgramSchema,
  programIdParamSchema,
  programListQuerySchema,
  programReviewsQuerySchema,
  reviewIdParamSchema,
  updateProgramSchema,
} from "@/lib/validations/programs";

import {
  deleteProgramResponseSchema,
  deleteProgramReviewResponseSchema,
  getProgramByIdResponseSchema,
  getProgramCurriculumResponseSchema,
  getProgramReviewsResponseSchema,
  getProgramsResponseSchema,
  getProgramsWithModulesResponseSchema,
  programMutationValueSchema,
  updateProgramResponseSchema,
  type CreateProgramResult,
  type DeleteProgramResult,
  type DeleteProgramReviewResult,
  type GetProgramByIdResult,
  type GetProgramCurriculumResult,
  type GetProgramReviewsResult,
  type GetProgramsResult,
  type GetProgramsWithModulesResult,
  type UpdateProgramResult,
} from "./schemas";

export type {
  CreateProgramResponse,
  CreateProgramResult,
  DeleteProgramResponse,
  DeleteProgramResult,
  DeleteProgramReviewResponse,
  DeleteProgramReviewResult,
  GetProgramByIdResponse,
  GetProgramByIdResult,
  GetProgramCurriculumResponse,
  GetProgramCurriculumResult,
  GetProgramReviewsResponse,
  GetProgramReviewsResult,
  GetProgramsResponse,
  GetProgramsResult,
  GetProgramsWithModulesResponse,
  GetProgramsWithModulesResult,
  UpdateProgramResponse,
  UpdateProgramResult,
} from "./schemas";

export type {
  Module,
  ModuleCourse,
  ModuleType,
} from "@/lib/api/entities/module";

export type { ProgramExpert } from "@/lib/api/entities/expert";

export type {
  Program,
  ProgramCategory,
  ProgramLevel,
  ProgramWithModules,
} from "@/lib/api/entities/program";

export type {
  CurriculumModule,
  ProgramCurriculum,
} from "@/lib/api/entities/curriculum";

export type { ProgramReview } from "@/lib/api/entities/review";

export type { Paginated } from "@/lib/api/entities/pagination";

export type ProgramListQuery = z.infer<typeof programListQuerySchema>;
export type ProgramReviewsQuery = z.infer<typeof programReviewsQuerySchema>;
export type ProgramIdParam = z.infer<typeof programIdParamSchema>;
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;

const PROGRAMS_BASE = "/api/programs";

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

function buildProgramListQuery(params?: ProgramListQuery): string {
  return buildQueryString(params, programListQuerySchema);
}

function buildProgramReviewsQuery(params?: ProgramReviewsQuery): string {
  return buildQueryString(params, programReviewsQuerySchema);
}

export async function getPrograms(
  params?: ProgramListQuery,
): Promise<GetProgramsResult> {
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}${buildProgramListQuery(params)}`,
    getProgramsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getProgramsWithModules(
  params?: ProgramListQuery,
): Promise<GetProgramsWithModulesResult> {
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/with-modules${buildProgramListQuery(params)}`,
    getProgramsWithModulesResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getProgramById(id: string): Promise<GetProgramByIdResult> {
  const { id: programId } = programIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${programId}`,
    getProgramByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Students without active enrollment receive HTTP 403. */
export async function getProgramCurriculum(
  id: string,
): Promise<GetProgramCurriculumResult> {
  const { id: programId } = programIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${programId}/curriculum`,
    getProgramCurriculumResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getProgramReviews(
  id: string,
  params?: ProgramReviewsQuery,
): Promise<GetProgramReviewsResult> {
  const { id: programId } = programIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${programId}/reviews${buildProgramReviewsQuery(params)}`,
    getProgramReviewsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Soft-deletes a review. Managers, SuperAdmin, or the review owner may call this. */
export async function deleteProgramReview(
  programId: string,
  reviewId: string,
): Promise<DeleteProgramReviewResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const { reviewId: parsedReviewId } = reviewIdParamSchema.parse({ reviewId });

  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/reviews/${parsedReviewId}`,
    deleteProgramReviewResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export const createProgram = createApiPost({
  path: PROGRAMS_BASE,
  input: createProgramSchema,
  value: programMutationValueSchema,
});

export async function updateProgram(
  id: string,
  input: UpdateProgramInput,
): Promise<UpdateProgramResult> {
  const { id: programId } = programIdParamSchema.parse({ id });
  const body = updateProgramSchema.parse(input);

  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${programId}`,
    updateProgramResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteProgram(id: string): Promise<DeleteProgramResult> {
  const { id: programId } = programIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${programId}`,
    deleteProgramResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
