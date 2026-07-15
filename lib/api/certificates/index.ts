import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  certificateCodeParamSchema,
  certificateIdParamSchema,
  programEnrollmentIdParamSchema,
} from "@/lib/validations/certificates";

import {
  ensureProgramCertificateResponseSchema,
  getCertificateByEnrollmentResponseSchema,
  getCertificateByIdResponseSchema,
  getMyCertificatesResponseSchema,
  verifyCertificateResponseSchema,
  type EnsureProgramCertificateResult,
  type GetCertificateByEnrollmentResult,
  type GetCertificateByIdResult,
  type GetMyCertificatesResult,
  type VerifyCertificateResult,
} from "./schemas";

export type {
  EnsureProgramCertificateResponse,
  EnsureProgramCertificateResult,
  GetCertificateByEnrollmentResponse,
  GetCertificateByEnrollmentResult,
  GetCertificateByIdResponse,
  GetCertificateByIdResult,
  GetMyCertificatesResponse,
  GetMyCertificatesResult,
  VerifyCertificateResponse,
  VerifyCertificateResult,
} from "./schemas";

export type {
  CertificateDetail,
  CertificateListItem,
  CertificateModule,
  CertificateProgram,
  CertificateStudent,
} from "@/lib/api/entities/certificate";

export type {
  CertificateCodeParam,
  CertificateIdParam,
  ProgramEnrollmentIdParam,
} from "@/lib/validations/certificates";

const CERTIFICATES_BASE = "/api/certificates";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** `GET /api/certificates/me` — students: own; parents: linked students; admins: all. */
export async function getMyCertificates(): Promise<GetMyCertificatesResult> {
  const response = await apiFetchParsed(
    `${CERTIFICATES_BASE}/me`,
    getMyCertificatesResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/certificates/{id}` — full show-page payload. */
export async function getCertificateById(
  id: string,
): Promise<GetCertificateByIdResult> {
  const { id: certificateId } = certificateIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${CERTIFICATES_BASE}/${certificateId}`,
    getCertificateByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `GET /api/certificates/by-enrollment/{programEnrollmentId}`
 * Returns `data: null` when the certificate is not yet issued.
 */
export async function getCertificateByEnrollment(
  programEnrollmentId: string,
): Promise<GetCertificateByEnrollmentResult> {
  const { programEnrollmentId: parsedEnrollmentId } =
    programEnrollmentIdParamSchema.parse({ programEnrollmentId });

  const response = await apiFetchParsed(
    `${CERTIFICATES_BASE}/by-enrollment/${parsedEnrollmentId}`,
    getCertificateByEnrollmentResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/certificates/verify/{code}` — public share/verify page. */
export async function verifyCertificate(
  code: string,
): Promise<VerifyCertificateResult> {
  const { code: parsedCode } = certificateCodeParamSchema.parse({ code });

  const response = await apiFetchParsed(
    `${CERTIFICATES_BASE}/verify/${encodeURIComponent(parsedCode)}`,
    verifyCertificateResponseSchema,
    { method: "GET", skipAuth: true, skipRefresh: true },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `POST /api/certificates/program-enrollments/{programEnrollmentId}/ensure`
 * Issues when all activities are Done; retries PDF upload when missing. Idempotent.
 */
export async function ensureProgramCertificate(
  programEnrollmentId: string,
): Promise<EnsureProgramCertificateResult> {
  const { programEnrollmentId: parsedEnrollmentId } =
    programEnrollmentIdParamSchema.parse({ programEnrollmentId });

  const response = await apiFetchParsed(
    `${CERTIFICATES_BASE}/program-enrollments/${parsedEnrollmentId}/ensure`,
    ensureProgramCertificateResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
