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
  status: classSessionExpertStatusSchema,
  sessionTitle: nullableStringSchema,
  sessionKind: z.enum(["LiveOnline", "Offline", "AssignmentWindow"]),
  sessionStatus: z.enum(["Scheduled", "InProgress", "Completed", "Cancelled"]),
  sessionStartTime: z.string(),
  sessionEndTime: z.string(),
  scheduleConflictWarning: z.string().nullable(),
  mentorFeedback: z.string().nullable(),
  mentorFeedbackRating: z.number().int().nullable(),
  mentorFeedbackAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type ClassSessionExpert = z.infer<typeof classSessionExpertSchema>;
export type ClassSessionExpertStatus = z.infer<
  typeof classSessionExpertStatusSchema
>;
