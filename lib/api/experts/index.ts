import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createExpertSchema,
  expertDegreeIdParamSchema,
  expertDegreeRequestSchema,
  expertIdParamSchema,
  expertListQuerySchema,
  expertProgramAssignmentSchema,
  expertProgramParamSchema,
  expertPublicationIdParamSchema,
  expertPublicationRequestSchema,
  updateExpertSchema,
} from "@/lib/validations/experts";

import {
  createExpertDegreeResponseSchema,
  createExpertPublicationResponseSchema,
  createExpertResponseSchema,
  deleteExpertResponseSchema,
  expertProgramResponseSchema,
  getExpertByIdResponseSchema,
  getExpertsResponseSchema,
  updateExpertDegreeResponseSchema,
  updateExpertPublicationResponseSchema,
  updateExpertResponseSchema,
  type CreateExpertDegreeResult,
  type CreateExpertPublicationResult,
  type CreateExpertResult,
  type DeleteExpertResult,
  type ExpertProgramResult,
  type GetExpertByIdResult,
  type GetExpertsResult,
  type UpdateExpertDegreeResult,
  type UpdateExpertPublicationResult,
  type UpdateExpertResult,
} from "./schemas";

export type {
  CreateExpertDegreeResponse,
  CreateExpertDegreeResult,
  CreateExpertPublicationResponse,
  CreateExpertPublicationResult,
  CreateExpertResponse,
  CreateExpertResult,
  DeleteExpertResponse,
  DeleteExpertResult,
  ExpertProgramResponse,
  ExpertProgramResult,
  GetExpertByIdResponse,
  GetExpertByIdResult,
  GetExpertsResponse,
  GetExpertsResult,
  UpdateExpertDegreeResponse,
  UpdateExpertDegreeResult,
  UpdateExpertPublicationResponse,
  UpdateExpertPublicationResult,
  UpdateExpertResponse,
  UpdateExpertResult,
} from "./schemas";

export type {
  Expert,
  ExpertDegree,
  ExpertProgram,
  ExpertPublication,
  ProgramExpert,
} from "@/lib/api/entities/expert";

export type {
  CreateExpertInput,
  ExpertDegreeRequestInput,
  ExpertListQuery,
  ExpertProgramAssignmentInput,
  ExpertPublicationRequestInput,
  UpdateExpertInput,
} from "@/lib/validations/experts";

import type { Expert } from "@/lib/api/entities/expert";
import type {
  CreateExpertInput,
  ExpertDegreeRequestInput,
  ExpertListQuery,
  ExpertProgramAssignmentInput,
  ExpertPublicationRequestInput,
  UpdateExpertInput,
} from "@/lib/validations/experts";

const EXPERTS_BASE = "/api/experts";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildQueryString<T extends Record<string, unknown>>(
  params: T | undefined,
  schema: z.ZodType<T>,
): string {
  if (!params) return "";

  const parsed = schema.parse(params);
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toExpertRequest(input: CreateExpertInput | UpdateExpertInput) {
  return {
    ...input,
    userId: input.userId || null,
  };
}

export async function getExperts(params?: ExpertListQuery): Promise<GetExpertsResult> {
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}${buildQueryString(params, expertListQuerySchema)}`,
    getExpertsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getExpertById(expertId: string): Promise<GetExpertByIdResult> {
  const { expertId: parsedExpertId } = expertIdParamSchema.parse({ expertId });

  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${parsedExpertId}`,
    getExpertByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/experts/{id}/profile` — public, no auth. */
export async function getExpertPublicProfile(
  expertId: string,
): Promise<GetExpertByIdResult> {
  const { expertId: parsedExpertId } = expertIdParamSchema.parse({ expertId });

  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${parsedExpertId}/profile`,
    getExpertByIdResponseSchema,
    { method: "GET", skipAuth: true },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function createExpert(
  input: CreateExpertInput,
): Promise<CreateExpertResult> {
  const body = createExpertSchema.parse(input);
  const response = await apiFetchParsed(
    EXPERTS_BASE,
    createExpertResponseSchema,
    { method: "POST", body: toExpertRequest(body) },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function updateExpert(
  expertId: string,
  input: UpdateExpertInput,
): Promise<UpdateExpertResult> {
  const { expertId: parsedExpertId } = expertIdParamSchema.parse({ expertId });
  const body = updateExpertSchema.parse(input);
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${parsedExpertId}`,
    updateExpertResponseSchema,
    { method: "PUT", body: toExpertRequest(body) },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteExpert(expertId: string): Promise<DeleteExpertResult> {
  const { expertId: parsedExpertId } = expertIdParamSchema.parse({ expertId });
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${parsedExpertId}`,
    deleteExpertResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function addExpertToProgram(
  expertId: string,
  programId: string,
  input: ExpertProgramAssignmentInput = {},
): Promise<ExpertProgramResult> {
  const params = expertProgramParamSchema.parse({ expertId, programId });
  const body = expertProgramAssignmentSchema.parse(input);
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${params.expertId}/programs/${params.programId}`,
    expertProgramResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function removeExpertFromProgram(
  expertId: string,
  programId: string,
): Promise<DeleteExpertResult> {
  const params = expertProgramParamSchema.parse({ expertId, programId });
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${params.expertId}/programs/${params.programId}`,
    deleteExpertResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function addExpertDegree(
  expertId: string,
  input: ExpertDegreeRequestInput,
): Promise<CreateExpertDegreeResult> {
  const { expertId: parsedExpertId } = expertIdParamSchema.parse({ expertId });
  const body = expertDegreeRequestSchema.parse(input);
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${parsedExpertId}/degrees`,
    createExpertDegreeResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function updateExpertDegree(
  expertId: string,
  degreeId: string,
  input: ExpertDegreeRequestInput,
): Promise<UpdateExpertDegreeResult> {
  const params = expertDegreeIdParamSchema.parse({ expertId, degreeId });
  const body = expertDegreeRequestSchema.parse(input);
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${params.expertId}/degrees/${params.degreeId}`,
    updateExpertDegreeResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteExpertDegree(
  expertId: string,
  degreeId: string,
): Promise<DeleteExpertResult> {
  const params = expertDegreeIdParamSchema.parse({ expertId, degreeId });
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${params.expertId}/degrees/${params.degreeId}`,
    deleteExpertResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function addExpertPublication(
  expertId: string,
  input: ExpertPublicationRequestInput,
): Promise<CreateExpertPublicationResult> {
  const { expertId: parsedExpertId } = expertIdParamSchema.parse({ expertId });
  const body = expertPublicationRequestSchema.parse(input);
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${parsedExpertId}/publications`,
    createExpertPublicationResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function updateExpertPublication(
  expertId: string,
  publicationId: string,
  input: ExpertPublicationRequestInput,
): Promise<UpdateExpertPublicationResult> {
  const params = expertPublicationIdParamSchema.parse({
    expertId,
    publicationId,
  });
  const body = expertPublicationRequestSchema.parse(input);
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${params.expertId}/publications/${params.publicationId}`,
    updateExpertPublicationResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteExpertPublication(
  expertId: string,
  publicationId: string,
): Promise<DeleteExpertResult> {
  const params = expertPublicationIdParamSchema.parse({
    expertId,
    publicationId,
  });
  const response = await apiFetchParsed(
    `${EXPERTS_BASE}/${params.expertId}/publications/${params.publicationId}`,
    deleteExpertResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export type ExpertCredentialDrafts = {
  degrees: ExpertDegreeRequestInput[];
  publications: ExpertPublicationRequestInput[];
};

export const EMPTY_CREDENTIAL_DRAFTS: ExpertCredentialDrafts = {
  degrees: [],
  publications: [],
};

function toDegreeRequest(degree: Expert["degrees"][number]): ExpertDegreeRequestInput {
  return {
    title: degree.title,
    institution: degree.institution,
    year: degree.year || undefined,
  };
}

function toPublicationRequest(
  publication: Expert["publications"][number],
): ExpertPublicationRequestInput {
  return {
    title: publication.title,
    venue: publication.venue || null,
    year: publication.year || undefined,
    url: publication.url || null,
  };
}

export async function persistExpertCredentialDrafts(
  expertId: string,
  drafts: ExpertCredentialDrafts,
): Promise<void> {
  for (const degree of drafts.degrees) {
    await addExpertDegree(expertId, degree);
  }
  for (const publication of drafts.publications) {
    await addExpertPublication(expertId, publication);
  }
}

/** Re-fetch after create/update. Re-posts nested credentials if PUT omitted/wiped them. */
export async function syncExpertAfterMutation(
  expertId: string,
  previous: Expert | null,
): Promise<Expert | null> {
  const first = await getExpertById(expertId);
  let fresh = first?.data ?? null;
  if (!fresh) return previous;

  const lostDegrees =
    Boolean(previous?.degrees.length) && fresh.degrees.length === 0;
  const lostPublications =
    Boolean(previous?.publications.length) && fresh.publications.length === 0;

  if (previous && (lostDegrees || lostPublications)) {
    if (lostDegrees) {
      for (const degree of previous.degrees) {
        await addExpertDegree(expertId, toDegreeRequest(degree));
      }
    }
    if (lostPublications) {
      for (const publication of previous.publications) {
        await addExpertPublication(expertId, toPublicationRequest(publication));
      }
    }
    const again = await getExpertById(expertId);
    fresh = again?.data ?? fresh;
  }

  if (!previous) return fresh;

  return {
    ...fresh,
    degrees: fresh.degrees.length > 0 ? fresh.degrees : previous.degrees,
    publications:
      fresh.publications.length > 0 ? fresh.publications : previous.publications,
    specialization:
      fresh.specialization.length > 0
        ? fresh.specialization
        : previous.specialization,
  };
}
