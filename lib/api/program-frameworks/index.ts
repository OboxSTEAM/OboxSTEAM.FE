import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createProgramFrameworkSchema,
  frameworkVersionIdParamSchema,
  programFrameworkIdParamSchema,
  programFrameworkListQuerySchema,
  updateProgramFrameworkSchema,
  type CreateProgramFrameworkInput,
  type ProgramFrameworkListQuery,
  type UpdateProgramFrameworkInput,
} from "@/lib/validations/program-frameworks";

import {
  archiveProgramFrameworkResponseSchema,
  createFrameworkDraftVersionResponseSchema,
  createProgramFrameworkResponseSchema,
  deleteProgramFrameworkResponseSchema,
  getFrameworkVersionResponseSchema,
  getFrameworkVersionsResponseSchema,
  getProgramFrameworkByIdResponseSchema,
  getProgramFrameworksResponseSchema,
  publishFrameworkVersionResponseSchema,
  updateProgramFrameworkResponseSchema,
  type ArchiveProgramFrameworkResult,
  type CreateFrameworkDraftVersionResult,
  type CreateProgramFrameworkResult,
  type DeleteProgramFrameworkResult,
  type GetFrameworkVersionResult,
  type GetFrameworkVersionsResult,
  type GetProgramFrameworkByIdResult,
  type GetProgramFrameworksResult,
  type PublishFrameworkVersionResult,
  type UpdateProgramFrameworkResult,
} from "./schemas";

export type {
  ArchiveProgramFrameworkResponse,
  ArchiveProgramFrameworkResult,
  CreateFrameworkDraftVersionResponse,
  CreateFrameworkDraftVersionResult,
  CreateProgramFrameworkResponse,
  CreateProgramFrameworkResult,
  DeleteProgramFrameworkResponse,
  DeleteProgramFrameworkResult,
  GetFrameworkVersionResponse,
  GetFrameworkVersionResult,
  GetFrameworkVersionsResponse,
  GetFrameworkVersionsResult,
  GetProgramFrameworkByIdResponse,
  GetProgramFrameworkByIdResult,
  GetProgramFrameworksResponse,
  GetProgramFrameworksResult,
  PublishFrameworkVersionResponse,
  PublishFrameworkVersionResult,
  UpdateProgramFrameworkResponse,
  UpdateProgramFrameworkResult,
} from "./schemas";

export type {
  FrameworkRuleFields,
  ProgramFramework,
  ProgramFrameworkVersion,
} from "@/lib/api/entities/program-framework";

export type {
  CreateProgramFrameworkInput,
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

export async function archiveProgramFramework(
  id: string,
): Promise<ArchiveProgramFrameworkResult> {
  const { id: frameworkId } = programFrameworkIdParamSchema.parse({ id });
  const response = await apiFetchParsed(
    `${BASE}/${frameworkId}/archive`,
    archiveProgramFrameworkResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getFrameworkVersions(
  id: string,
): Promise<GetFrameworkVersionsResult> {
  const { id: frameworkId } = programFrameworkIdParamSchema.parse({ id });
  const response = await apiFetchParsed(
    `${BASE}/${frameworkId}/versions`,
    getFrameworkVersionsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getFrameworkVersion(
  frameworkId: string,
  versionId: string,
): Promise<GetFrameworkVersionResult> {
  const params = frameworkVersionIdParamSchema.parse({
    id: frameworkId,
    versionId,
  });
  const response = await apiFetchParsed(
    `${BASE}/${params.id}/versions/${params.versionId}`,
    getFrameworkVersionResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function createFrameworkDraftVersion(
  id: string,
): Promise<CreateFrameworkDraftVersionResult> {
  const { id: frameworkId } = programFrameworkIdParamSchema.parse({ id });
  const response = await apiFetchParsed(
    `${BASE}/${frameworkId}/versions/draft`,
    createFrameworkDraftVersionResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function publishFrameworkVersion(
  frameworkId: string,
  versionId: string,
): Promise<PublishFrameworkVersionResult> {
  const params = frameworkVersionIdParamSchema.parse({
    id: frameworkId,
    versionId,
  });
  const response = await apiFetchParsed(
    `${BASE}/${params.id}/versions/${params.versionId}/publish`,
    publishFrameworkVersionResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
