import { z } from "zod";

import { classSessionSchema } from "@/lib/api/entities/class-session";
import { classStudentRosterSchema } from "@/lib/api/entities/class-student";
import { skillSummarySchema } from "@/lib/api/entities/skill";

export const classStatusSchema = z.enum([
  "Draft",
  "Open",
  "InProgress",
  "Completed",
  "Cancelled",
]);

export const classSchema = z.object({
  id: z.string().uuid(),
  code: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  name: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  programId: z.string().uuid(),
  mentorId: z.string().uuid().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  maxCapacity: z.number().int(),
  seatsTaken: z.number().int(),
  status: classStatusSchema,
  minHoursBeforeAssignmentJoin: z.number().int(),
  scheduleSummary: z.string().nullable(),
  requiredSkills: z
    .array(skillSummarySchema)
    .nullish()
    .transform((value) => value ?? []),
  pendingMentorRequestCount: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? 0),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  students: z
    .array(classStudentRosterSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const classWithSessionsSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  programId: z.string().uuid(),
  mentorId: z.string().uuid().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  maxCapacity: z.number().int(),
  seatsTaken: z.number().int(),
  status: classStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  sessions: z
    .array(classSessionSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type ClassStatus = z.infer<typeof classStatusSchema>;
export type Class = z.infer<typeof classSchema>;
export type ClassWithSessions = z.infer<typeof classWithSessionsSchema>;
