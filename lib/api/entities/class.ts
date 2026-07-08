import { z } from "zod";

import { classSessionSchema } from "@/lib/api/entities/class-session";
import { classStudentRosterSchema } from "@/lib/api/entities/class-student";

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
  mentorId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  maxCapacity: z.number().int(),
  seatsTaken: z.number().int(),
  status: classStatusSchema,
  minHoursBeforeAssignmentJoin: z.number().int(),
  scheduleSummary: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  students: z.array(classStudentRosterSchema).default([]),
});

export const classWithSessionsSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  programId: z.string().uuid(),
  mentorId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  maxCapacity: z.number().int(),
  seatsTaken: z.number().int(),
  status: classStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  sessions: z.array(classSessionSchema).default([]),
});

export type ClassStatus = z.infer<typeof classStatusSchema>;
export type Class = z.infer<typeof classSchema>;
export type ClassWithSessions = z.infer<typeof classWithSessionsSchema>;
