import { z } from "zod";

import { createApiPost } from "@/lib/api/create-endpoint";
import { createClassEnrollmentSchema } from "@/lib/validations/classes";

import {
  createClassEnrollmentValueSchema,
  type CreateClassEnrollmentResult,
} from "./schemas";

export type {
  CreateClassEnrollmentResponse,
  CreateClassEnrollmentResult,
} from "./schemas";

export type {
  ClassEnrollment,
  ClassEnrollmentStatus,
} from "@/lib/api/entities/class-enrollment";

export type { Class, ClassStatus } from "@/lib/api/entities/class";

export type CreateClassEnrollmentInput = z.infer<typeof createClassEnrollmentSchema>;

const CLASS_ENROLLMENTS_BASE = "/api/class-enrollments";

export const createClassEnrollment = createApiPost({
  path: CLASS_ENROLLMENTS_BASE,
  input: createClassEnrollmentSchema,
  value: createClassEnrollmentValueSchema,
});
