import { z } from "zod";

import {
  classSessionKindSchema,
  classSessionStatusSchema,
} from "@/lib/api/entities/class-session";
import { sessionAttendanceStatusSchema } from "@/lib/api/entities/session-attendance";
import {
  createApiResponseSchema,
  createApiValueSchema,
} from "@/lib/api/schemas";

export const scheduleDayOfWeekSchema = z.enum([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

export const scheduleSessionSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  classCode: z.string(),
  className: z.string(),
  programId: z.string().uuid(),
  mentorId: z.string().uuid().nullable(),
  moduleId: z.string().uuid(),
  activityId: z.string().uuid().nullable(),
  sessionKind: classSessionKindSchema,
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().nullable(),
  meetingUrl: z
    .string()
    .nullable()
    .nullish()
    .transform((value) => value ?? null),
  status: classSessionStatusSchema,
  isCompleted: z.boolean(),
  attendanceStatus: sessionAttendanceStatusSchema.nullable(),
});

export const scheduleDaySchema = z.object({
  date: z.string(),
  dayOfWeek: scheduleDayOfWeekSchema,
  sessions: z.array(scheduleSessionSchema),
});

export const weeklyScheduleSchema = z.object({
  studentId: z.string().uuid(),
  weekStart: z.string(),
  weekEnd: z.string(),
  timezone: z.string(),
  days: z.array(scheduleDaySchema).length(7),
});

export const weeklyScheduleValueSchema =
  createApiValueSchema(weeklyScheduleSchema);
export const weeklyScheduleResponseSchema = createApiResponseSchema(
  weeklyScheduleValueSchema,
);

export type ScheduleDayOfWeek = z.infer<typeof scheduleDayOfWeekSchema>;
export type ScheduleSession = z.infer<typeof scheduleSessionSchema>;
export type ScheduleDay = z.infer<typeof scheduleDaySchema>;
export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>;
export type WeeklyScheduleResponse = z.infer<typeof weeklyScheduleResponseSchema>;
export type WeeklyScheduleResult = z.infer<typeof weeklyScheduleValueSchema>;
