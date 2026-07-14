import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createModuleSchema,
  moduleIdParamSchema,
  updateModuleSchema,
  type CreateModuleInput,
  type UpdateModuleInput,
} from "@/lib/validations/curriculum";

import {
  createModuleResponseSchema,
  deleteModuleResponseSchema,
  getModuleByIdResponseSchema,
  getModulesResponseSchema,
  moduleMutationValueSchema,
  updateModuleResponseSchema,
  type CreateModuleResult,
  type DeleteModuleResult,
  type GetModuleByIdResult,
  type GetModulesResult,
  type UpdateModuleResult,
} from "./schemas";

export type {
  GetModuleByIdResponse,
  GetModuleByIdResult,
  CreateModuleResponse,
  CreateModuleResult,
  UpdateModuleResponse,
  UpdateModuleResult,
  DeleteModuleResponse,
  DeleteModuleResult,
  GetModulesResponse,
  GetModulesResult,
} from "./schemas";

export type { Module, ModuleCourse, ModuleType } from "@/lib/api/entities/module";

const MODULES_BASE = "/api/modules";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

export async function getModuleById(id: string): Promise<GetModuleByIdResult> {
  const { id: moduleId } = moduleIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${MODULES_BASE}/${moduleId}`,
    getModuleByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export const createModule = createApiPost({
  path: MODULES_BASE,
  input: createModuleSchema,
  value: moduleMutationValueSchema,
});

export async function updateModule(
  id: string,
  input: UpdateModuleInput,
): Promise<UpdateModuleResult> {
  const { id: moduleId } = moduleIdParamSchema.parse({ id });
  const body = updateModuleSchema.parse(input);

  const response = await apiFetchParsed(
    `${MODULES_BASE}/${moduleId}`,
    updateModuleResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteModule(id: string): Promise<DeleteModuleResult> {
  const { id: moduleId } = moduleIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${MODULES_BASE}/${moduleId}`,
    deleteModuleResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export type GetModulesQuery = {
  search?: string;
  sortBy?: string;
  isDescending?: boolean;
  page?: number;
  pageSize?: number;
  code?: string;
  moduleType?: string;
};

export async function getModules(query: GetModulesQuery = {}): Promise<GetModulesResult> {
  const searchParams = new URLSearchParams();
  if (query.search) searchParams.append("search", query.search);
  if (query.sortBy) searchParams.append("sortBy", query.sortBy);
  if (query.isDescending !== undefined) searchParams.append("isDescending", String(query.isDescending));
  if (query.page) searchParams.append("page", String(query.page));
  if (query.pageSize) searchParams.append("pageSize", String(query.pageSize));
  if (query.code) searchParams.append("code", query.code);
  if (query.moduleType) searchParams.append("moduleType", query.moduleType);

  const queryString = searchParams.toString();
  const path = queryString ? `${MODULES_BASE}?${queryString}` : MODULES_BASE;

  const response = await apiFetchParsed(
    path,
    getModulesResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
