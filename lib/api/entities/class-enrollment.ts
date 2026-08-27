import { z } from "zod";

import { classSchema } from "@/lib/api/entities/class";

export const classEnrollmentStatusSchema = z.enum([
  "Active",
  "Transferred",
  "Withdrawn",
  "Completed",
]);

/** Handoff WS7 — optional until OpenAPI surfaces `kind` on ClassEnrollmentResponseDto. */
export const classEnrollmentKindSchema = z.enum(["Primary", "Retake"]);

export const classEnrollmentSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  programEnrollmentId: z.string().uuid(),
  status: classEnrollmentStatusSchema,
  kind: classEnrollmentKindSchema
    .nullish()
    .transform((value) => value ?? "Primary"),
  enrolledAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  class: classSchema,
});

export type ClassEnrollmentStatus = z.infer<typeof classEnrollmentStatusSchema>;
export type ClassEnrollmentKind = z.infer<typeof classEnrollmentKindSchema>;
export type ClassEnrollment = z.infer<typeof classEnrollmentSchema>;
