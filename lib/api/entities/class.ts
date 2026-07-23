import { z } from "zod";

import { classSessionSchema } from "@/lib/api/entities/class-session";
import { classStudentRosterSchema } from "@/lib/api/entities/class-student";
import { classMentorSummarySchema } from "@/lib/api/entities/mentor";

export const classStatusSchema = z.enum([
  "Draft",
  "Open",
  "InProgress",
  "Completed",
  "Cancelled",
]);

export const classSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  programId: z.string().uuid(),
  mentorId: z.string().uuid().nullable(),
  mentor: classMentorSummarySchema.nullable().optional(),
  startDate: z.string(),
  endDate: z.string(),
  maxCapacity: z.number().int(),
  seatsTaken: z.number().int(),
  status: classStatusSchema,
  minHoursBeforeAssignmentJoin: z.number().int(),
  scheduleSummary: z.string().nullable(),
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
