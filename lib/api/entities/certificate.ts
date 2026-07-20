import { z } from "zod";

/** Row from `GET /api/certificates/me`. */
export const certificateListItemSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable(),
  programId: z.string().uuid(),
  programName: z.string().nullable(),
  issueDate: z.string().nullable(),
  pdfUrl: z.string().nullable(),
  verificationUrl: z.string().nullable(),
});

export const certificateStudentSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export const certificateProgramSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  estimatedDuration: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
});

export const certificateModuleSchema = z.object({
  moduleId: z.string().uuid(),
  name: z.string().nullable(),
  moduleOrder: z.number().int(),
});

/** Full show-page / verify payload for an issued program certificate. */
export const certificateDetailSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable(),
  issueDate: z.string().nullable(),
  pdfUrl: z.string().nullable(),
  verificationUrl: z.string().nullable(),
  skillsAcquired: z.string().nullable(),
  issuerName: z.string().nullable(),
  student: certificateStudentSchema,
  program: certificateProgramSchema,
  modules: z.array(certificateModuleSchema).nullable(),
  learningOutcomes: z.array(z.string()).nullable(),
  skillsGained: z.array(z.string()).nullable(),
});

export type CertificateListItem = z.infer<typeof certificateListItemSchema>;
export type CertificateStudent = z.infer<typeof certificateStudentSchema>;
export type CertificateProgram = z.infer<typeof certificateProgramSchema>;
export type CertificateModule = z.infer<typeof certificateModuleSchema>;
export type CertificateDetail = z.infer<typeof certificateDetailSchema>;
