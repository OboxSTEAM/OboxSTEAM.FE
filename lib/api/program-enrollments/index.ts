import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { myProgramEnrollmentsQuerySchema } from "@/lib/validations/program-enrollments";

import {
  getMyProgramEnrollmentsResponseSchema,
  type GetMyProgramEnrollmentsResult,
} from "./schemas";

export type {
  GetMyProgramEnrollmentsResponse,
  GetMyProgramEnrollmentsResult,
} from "./schemas";

export type {
  ProgramEnrollment,
  ProgramEnrollmentStatus,
} from "@/lib/api/entities/program-enrollment";

export type MyProgramEnrollmentsQuery = z.infer<
  typeof myProgramEnrollmentsQuerySchema
>;

const PROGRAM_ENROLLMENTS_BASE = "/api/program-enrollments";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildMyProgramEnrollmentsQuery(
  params?: MyProgramEnrollmentsQuery,
): string {
  if (!params) {
    return "";
  }

  const parsed = myProgramEnrollmentsQuerySchema.parse(params);
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
    `${PROGRAM_ENROLLMENTS_BASE}/me${buildMyProgramEnrollmentsQuery(params)}`,
    getMyProgramEnrollmentsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
