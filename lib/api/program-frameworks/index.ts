import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createProgramFrameworkSchema,
  frameworkCriterionIdParamSchema,
  frameworkRubricCriterionRequestSchema,
  programFrameworkIdParamSchema,
  programFrameworkListQuerySchema,
  updateProgramFrameworkSchema,
  type CreateProgramFrameworkInput,
  type FrameworkRubricCriterionRequestInput,
  type ProgramFrameworkListQuery,
  type UpdateProgramFrameworkInput,
} from "@/lib/validations/program-frameworks";

import {
  createFrameworkCriterionResponseSchema,
  createProgramFrameworkResponseSchema,
  deleteFrameworkCriterionResponseSchema,
  deleteProgramFrameworkResponseSchema,
  getProgramFrameworkByIdResponseSchema,
  getProgramFrameworksResponseSchema,
  updateFrameworkCriterionResponseSchema,
  updateProgramFrameworkResponseSchema,
  type CreateFrameworkCriterionResult,
  type CreateProgramFrameworkResult,
  type DeleteFrameworkCriterionResult,
  type DeleteProgramFrameworkResult,
  type GetProgramFrameworkByIdResult,
  type GetProgramFrameworksResult,
  type UpdateFrameworkCriterionResult,
  type UpdateProgramFrameworkResult,
} from "./schemas";

export type {
  CreateFrameworkCriterionResponse,
  CreateFrameworkCriterionResult,
  CreateProgramFrameworkResponse,
  CreateProgramFrameworkResult,
  DeleteFrameworkCriterionResponse,
  DeleteFrameworkCriterionResult,
  DeleteProgramFrameworkResponse,
  DeleteProgramFrameworkResult,
  GetProgramFrameworkByIdResponse,
  GetProgramFrameworkByIdResult,
  GetProgramFrameworksResponse,
  GetProgramFrameworksResult,
  UpdateFrameworkCriterionResponse,
  UpdateFrameworkCriterionResult,
  UpdateProgramFrameworkResponse,
  UpdateProgramFrameworkResult,
} from "./schemas";

export type {
  FrameworkRubricCriterion,
  ProgramFramework,
} from "@/lib/api/entities/program-framework";

export type {
  CreateProgramFrameworkInput,
  FrameworkRubricCriterionRequestInput,
  ProgramFrameworkListQuery,
  UpdateProgramFrameworkInput,
} from "@/lib/validations/program-frameworks";

const BASE = "/api/program-frameworks";

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
    if (value !== undefined) searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function getProgramFrameworks(
  params?: ProgramFrameworkListQuery,
): Promise<GetProgramFrameworksResult> {
  const response = await apiFetchParsed(
    `${BASE}${buildQueryString(params, programFrameworkListQuerySchema)}`,
    getProgramFrameworksResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getProgramFrameworkById(
  id: string,
): Promise<GetProgramFrameworkByIdResult> {
  const { id: frameworkId } = programFrameworkIdParamSchema.parse({ id });
  const response = await apiFetchParsed(
    `${BASE}/${frameworkId}`,
    getProgramFrameworkByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function createProgramFramework(
  input: CreateProgramFrameworkInput,
): Promise<CreateProgramFrameworkResult> {
  const body = createProgramFrameworkSchema.parse(input);
  const response = await apiFetchParsed(
    BASE,
    createProgramFrameworkResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function updateProgramFramework(
  id: string,
  input: UpdateProgramFrameworkInput,
): Promise<UpdateProgramFrameworkResult> {
  const { id: frameworkId } = programFrameworkIdParamSchema.parse({ id });
  const body = updateProgramFrameworkSchema.parse(input);
  const response = await apiFetchParsed(
    `${BASE}/${frameworkId}`,
    updateProgramFrameworkResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteProgramFramework(
  id: string,
): Promise<DeleteProgramFrameworkResult> {
  const { id: frameworkId } = programFrameworkIdParamSchema.parse({ id });
  const response = await apiFetchParsed(
    `${BASE}/${frameworkId}`,
    deleteProgramFrameworkResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function addFrameworkCriterion(
  frameworkId: string,
  input: FrameworkRubricCriterionRequestInput,
): Promise<CreateFrameworkCriterionResult> {
  const { id } = programFrameworkIdParamSchema.parse({ id: frameworkId });
  const body = frameworkRubricCriterionRequestSchema.parse(input);
  const response = await apiFetchParsed(
    `${BASE}/${id}/criteria`,
    createFrameworkCriterionResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function updateFrameworkCriterion(
  frameworkId: string,
  criterionId: string,
  input: FrameworkRubricCriterionRequestInput,
): Promise<UpdateFrameworkCriterionResult> {
  const params = frameworkCriterionIdParamSchema.parse({
    id: frameworkId,
    criterionId,
  });
  const body = frameworkRubricCriterionRequestSchema.parse(input);
  const response = await apiFetchParsed(
    `${BASE}/${params.id}/criteria/${params.criterionId}`,
    updateFrameworkCriterionResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteFrameworkCriterion(
  frameworkId: string,
  criterionId: string,
): Promise<DeleteFrameworkCriterionResult> {
  const params = frameworkCriterionIdParamSchema.parse({
    id: frameworkId,
    criterionId,
  });
  const response = await apiFetchParsed(
    `${BASE}/${params.id}/criteria/${params.criterionId}`,
    deleteFrameworkCriterionResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
