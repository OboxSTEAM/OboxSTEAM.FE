import { z } from "zod";

import { classStatusSchema } from "@/lib/api/entities/class";
import { classRedeliveryCandidateSessionSchema } from "@/lib/api/entities/class-redelivery-request";
import { moduleTypeSchema } from "@/lib/api/entities/module";
import { programEnrollmentStatusSchema } from "@/lib/api/entities/program-enrollment";

/** Catalog context for Active continuity vs terminal rebuy. */
export const rebuyClassCatalogContextSchema = z.enum([
  "Rebuy",
  "ActiveRedelivery",
]);

export const rebuySourceEndReasonSchema = z.enum([
  "AcademicFail",
  "Withdraw",
  "Attendance",
]);

export const rebuyModuleProgressSchema = z.enum([
  "NotStarted",
  "InProgress",
  "Completed",
]);

export const rebuyCreditHintSchema = z.enum([
  "Ahead",
  "Copied",
  "RedoWithClass",
]);

/** `RebuyClassModuleProgressDto` */
export const rebuyClassModuleProgressSchema = z.object({
  moduleId: z.string().uuid(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  moduleOrder: z.number().int(),
  moduleType: moduleTypeSchema,
  progress: rebuyModuleProgressSchema,
  blocksRebuy: z.boolean(),
  creditHint: rebuyCreditHintSchema,
});

/** `RebuyClassDto` (+ optional `moduleSessions` on continuity candidates). */
export const rebuyClassSchema = z.object({
  classId: z.string().uuid(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  status: classStatusSchema,
  startDate: z.string(),
  endDate: z.string(),
  mentorId: z.string().uuid().nullable(),
  mentorName: z.string().nullable(),
  maxCapacity: z.number().int(),
  seatsTaken: z.number().int(),
  seatsRemaining: z.number().int(),
  scheduleSummary: z.string().nullable(),
  isEligible: z.boolean(),
  ineligibleReason: z.string().nullable(),
  modules: z
    .array(rebuyClassModuleProgressSchema)
    .nullish()
    .transform((value) => value ?? []),
  moduleSessions: z
    .array(classRedeliveryCandidateSessionSchema)
    .nullish()
    .transform((value) => value ?? []),
});

/** `RebuyClassCatalogDto` — shared by rebuy-classes, continuity-classes, candidates. */
export const rebuyClassCatalogSchema = z.object({
  programId: z.string().uuid(),
  context: rebuyClassCatalogContextSchema,
  isRebuy: z.boolean(),
  sourceProgramEnrollmentId: z.string().uuid().nullable(),
  sourceStatus: programEnrollmentStatusSchema.nullable(),
  sourceEndReason: rebuySourceEndReasonSchema.nullable(),
  stopModuleId: z.string().uuid().nullable(),
  stopModuleCode: z.string().nullable(),
  stopModuleName: z.string().nullable(),
  stopModuleOrder: z.number().int().nullable(),
  withinRebuyWindow: z.boolean(),
  checkoutAmount: z.number(),
  classes: z
    .array(rebuyClassSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type RebuyClassCatalogContext = z.infer<
  typeof rebuyClassCatalogContextSchema
>;
export type RebuyCreditHint = z.infer<typeof rebuyCreditHintSchema>;
export type RebuyClassModuleProgress = z.infer<
  typeof rebuyClassModuleProgressSchema
>;
export type RebuyClass = z.infer<typeof rebuyClassSchema>;
export type RebuyClassCatalog = z.infer<typeof rebuyClassCatalogSchema>;
