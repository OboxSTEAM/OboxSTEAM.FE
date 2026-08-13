import { z } from "zod";

import { activityTypeSchema } from "@/lib/api/entities/activity";
import { assignmentTypeSchema } from "@/lib/api/entities/assignment";
import { moduleEnrollmentStatusSchema } from "@/lib/api/entities/module-enrollment";
import { moduleTypeSchema } from "@/lib/api/entities/module";
import { programLevelSchema } from "@/lib/api/entities/program";
import { programEnrollmentStatusSchema } from "@/lib/api/entities/program-enrollment";

/** `GET /api/parent/children/{studentId}/progression` — student identity block. */
export const parentProgressionStudentSchema = z.object({
  linkedUserId: z.string().uuid(),
  code: z.string().nullable(),
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  isVerified: z.boolean(),
  linkedAt: z.string(),
});

export const parentProgressionSummarySchema = z.object({
  activeEnrollmentCount: z.number().int(),
  completedEnrollmentCount: z.number().int(),
  lastAccessedAt: z.string().nullable(),
});

export const parentBlockerCodeSchema = z.enum([
  "ModuleLocked",
  "PrerequisiteFailed",
  "PendingPayment",
  "AssignmentOverdue",
  "ModuleFailed",
]);

export const parentBlockerSchema = z.object({
  code: parentBlockerCodeSchema,
  message: z.string().nullable(),
  moduleId: z.string().uuid().nullable(),
  enrollmentId: z.string().uuid().nullable(),
});

export const parentCurrentModuleSchema = z.object({
  moduleId: z.string().uuid(),
  moduleEnrollmentId: z.string().uuid().nullable(),
  moduleName: z.string().nullable(),
  moduleOrder: z.number().int(),
  moduleType: moduleTypeSchema,
  status: moduleEnrollmentStatusSchema.nullable(),
  progressPercent: z.number().nullable(),
});

export const parentCurrentActivitySchema = z.object({
  activityId: z.string().uuid(),
  activityName: z.string().nullable(),
  activityType: activityTypeSchema,
});

export const parentEnrollmentBriefSchema = z.object({
  enrollmentId: z.string().uuid(),
  programId: z.string().uuid(),
  programName: z.string().nullable(),
  programCode: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  level: programLevelSchema.nullable(),
  status: programEnrollmentStatusSchema,
  progressPercent: z.number(),
  enrolledAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  currentModule: parentCurrentModuleSchema.nullable(),
  currentActivity: parentCurrentActivitySchema.nullable(),
  lastAccessedAt: z.string().nullable(),
  blockers: z.array(parentBlockerSchema).nullable(),
});

export const parentProgressEventTypeSchema = z.enum([
  "ActivityCompleted",
  "AssignmentSubmitted",
  "AssignmentPassed",
  "AssignmentFailed",
  "ModuleCompleted",
  "ModuleFailed",
  "EnrollmentCompleted",
]);

export const parentProgressEventSchema = z.object({
  id: z.string().nullable(),
  occurredAt: z.string(),
  type: parentProgressEventTypeSchema,
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  enrollmentId: z.string().uuid().nullable(),
  moduleId: z.string().uuid().nullable(),
});

/** Matches `ParentChildProgressionDto`. */
export const parentChildProgressionSchema = z.object({
  student: parentProgressionStudentSchema,
  summary: parentProgressionSummarySchema,
  enrollments: z.array(parentEnrollmentBriefSchema).nullable(),
  recentMilestones: z.array(parentProgressEventSchema).nullable(),
});

export const parentEnrollmentHeaderSchema = z.object({
  enrollmentId: z.string().uuid(),
  programId: z.string().uuid(),
  programName: z.string().nullable(),
  programCode: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  status: programEnrollmentStatusSchema,
  progressPercent: z.number(),
  enrolledAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  lastAccessedAt: z.string().nullable(),
});

export const parentClassInfoSchema = z.object({
  classId: z.string().uuid(),
  className: z.string().nullable(),
  mentorName: z.string().nullable(),
});

export const parentModuleOutcomeLabelSchema = z.enum([
  "Excellent",
  "Pass",
  "NeedsImprovement",
  "Failed",
  "InProgress",
  "NotStarted",
]);

export const parentActivityStatsSchema = z.object({
  total: z.number().int(),
  completed: z.number().int(),
});

/**
 * OpenAPI leaves assignment `status` as a free string (e.g. locked / available /
 * submitted / completed / overdue). Keep permissive to avoid FE parse breaks.
 */
export const parentAssignmentOutcomeSchema = z.object({
  assignmentId: z.string().uuid(),
  title: z.string().nullable(),
  assignmentType: assignmentTypeSchema,
  isRequiredForModulePass: z.boolean(),
  dueDate: z.string().nullable(),
  status: z.string().nullable(),
  score: z.number().nullable(),
  maxPoints: z.number().int().nullable(),
  passScore: z.number().nullable(),
  passed: z.boolean().nullable(),
  submittedAt: z.string().nullable(),
  gradedAt: z.string().nullable(),
  attemptUsed: z.number().int().nullable(),
  maxAttempts: z.number().int().nullable(),
});

export const parentModuleProgressSchema = z.object({
  moduleId: z.string().uuid(),
  moduleEnrollmentId: z.string().uuid().nullable(),
  moduleName: z.string().nullable(),
  moduleOrder: z.number().int(),
  moduleType: moduleTypeSchema,
  isLocked: z.boolean(),
  lockReason: z.string().nullable(),
  status: moduleEnrollmentStatusSchema.nullable(),
  progressPercent: z.number(),
  attemptNumber: z.number().int().nullable(),
  finalGrade: z.number().nullable(),
  outcomeLabel: parentModuleOutcomeLabelSchema.nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  activityStats: parentActivityStatsSchema,
  assignments: z.array(parentAssignmentOutcomeSchema).nullable(),
});

/** Matches `ParentEnrollmentProgressionDto`. */
export const parentEnrollmentProgressionSchema = z.object({
  studentId: z.string().uuid(),
  enrollment: parentEnrollmentHeaderSchema,
  classInfo: parentClassInfoSchema.nullable(),
  modules: z.array(parentModuleProgressSchema).nullable(),
});

export type ParentProgressionStudent = z.infer<typeof parentProgressionStudentSchema>;
export type ParentProgressionSummary = z.infer<typeof parentProgressionSummarySchema>;
export type ParentBlockerCode = z.infer<typeof parentBlockerCodeSchema>;
export type ParentBlocker = z.infer<typeof parentBlockerSchema>;
export type ParentCurrentModule = z.infer<typeof parentCurrentModuleSchema>;
export type ParentCurrentActivity = z.infer<typeof parentCurrentActivitySchema>;
export type ParentEnrollmentBrief = z.infer<typeof parentEnrollmentBriefSchema>;
export type ParentProgressEventType = z.infer<typeof parentProgressEventTypeSchema>;
export type ParentProgressEvent = z.infer<typeof parentProgressEventSchema>;
export type ParentChildProgression = z.infer<typeof parentChildProgressionSchema>;
export type ParentEnrollmentHeader = z.infer<typeof parentEnrollmentHeaderSchema>;
export type ParentClassInfo = z.infer<typeof parentClassInfoSchema>;
export type ParentModuleOutcomeLabel = z.infer<typeof parentModuleOutcomeLabelSchema>;
export type ParentActivityStats = z.infer<typeof parentActivityStatsSchema>;
export type ParentAssignmentOutcome = z.infer<typeof parentAssignmentOutcomeSchema>;
export type ParentModuleProgress = z.infer<typeof parentModuleProgressSchema>;
export type ParentEnrollmentProgression = z.infer<
  typeof parentEnrollmentProgressionSchema
>;
