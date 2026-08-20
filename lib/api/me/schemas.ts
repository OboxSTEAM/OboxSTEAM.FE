import { z } from "zod";

import { classSessionKindSchema, classSessionStatusSchema } from "@/lib/api/entities/class-session";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

/** Busy interval from `GET /api/me/schedule`. */
export const studentScheduleIntervalSchema = z.object({
  classSessionId: z.string().uuid(),
  classId: z.string().uuid(),
  classCode: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  className: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  title: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  startTime: z.string(),
  endTime: z.string(),
  sessionKind: classSessionKindSchema,
  status: classSessionStatusSchema,
});

export const studentScheduleIntervalsValueSchema = createApiValueSchema(
  z.array(studentScheduleIntervalSchema),
);

export const getMyScheduleResponseSchema = createApiResponseSchema(
  studentScheduleIntervalsValueSchema,
);

export type StudentScheduleInterval = z.infer<
  typeof studentScheduleIntervalSchema
>;
export type GetMyScheduleResponse = z.infer<typeof getMyScheduleResponseSchema>;
export type GetMyScheduleResult = GetMyScheduleResponse["value"];
