import { z } from "zod";

import {
  researchSubmissionSchema,
  researchSubmissionUploadPayloadSchema,
} from "@/lib/api/entities/research-submission";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const researchSubmissionValueSchema = createApiValueSchema(researchSubmissionSchema);

export const researchSubmissionUploadPayloadValueSchema = createApiValueSchema(
  researchSubmissionUploadPayloadSchema,
);

export const startResearchSubmissionResponseSchema = createApiResponseSchema(
  researchSubmissionValueSchema,
);

export const getResearchSubmissionByIdResponseSchema = createApiResponseSchema(
  researchSubmissionValueSchema,
);

export const uploadResearchSubmissionFileResponseSchema = createApiResponseSchema(
  researchSubmissionUploadPayloadValueSchema,
);

export const submitResearchSubmissionResponseSchema = createApiResponseSchema(
  researchSubmissionValueSchema,
);

export const gradeResearchSubmissionResponseSchema = createApiResponseSchema(
  researchSubmissionValueSchema,
);

export type StartResearchSubmissionResponse = z.infer<
  typeof startResearchSubmissionResponseSchema
>;
export type StartResearchSubmissionResult = StartResearchSubmissionResponse["value"];

export type GetResearchSubmissionByIdResponse = z.infer<
  typeof getResearchSubmissionByIdResponseSchema
>;
export type GetResearchSubmissionByIdResult = GetResearchSubmissionByIdResponse["value"];

export type UploadResearchSubmissionFileResponse = z.infer<
  typeof uploadResearchSubmissionFileResponseSchema
>;
export type UploadResearchSubmissionFileResult = UploadResearchSubmissionFileResponse["value"];

export type SubmitResearchSubmissionResponse = z.infer<
  typeof submitResearchSubmissionResponseSchema
>;
export type SubmitResearchSubmissionResult = SubmitResearchSubmissionResponse["value"];

export type GradeResearchSubmissionResponse = z.infer<
  typeof gradeResearchSubmissionResponseSchema
>;
export type GradeResearchSubmissionResult = GradeResearchSubmissionResponse["value"];
