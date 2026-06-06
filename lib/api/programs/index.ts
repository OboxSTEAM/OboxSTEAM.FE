import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createProgramSchema,
  programIdParamSchema,
  programListQuerySchema,
  updateProgramSchema,
} from "@/lib/validations/programs";

import {
  deleteProgramResponseSchema,
  getProgramByIdResponseSchema,
  getProgramsResponseSchema,
  getProgramsWithModulesResponseSchema,
  programMutationValueSchema,
  updateProgramResponseSchema,
  type CreateProgramResult,
  type DeleteProgramResult,
  type GetProgramByIdResult,
  type GetProgramsResult,
  type GetProgramsWithModulesResult,
  type UpdateProgramResult,
} from "./schemas";

export type {
  CreateProgramResponse,
  CreateProgramResult,
  DeleteProgramResponse,
  DeleteProgramResult,
  GetProgramByIdResponse,
  GetProgramByIdResult,
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

export type {
  Program,
  ProgramLevel,
  ProgramWithModules,
} from "@/lib/api/entities/program";

export type { Paginated } from "@/lib/api/entities/pagination";

export type ProgramListQuery = z.infer<typeof programListQuerySchema>;
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

function buildProgramListQuery(params?: ProgramListQuery): string {
  if (!params) {
    return "";
  }

  const parsed = programListQuerySchema.parse(params);
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
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
