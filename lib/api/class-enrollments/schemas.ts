import { z } from "zod";

import { classEnrollmentSchema } from "@/lib/api/entities/class-enrollment";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedClassEnrollmentsSchema =
  createPaginatedSchema(classEnrollmentSchema);

export const classEnrollmentValueSchema = createApiValueSchema(classEnrollmentSchema);
export const classEnrollmentsListValueSchema = createApiValueSchema(
  paginatedClassEnrollmentsSchema,
);

export const classEnrollmentResponseSchema = createApiResponseSchema(
  classEnrollmentValueSchema,
);
export const getClassEnrollmentsByProgramResponseSchema = createApiResponseSchema(
  classEnrollmentsListValueSchema,
);

export type ClassEnrollmentResponse = z.infer<typeof classEnrollmentResponseSchema>;
export type ClassEnrollmentResult = ClassEnrollmentResponse["value"];

export type CreateClassEnrollmentResponse = ClassEnrollmentResponse;
export type CreateClassEnrollmentResult = ClassEnrollmentResult;

export type GetClassEnrollmentsByProgramResponse = z.infer<
  typeof getClassEnrollmentsByProgramResponseSchema
>;
export type GetClassEnrollmentsByProgramResult =
  GetClassEnrollmentsByProgramResponse["value"];
