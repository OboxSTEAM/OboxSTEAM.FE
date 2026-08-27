import { z } from "zod";

import { classSessionKindSchema } from "@/lib/api/entities/class-session";

/** `OpenEnrollmentClassSessionDto` */
export const openEnrollmentClassSessionSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  sessionKind: classSessionKindSchema,
  location: z.string().nullable(),
});

/** `OpenEnrollmentClassDto` — public recruiting-class preview. */
export const openEnrollmentClassSchema = z.object({
  classId: z.string().uuid(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  mentorId: z.string().uuid().nullable(),
  mentorName: z.string().nullable(),
  maxCapacity: z.number().int(),
  seatsTaken: z.number().int(),
  seatsRemaining: z.number().int(),
  scheduleSummary: z.string().nullable(),
  isPreferred: z.boolean(),
  sessions: z
    .array(openEnrollmentClassSessionSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type OpenEnrollmentClassSession = z.infer<
  typeof openEnrollmentClassSessionSchema
>;
export type OpenEnrollmentClass = z.infer<typeof openEnrollmentClassSchema>;
