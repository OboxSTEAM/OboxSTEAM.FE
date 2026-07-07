import { z } from "zod";

import { classEnrollmentSchema } from "@/lib/api/entities/class-enrollment";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const createClassEnrollmentValueSchema = createApiValueSchema(classEnrollmentSchema);

export const createClassEnrollmentResponseSchema = createApiResponseSchema(
  createClassEnrollmentValueSchema,
);

export type CreateClassEnrollmentResponse = z.infer<
  typeof createClassEnrollmentResponseSchema
>;
export type CreateClassEnrollmentResult = CreateClassEnrollmentResponse["value"];
