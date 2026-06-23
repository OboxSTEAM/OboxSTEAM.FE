import { z } from "zod";

import {
  activityCheckpointResultSchema,
  completeActivityDataSchema,
} from "@/lib/api/entities/activity-progress";
import { enrollmentCurriculumSchema } from "@/lib/api/entities/enrollment-curriculum";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { programEnrollmentSchema } from "@/lib/api/entities/program-enrollment";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const paginatedProgramEnrollmentsSchema = createPaginatedSchema(
  programEnrollmentSchema,
);

export const myProgramEnrollmentsValueSchema = createApiValueSchema(
  paginatedProgramEnrollmentsSchema,
);

export const studentProgramEnrollmentsValueSchema = createApiValueSchema(
  paginatedProgramEnrollmentsSchema,
);

export const enrollmentCurriculumValueSchema = createApiValueSchema(
  enrollmentCurriculumSchema,
);

export const activityCheckpointValueSchema = createApiValueSchema(
  activityCheckpointResultSchema,
);

export const completeActivityValueSchema = createApiValueSchema(
  completeActivityDataSchema,
);

export const getMyProgramEnrollmentsResponseSchema = createApiResponseSchema(
  myProgramEnrollmentsValueSchema,
);

export const getStudentProgramEnrollmentsResponseSchema = createApiResponseSchema(
  studentProgramEnrollmentsValueSchema,
);

export const getEnrollmentCurriculumResponseSchema = createApiResponseSchema(
  enrollmentCurriculumValueSchema,
);

export const saveActivityCheckpointResponseSchema = createApiResponseSchema(
  activityCheckpointValueSchema,
);

export const completeActivityResponseSchema = createApiResponseSchema(
  completeActivityValueSchema,
);

export type GetMyProgramEnrollmentsResponse = z.infer<
  typeof getMyProgramEnrollmentsResponseSchema
>;
export type GetMyProgramEnrollmentsResult = GetMyProgramEnrollmentsResponse["value"];

export type GetStudentProgramEnrollmentsResponse = z.infer<
  typeof getStudentProgramEnrollmentsResponseSchema
>;
export type GetStudentProgramEnrollmentsResult =
  GetStudentProgramEnrollmentsResponse["value"];

export type GetEnrollmentCurriculumResponse = z.infer<
  typeof getEnrollmentCurriculumResponseSchema
>;
export type GetEnrollmentCurriculumResult = GetEnrollmentCurriculumResponse["value"];

export type SaveActivityCheckpointResponse = z.infer<
  typeof saveActivityCheckpointResponseSchema
>;
export type SaveActivityCheckpointResult = SaveActivityCheckpointResponse["value"];

export type CompleteActivityResponse = z.infer<typeof completeActivityResponseSchema>;
export type CompleteActivityResult = CompleteActivityResponse["value"];
