import { z } from "zod";

export const classSessionKindSchema = z.enum([
  "Lesson",
  "LiveOnline",
  "FieldTrip",
  "AssignmentWindow",
  "MentorCheckin",
]);

export const classSessionStatusSchema = z.enum([
  "Scheduled",
  "InProgress",
  "Completed",
  "Cancelled",
]);

export const classSessionSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  moduleId: z.string().uuid(),
  activityId: z.string().uuid(),
  assignmentId: z.string().uuid().nullable(),
  sessionKind: classSessionKindSchema,
  title: z.string(),
  description: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string(),
  maxCapacity: z.number().int().nullable(),
  requiresAttendance: z.boolean(),
  status: classSessionStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ClassSessionKind = z.infer<typeof classSessionKindSchema>;
export type ClassSessionStatus = z.infer<typeof classSessionStatusSchema>;
export type ClassSession = z.infer<typeof classSessionSchema>;
