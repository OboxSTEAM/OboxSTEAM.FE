import { z } from "zod";

import { activityTypeSchema } from "@/lib/api/entities/activity";
import { resumeStateSchema } from "@/lib/api/entities/activity-progress";
import { assignmentTypeSchema } from "@/lib/api/entities/assignment";
import { materialTypeSchema } from "@/lib/api/entities/material";
import { moduleTypeSchema } from "@/lib/api/entities/module";

/** Activity scheduling mode on mind-map activity nodes. */
export const schedulingModeSchema = z.enum([
  "SelfPaced",
  "ClassSynchronized",
  "OptionalBooking",
]);

/**
 * Per-node status on the curriculum mind map.
 * Includes `in_progress` (started but incomplete) and `submitted` (assignment).
 */
export const mindMapNodeStatusSchema = z.enum([
  "completed",
  "current",
  "in_progress",
  "available",
  "submitted",
  "locked",
]);

export const mindMapNavigationSchema = z.object({
  targetType: z.string().nullable(),
  targetId: z.string(),
  moduleEnrollmentId: z.string().nullable(),
});

export const mindMapChildProgressSchema = z.object({
  totalCount: z.number(),
  completedCount: z.number(),
  progressPercent: z.number(),
});

export const mindMapContainerLearningSchema = z.object({
  status: mindMapNodeStatusSchema.nullable(),
  progressPercent: z.number(),
  isLocked: z.boolean(),
  lockReason: z.string().nullable(),
});

export const mindMapModuleLearningSchema = z.object({
  status: mindMapNodeStatusSchema.nullable(),
  progressPercent: z.number(),
  isLocked: z.boolean(),
  lockReason: z.string().nullable(),
});

export const mindMapActivityLearningSchema = z.object({
  status: mindMapNodeStatusSchema.nullable(),
  isLocked: z.boolean(),
  lockReason: z.string().nullable(),
  resumeState: resumeStateSchema.nullable().optional(),
  lastAccessedAt: z.string().nullable(),
});

export const mindMapAssignmentLearningSchema = z.object({
  status: mindMapNodeStatusSchema.nullable(),
  isLocked: z.boolean(),
  lockReason: z.string().nullable(),
});

export const mindMapPathNodeSchema = z.object({
  nodeType: z.string().nullable(),
  nodeId: z.string(),
});

export const mindMapPathSchema = z.object({
  nodes: z.array(mindMapPathNodeSchema).nullable(),
});

export const mindMapHubSchema = z.object({
  programId: z.string(),
  programName: z.string().nullable(),
  progressPercent: z.number(),
  status: mindMapNodeStatusSchema.nullable(),
  completedModuleCount: z.number(),
  totalModuleCount: z.number(),
  navigation: mindMapNavigationSchema,
});

export const mindMapModuleInfoSchema = z.object({
  moduleId: z.string(),
  moduleName: z.string().nullable(),
  moduleCode: z.string().nullable(),
  moduleOrder: z.number(),
  moduleType: moduleTypeSchema,
  prerequisiteModuleId: z.string().nullable(),
  moduleEnrollmentId: z.string().nullable(),
  isMandatory: z.boolean(),
  learningOutcomes: z.array(z.string()).nullable(),
});

export const mindMapCourseInfoSchema = z.object({
  courseId: z.string(),
  courseName: z.string().nullable(),
  courseOrder: z.number(),
});

export const mindMapMilestoneInfoSchema = z.object({
  milestoneId: z.string(),
  milestoneName: z.string().nullable(),
  milestoneOrder: z.number(),
  isCapstone: z.boolean(),
});

export const mindMapMaterialSchema = z.object({
  materialId: z.string(),
  materialName: z.string().nullable(),
  materialType: materialTypeSchema,
});

export const mindMapActivityInfoSchema = z.object({
  activityId: z.string(),
  activityName: z.string().nullable(),
  activityCode: z.string().nullable(),
  activityOrder: z.number(),
  activityType: activityTypeSchema,
  schedulingMode: schedulingModeSchema,
  description: z.string().nullable(),
  material: mindMapMaterialSchema.nullable().optional(),
});

export const mindMapAssignmentInfoSchema = z.object({
  assignmentId: z.string(),
  assignmentCode: z.string().nullable(),
  title: z.string().nullable(),
  assignmentType: assignmentTypeSchema,
  maxPoints: z.number(),
  passScore: z.number(),
  isRequiredForModulePass: z.boolean(),
  dueDate: z.string().nullable(),
});

export const mindMapAssignmentSchema = z.object({
  assignmentInfo: mindMapAssignmentInfoSchema,
  learning: mindMapAssignmentLearningSchema,
  navigation: mindMapNavigationSchema,
});

export const mindMapActivitySchema = z.object({
  activityInfo: mindMapActivityInfoSchema,
  learning: mindMapActivityLearningSchema,
  navigation: mindMapNavigationSchema,
});

export const mindMapCourseSchema = z.object({
  courseInfo: mindMapCourseInfoSchema,
  learning: mindMapContainerLearningSchema,
  childProgress: mindMapChildProgressSchema,
  navigation: mindMapNavigationSchema,
  activities: z.array(mindMapActivitySchema).nullable(),
  assignments: z.array(mindMapAssignmentSchema).nullable(),
});

export const mindMapMilestoneSchema = z.object({
  milestoneInfo: mindMapMilestoneInfoSchema,
  learning: mindMapContainerLearningSchema,
  childProgress: mindMapChildProgressSchema,
  navigation: mindMapNavigationSchema,
  activities: z.array(mindMapActivitySchema).nullable(),
  assignment: mindMapAssignmentSchema.nullable().optional(),
});

export const mindMapModuleSchema = z.object({
  moduleInfo: mindMapModuleInfoSchema,
  learning: mindMapModuleLearningSchema,
  childProgress: mindMapChildProgressSchema,
  navigation: mindMapNavigationSchema,
  courses: z.array(mindMapCourseSchema).nullable(),
  milestones: z.array(mindMapMilestoneSchema).nullable(),
  assignments: z.array(mindMapAssignmentSchema).nullable(),
});

/** `GET /api/program-enrollments/{enrollmentId}/curriculum-mind-map` data. */
export const enrollmentCurriculumMindMapSchema = z.object({
  enrollmentId: z.string(),
  hub: mindMapHubSchema,
  currentPaths: z.array(mindMapPathSchema).nullable(),
  modules: z.array(mindMapModuleSchema).nullable(),
});

export type SchedulingMode = z.infer<typeof schedulingModeSchema>;
export type MindMapNodeStatus = z.infer<typeof mindMapNodeStatusSchema>;
export type MindMapNavigation = z.infer<typeof mindMapNavigationSchema>;
export type MindMapChildProgress = z.infer<typeof mindMapChildProgressSchema>;
export type MindMapContainerLearning = z.infer<typeof mindMapContainerLearningSchema>;
export type MindMapModuleLearning = z.infer<typeof mindMapModuleLearningSchema>;
export type MindMapActivityLearning = z.infer<typeof mindMapActivityLearningSchema>;
export type MindMapAssignmentLearning = z.infer<typeof mindMapAssignmentLearningSchema>;
export type MindMapPathNode = z.infer<typeof mindMapPathNodeSchema>;
export type MindMapPath = z.infer<typeof mindMapPathSchema>;
export type MindMapHub = z.infer<typeof mindMapHubSchema>;
export type MindMapModuleInfo = z.infer<typeof mindMapModuleInfoSchema>;
export type MindMapCourseInfo = z.infer<typeof mindMapCourseInfoSchema>;
export type MindMapMilestoneInfo = z.infer<typeof mindMapMilestoneInfoSchema>;
export type MindMapMaterial = z.infer<typeof mindMapMaterialSchema>;
export type MindMapActivityInfo = z.infer<typeof mindMapActivityInfoSchema>;
export type MindMapAssignmentInfo = z.infer<typeof mindMapAssignmentInfoSchema>;
export type MindMapAssignment = z.infer<typeof mindMapAssignmentSchema>;
export type MindMapActivity = z.infer<typeof mindMapActivitySchema>;
export type MindMapCourse = z.infer<typeof mindMapCourseSchema>;
export type MindMapMilestone = z.infer<typeof mindMapMilestoneSchema>;
export type MindMapModule = z.infer<typeof mindMapModuleSchema>;
export type EnrollmentCurriculumMindMap = z.infer<typeof enrollmentCurriculumMindMapSchema>;
