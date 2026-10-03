import { z } from "zod";

const nullableStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => value ?? "");

export const classSessionExpertStatusSchema = z.enum([
  "Invited",
  "Accepted",
  "Declined",
]);

export const classSessionExpertSchema = z.object({
  id: z.string().uuid(),
  classSessionId: z.string().uuid(),
  classId: z.string().uuid(),
  className: nullableStringSchema,
  programId: z.string().uuid(),
  expertId: z.string().uuid(),
  expertUserId: z.string().uuid().nullable(),
  expertCode: nullableStringSchema,
  expertName: nullableStringSchema,
  expertAvatarUrl: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  status: classSessionExpertStatusSchema,
  sessionTitle: nullableStringSchema,
  sessionKind: z.enum(["LiveOnline", "Offline", "AssignmentWindow"]),
  sessionStatus: z.enum(["Scheduled", "InProgress", "Completed", "Cancelled"]),
  sessionStartTime: z.string(),
  sessionEndTime: z.string(),
  /** Omitted on Student responses. Manager/Admin still send them. */
  scheduleConflictWarning: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  mentorFeedback: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  mentorFeedbackRating: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? null),
  mentorFeedbackAt: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type ClassSessionExpert = z.infer<typeof classSessionExpertSchema>;
export type ClassSessionExpertStatus = z.infer<
  typeof classSessionExpertStatusSchema
>;
