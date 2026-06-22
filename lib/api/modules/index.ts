import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { moduleIdParamSchema } from "@/lib/validations/curriculum";

import {
  getModuleByIdResponseSchema,
  type GetModuleByIdResult,
} from "./schemas";

export type {
  GetModuleByIdResponse,
  GetModuleByIdResult,
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
