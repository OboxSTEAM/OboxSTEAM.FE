import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createProgramRequestSchema,
  programIdParamSchema,
  programListQuerySchema,
  programReviewsQuerySchema,
  reviewIdParamSchema,
  selectProgramClassSchema,
  updateProgramSchema,
  uploadProgramThumbnailSchema,
} from "@/lib/validations/programs";

import {
  deleteProgramResponseSchema,
  deleteProgramReviewResponseSchema,
  getProgramByIdResponseSchema,
  getProgramCurriculumResponseSchema,
  getProgramOpenClassesResponseSchema,
  getProgramReviewsResponseSchema,
  getProgramsResponseSchema,
  getProgramsWithModulesResponseSchema,
  createProgramResponseSchema,
  selectProgramClassResponseSchema,
  releaseProgramClassHoldResponseSchema,
  updateProgramResponseSchema,
  uploadProgramThumbnailResponseSchema,
  type CreateProgramResult,
  type DeleteProgramResult,
  type DeleteProgramReviewResult,
  type GetProgramByIdResult,
  type GetProgramCurriculumResult,
  type GetProgramOpenClassesResult,
  type GetProgramReviewsResult,
  type GetProgramsResult,
  type GetProgramsWithModulesResult,
  type SelectProgramClassResult,
  type ReleaseProgramClassHoldResult,
  type UpdateProgramResult,
  type UploadProgramThumbnailResult,
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
  GetProgramOpenClassesResponse,
  GetProgramOpenClassesResult,
  GetProgramReviewsResponse,
  GetProgramReviewsResult,
  GetProgramsResponse,
  GetProgramsResult,
  GetProgramsWithModulesResponse,
  GetProgramsWithModulesResult,
  SelectProgramClassResponse,
  SelectProgramClassResult,
  ReleaseProgramClassHoldResponse,
  ReleaseProgramClassHoldResult,
  UpdateProgramResponse,
  UpdateProgramResult,
  UploadProgramThumbnailResponse,
  UploadProgramThumbnailResult,
} from "./schemas";

export type {
  Module,
  ModuleCourse,
  ModuleType,
} from "@/lib/api/entities/module";

export type {
  OpenEnrollmentClass,
  OpenEnrollmentClassSession,
} from "@/lib/api/entities/open-enrollment-class";

export type { ProgramExpert } from "@/lib/api/entities/expert";

export type {
  Program,
  ProgramCategory,
  ProgramLevel,
  ProgramStatus,
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
export type CreateProgramInput = z.infer<typeof createProgramRequestSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type SelectProgramClassInput = z.infer<typeof selectProgramClassSchema>;

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

/**
 * `GET /api/programs/{id}/open-classes` — public recruiting-class preview.
 * Empty list means checkout must be blocked.
 */
export async function getProgramOpenClasses(
  id: string,
  params?: { preferredClassId?: string | null },
): Promise<GetProgramOpenClassesResult> {
  const { id: programId } = programIdParamSchema.parse({ id });
  const preferred = params?.preferredClassId?.trim();
  const query =
    preferred && z.string().uuid().safeParse(preferred).success
      ? `?preferredClassId=${encodeURIComponent(preferred)}`
      : "";

  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${programId}/open-classes${query}`,
    getProgramOpenClassesResponseSchema,
    { method: "GET", skipAuth: true, skipRefresh: true },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `POST /api/programs/{id}/select-class` — hold seat for 5 minutes (student only).
 * Must be called before checkout / request-parent.
 */
export async function selectProgramClass(
  id: string,
  input: SelectProgramClassInput,
): Promise<SelectProgramClassResult> {
  const { id: programId } = programIdParamSchema.parse({ id });
  const body = selectProgramClassSchema.parse(input);

  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${programId}/select-class`,
    selectProgramClassResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `POST /api/programs/{id}/release-class-hold` — release seat hold when leaving checkout.
 * Idempotent; clears PendingPayment enrollment server-side.
 */
export async function releaseProgramClassHold(
  id: string,
): Promise<ReleaseProgramClassHoldResult> {
  const { id: programId } = programIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${programId}/release-class-hold`,
    releaseProgramClassHoldResponseSchema,
    { method: "POST", body: {} },
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

/**
 * `POST /api/programs` — multipart form-data.
 * Fields bind as `data.<Property>` (+ optional `file` thumbnail).
 * Status omitted → BE defaults to Draft.
 */
export async function createProgram(
  input: CreateProgramInput,
): Promise<CreateProgramResult> {
  const parsed = createProgramRequestSchema.parse(input);
  const { file, ...fields } = parsed;

  const formData = new FormData();
  const entries: Array<[string, string | number]> = [
    ["Code", fields.code],
    ["Name", fields.name],
    ["SeriesName", fields.seriesName],
    ["Description", fields.description],
    ["Category", fields.category],
    ["Level", fields.level],
    ["EstimatedDuration", fields.estimatedDuration],
    ["SkillsGained", fields.skillsGained],
    ["Price", fields.price],
  ];

  if (fields.thumbnailUrl && !fields.thumbnailUrl.startsWith("blob:")) {
    entries.push(["ThumbnailUrl", fields.thumbnailUrl]);
  }

  for (const [key, value] of entries) {
    const text = String(value);
    // Controller binds `[FromForm] CreateProgramRequestDto data` → `data.Code`.
    // Swagger documents flat `Code` as well — send both for binder/Swagger parity.
    formData.append(`data.${key}`, text);
    formData.append(key, text);
  }

  if (file) {
    formData.append("file", file);
  }

  const response = await apiFetchParsed(
    PROGRAMS_BASE,
    createProgramResponseSchema,
    { method: "POST", body: formData },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

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

/** `POST /api/programs/{id}/thumbnail` — multipart image upload. */
export async function uploadProgramThumbnail(
  id: string,
  file: File,
): Promise<UploadProgramThumbnailResult> {
  const { id: programId } = programIdParamSchema.parse({ id });
  const { file: parsedFile } = uploadProgramThumbnailSchema.parse({ file });

  const formData = new FormData();
  formData.append("file", parsedFile);

  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${programId}/thumbnail`,
    uploadProgramThumbnailResponseSchema,
    { method: "POST", body: formData },
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
