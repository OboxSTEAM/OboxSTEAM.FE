import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  classEnrollmentIdParamSchema,
  classEnrollmentsByProgramQuerySchema,
  createClassEnrollmentSchema,
  transferClassEnrollmentSchema,
  type TransferClassEnrollmentInput,
} from "@/lib/validations/classes";

import {
  classEnrollmentResponseSchema,
  classEnrollmentValueSchema,
  getClassEnrollmentsByProgramResponseSchema,
  type ClassEnrollmentResult,
  type GetClassEnrollmentsByProgramResult,
} from "./schemas";

export type {
  ClassEnrollmentResponse,
  ClassEnrollmentResult,
  CreateClassEnrollmentResponse,
  CreateClassEnrollmentResult,
  GetClassEnrollmentsByProgramResponse,
  GetClassEnrollmentsByProgramResult,
} from "./schemas";

export type {
  ClassEnrollment,
  ClassEnrollmentStatus,
} from "@/lib/api/entities/class-enrollment";

export type { Class, ClassStatus } from "@/lib/api/entities/class";

export type { TransferClassEnrollmentInput } from "@/lib/validations/classes";

export type CreateClassEnrollmentInput = z.infer<typeof createClassEnrollmentSchema>;
export type ClassEnrollmentsByProgramQuery = z.infer<
  typeof classEnrollmentsByProgramQuerySchema
>;

const CLASS_ENROLLMENTS_BASE = "/api/class-enrollments";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

export const createClassEnrollment = createApiPost({
  path: CLASS_ENROLLMENTS_BASE,
  input: createClassEnrollmentSchema,
  value: classEnrollmentValueSchema,
});

export async function getClassEnrollmentById(
  id: string,
): Promise<ClassEnrollmentResult> {
  const { id: enrollmentId } = classEnrollmentIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${CLASS_ENROLLMENTS_BASE}/${enrollmentId}`,
    classEnrollmentResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Moves the student to another class cohort within the same program. */
export async function transferClassEnrollment(
  id: string,
  input: TransferClassEnrollmentInput,
): Promise<ClassEnrollmentResult> {
  const { id: enrollmentId } = classEnrollmentIdParamSchema.parse({ id });
  const body = transferClassEnrollmentSchema.parse(input);

  const response = await apiFetchParsed(
    `${CLASS_ENROLLMENTS_BASE}/${enrollmentId}`,
    classEnrollmentResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getClassEnrollmentsByProgramEnrollment(
  programEnrollmentId: string,
  params?: ClassEnrollmentsByProgramQuery,
): Promise<GetClassEnrollmentsByProgramResult> {
  const parsedId = z
    .string()
    .uuid("ID ghi danh chương trình không hợp lệ.")
    .parse(programEnrollmentId);

  const searchParams = new URLSearchParams();
  if (params) {
    const parsed = classEnrollmentsByProgramQuerySchema.parse(params);
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
  }
  const query = searchParams.toString();

  const response = await apiFetchParsed(
    `${CLASS_ENROLLMENTS_BASE}/program-enrollment/${parsedId}${query ? `?${query}` : ""}`,
    getClassEnrollmentsByProgramResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
