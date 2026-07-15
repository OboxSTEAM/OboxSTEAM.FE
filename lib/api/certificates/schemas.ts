import { z } from "zod";

import {
  certificateDetailSchema,
  certificateListItemSchema,
} from "@/lib/api/entities/certificate";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const certificatesListValueSchema = createApiValueSchema(
  z.array(certificateListItemSchema).nullable(),
);
export const certificateDetailValueSchema =
  createApiValueSchema(certificateDetailSchema);
/** `GET …/by-enrollment/{id}` may return `data: null` when not yet issued. */
export const certificateDetailNullableValueSchema = createApiValueSchema(
  certificateDetailSchema.nullable(),
);

export const getMyCertificatesResponseSchema = createApiResponseSchema(
  certificatesListValueSchema,
);
export const getCertificateByIdResponseSchema = createApiResponseSchema(
  certificateDetailValueSchema,
);
export const getCertificateByEnrollmentResponseSchema = createApiResponseSchema(
  certificateDetailNullableValueSchema,
);
export const verifyCertificateResponseSchema = createApiResponseSchema(
  certificateDetailValueSchema,
);
export const ensureProgramCertificateResponseSchema = createApiResponseSchema(
  certificateDetailValueSchema,
);

export type GetMyCertificatesResponse = z.infer<
  typeof getMyCertificatesResponseSchema
>;
export type GetCertificateByIdResponse = z.infer<
  typeof getCertificateByIdResponseSchema
>;
export type GetCertificateByEnrollmentResponse = z.infer<
  typeof getCertificateByEnrollmentResponseSchema
>;
export type VerifyCertificateResponse = z.infer<
  typeof verifyCertificateResponseSchema
>;
export type EnsureProgramCertificateResponse = z.infer<
  typeof ensureProgramCertificateResponseSchema
>;

export type GetMyCertificatesResult = GetMyCertificatesResponse["value"];
export type GetCertificateByIdResult = GetCertificateByIdResponse["value"];
export type GetCertificateByEnrollmentResult =
  GetCertificateByEnrollmentResponse["value"];
export type VerifyCertificateResult = VerifyCertificateResponse["value"];
export type EnsureProgramCertificateResult =
  EnsureProgramCertificateResponse["value"];
