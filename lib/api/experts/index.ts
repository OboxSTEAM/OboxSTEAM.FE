import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { expertIdParamSchema } from "@/lib/validations/experts";

import {
  getExpertByIdResponseSchema,
  type GetExpertByIdResult,
} from "./schemas";

export type {
  GetExpertByIdResponse,
  GetExpertByIdResult,
} from "./schemas";

export type { Expert, ExpertProgram, ProgramExpert } from "@/lib/api/entities/expert";

const EXPERTS_BASE = "/api/experts";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
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
