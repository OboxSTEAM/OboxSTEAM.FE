import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createExpertSchema,
  expertIdParamSchema,
  expertListQuerySchema,
  expertProgramAssignmentSchema,
  expertProgramParamSchema,
  updateExpertSchema,
} from "@/lib/validations/experts";

import {
  createExpertResponseSchema,
  deleteExpertResponseSchema,
  expertProgramResponseSchema,
  getExpertByIdResponseSchema,
  getExpertsResponseSchema,
  updateExpertResponseSchema,
  type CreateExpertResult,
  type DeleteExpertResult,
  type ExpertProgramResult,
  type GetExpertByIdResult,
  type GetExpertsResult,
  type UpdateExpertResult,
} from "./schemas";

export type {
  CreateExpertResponse,
  CreateExpertResult,
  DeleteExpertResponse,
  DeleteExpertResult,
  ExpertProgramResponse,
  ExpertProgramResult,
  GetExpertByIdResponse,
  GetExpertByIdResult,
  GetExpertsResponse,
  GetExpertsResult,
  UpdateExpertResponse,
  UpdateExpertResult,
} from "./schemas";

export type { Expert, ExpertProgram, ProgramExpert } from "@/lib/api/entities/expert";

export type {
  CreateExpertInput,
  ExpertListQuery,
  ExpertProgramAssignmentInput,
  UpdateExpertInput,
} from "@/lib/validations/experts";

import type {
  CreateExpertInput,
  ExpertListQuery,
  ExpertProgramAssignmentInput,
  UpdateExpertInput,
} from "@/lib/validations/experts";

const EXPERTS_BASE = "/api/experts";

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
  if (!params) return "";

  const parsed = schema.parse(params);
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toExpertRequest(input: CreateExpertInput | UpdateExpertInput) {
  return {
    ...input,
    userId: input.userId || null,
  };
}

export async function getExperts(params?: ExpertListQuery): Promise<GetExpertsResult> {
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}${buildQueryString(params, expertListQuerySchema)}`,
    getExpertsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getExpertById(expertId: string): Promise<GetExpertByIdResult> {
  const { expertId: parsedExpertId } = expertIdParamSchema.parse({ expertId });

  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${parsedExpertId}`,
    getExpertByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function createExpert(
  input: CreateExpertInput,
): Promise<CreateExpertResult> {
  const body = createExpertSchema.parse(input);
  const response = await apiFetchParsed(
    EXPERTS_BASE,
    createExpertResponseSchema,
    { method: "POST", body: toExpertRequest(body) },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function updateExpert(
  expertId: string,
  input: UpdateExpertInput,
): Promise<UpdateExpertResult> {
  const { expertId: parsedExpertId } = expertIdParamSchema.parse({ expertId });
  const body = updateExpertSchema.parse(input);
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${parsedExpertId}`,
    updateExpertResponseSchema,
    { method: "PUT", body: toExpertRequest(body) },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteExpert(expertId: string): Promise<DeleteExpertResult> {
  const { expertId: parsedExpertId } = expertIdParamSchema.parse({ expertId });
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${parsedExpertId}`,
    deleteExpertResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function addExpertToProgram(
  expertId: string,
  programId: string,
  input: ExpertProgramAssignmentInput = {},
): Promise<ExpertProgramResult> {
  const params = expertProgramParamSchema.parse({ expertId, programId });
  const body = expertProgramAssignmentSchema.parse(input);
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${params.expertId}/programs/${params.programId}`,
    expertProgramResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function removeExpertFromProgram(
  expertId: string,
  programId: string,
): Promise<DeleteExpertResult> {
  const params = expertProgramParamSchema.parse({ expertId, programId });
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${params.expertId}/programs/${params.programId}`,
    deleteExpertResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
