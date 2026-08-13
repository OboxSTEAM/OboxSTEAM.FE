import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  gradeResearchSubmissionSchema,
  researchSubmissionIdParamSchema,
  submitResearchSubmissionSchema,
  uploadResearchSubmissionQuerySchema,
} from "@/lib/validations/research-submissions";
import type {
  GradeResearchSubmissionInput,
  SubmitResearchSubmissionInput,
  UploadResearchSubmissionQuery,
} from "@/lib/validations/research-submissions";

import {
  getResearchSubmissionByIdResponseSchema,
  gradeResearchSubmissionResponseSchema,
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

/**
 * `POST /api/research-submissions/upload?moduleEnrollmentId=&researchMilestoneId=&isEvidence=`
 * Lazy-creates a Pending draft when unlocked. Pass returned URLs into submit.
 */
export async function uploadResearchSubmissionFile(
  file: File,
  query: UploadResearchSubmissionQuery,
): Promise<UploadResearchSubmissionFileResult> {
  const {
    moduleEnrollmentId,
    researchMilestoneId,
    isEvidence = false,
  } = uploadResearchSubmissionQuerySchema.parse(query);

  const formData = new FormData();
  formData.append("file", file);

  const params = new URLSearchParams({
    moduleEnrollmentId,
    researchMilestoneId,
    isEvidence: String(isEvidence),
  });

  const response = await apiFetchParsed(
    `${RESEARCH_SUBMISSIONS_BASE}/upload?${params.toString()}`,
    uploadResearchSubmissionFileResponseSchema,
    {
      method: "POST",
      body: formData,
    },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `POST /api/research-submissions/submit`
 * Creates submission when none exists (unlocked + activities + availability),
 * or turns in existing Pending / ReturnedForRevision.
 */
export async function submitResearchSubmission(
  input: SubmitResearchSubmissionInput,
): Promise<SubmitResearchSubmissionResult> {
  const body = submitResearchSubmissionSchema.parse(input);

  const response = await apiFetchParsed(
    `${RESEARCH_SUBMISSIONS_BASE}/submit`,
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
