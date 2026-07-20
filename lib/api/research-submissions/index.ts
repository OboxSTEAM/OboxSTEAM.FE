import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { createApiPost } from "@/lib/api/create-endpoint";
import {
  gradeResearchSubmissionSchema,
  researchSubmissionIdParamSchema,
  startResearchSubmissionSchema,
  submitResearchSubmissionSchema,
  uploadResearchSubmissionQuerySchema,
} from "@/lib/validations/research-submissions";
import type {
  GradeResearchSubmissionInput,
  SubmitResearchSubmissionInput,
} from "@/lib/validations/research-submissions";

import {
  getResearchSubmissionByIdResponseSchema,
  gradeResearchSubmissionResponseSchema,
  researchSubmissionValueSchema,
  submitResearchSubmissionResponseSchema,
  uploadResearchSubmissionFileResponseSchema,
  type GetResearchSubmissionByIdResult,
  type GradeResearchSubmissionResult,
  type SubmitResearchSubmissionResult,
  type UploadResearchSubmissionFileResult,
} from "./schemas";

export type {
  GetResearchSubmissionByIdResponse,
  GetResearchSubmissionByIdResult,
  GradeResearchSubmissionResponse,
  GradeResearchSubmissionResult,
  StartResearchSubmissionResponse,
  StartResearchSubmissionResult,
  SubmitResearchSubmissionResponse,
  SubmitResearchSubmissionResult,
  UploadResearchSubmissionFileResponse,
  UploadResearchSubmissionFileResult,
} from "./schemas";

export type {
  ResearchSubmission,
  ResearchSubmissionStatus,
  ResearchSubmissionUploadPayload,
} from "@/lib/api/entities/research-submission";

export type {
  GradeResearchSubmissionInput,
  ResearchSubmissionIdParam,
  StartResearchSubmissionInput,
  SubmitResearchSubmissionInput,
  UploadResearchSubmissionQuery,
} from "@/lib/validations/research-submissions";

const RESEARCH_SUBMISSIONS_BASE = "/api/research-submissions";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** `POST /api/research-submissions/start` */
export const startResearchSubmission = createApiPost({
  path: `${RESEARCH_SUBMISSIONS_BASE}/start`,
  input: startResearchSubmissionSchema,
  value: researchSubmissionValueSchema,
});

/** `GET /api/research-submissions/{submissionId}` */
export async function getResearchSubmissionById(
  submissionId: string,
): Promise<GetResearchSubmissionByIdResult> {
  const { submissionId: parsedSubmissionId } = researchSubmissionIdParamSchema.parse({
    submissionId,
  });

  const response = await apiFetchParsed(
    `${RESEARCH_SUBMISSIONS_BASE}/${parsedSubmissionId}`,
    getResearchSubmissionByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/research-submissions/{submissionId}/upload` */
export async function uploadResearchSubmissionFile(
  submissionId: string,
  file: File,
  options: { isEvidence?: boolean } = {},
): Promise<UploadResearchSubmissionFileResult> {
  const { submissionId: parsedSubmissionId } = researchSubmissionIdParamSchema.parse({
    submissionId,
  });
  const { isEvidence = false } = uploadResearchSubmissionQuerySchema.parse(options);

  const formData = new FormData();
  formData.append("file", file);

  const query = isEvidence ? "?isEvidence=true" : "";

  const response = await apiFetchParsed(
    `${RESEARCH_SUBMISSIONS_BASE}/${parsedSubmissionId}/upload${query}`,
    uploadResearchSubmissionFileResponseSchema,
    {
      method: "POST",
      body: formData,
    },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/research-submissions/{submissionId}/submit` */
export async function submitResearchSubmission(
  submissionId: string,
  input: SubmitResearchSubmissionInput,
): Promise<SubmitResearchSubmissionResult> {
  const { submissionId: parsedSubmissionId } = researchSubmissionIdParamSchema.parse({
    submissionId,
  });
  const body = submitResearchSubmissionSchema.parse(input);

  const response = await apiFetchParsed(
    `${RESEARCH_SUBMISSIONS_BASE}/${parsedSubmissionId}/submit`,
    submitResearchSubmissionResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/research-submissions/{submissionId}/grade` */
export async function gradeResearchSubmission(
  submissionId: string,
  input: GradeResearchSubmissionInput,
): Promise<GradeResearchSubmissionResult> {
  const { submissionId: parsedSubmissionId } = researchSubmissionIdParamSchema.parse({
    submissionId,
  });
  const body = gradeResearchSubmissionSchema.parse(input);

  const response = await apiFetchParsed(
    `${RESEARCH_SUBMISSIONS_BASE}/${parsedSubmissionId}/grade`,
    gradeResearchSubmissionResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
