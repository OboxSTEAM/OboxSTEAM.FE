import { z } from "zod";

import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { programEnrollmentSchema } from "@/lib/api/entities/program-enrollment";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedProgramEnrollmentsSchema = createPaginatedSchema(
  programEnrollmentSchema,
);

export const myProgramEnrollmentsValueSchema = createApiValueSchema(
  paginatedProgramEnrollmentsSchema,
);

export const getMyProgramEnrollmentsResponseSchema = createApiResponseSchema(
  myProgramEnrollmentsValueSchema,
);

export type GetMyProgramEnrollmentsResponse = z.infer<
  typeof getMyProgramEnrollmentsResponseSchema
>;
export type GetMyProgramEnrollmentsResult = GetMyProgramEnrollmentsResponse["value"];
