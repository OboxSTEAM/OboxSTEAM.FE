import { z } from "zod";

export const classMentorRequestStatusSchema = z.enum([
  "Pending",
  "Approved",
  "Rejected",
  "Withdrawn",
]);

export const classMentorRequestSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  classCode: z.string().nullable(),
  className: z.string().nullable(),
  programId: z.string().uuid(),
  mentorId: z.string().uuid(),
  mentorCode: z.string().nullable(),
  mentorName: z.string().nullable(),
  status: classMentorRequestStatusSchema,
  message: z.string().nullable(),
  decidedAt: z.string().nullable(),
  decidedBy: z.string().uuid().nullable(),
  decisionNote: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type ClassMentorRequestStatus = z.infer<
  typeof classMentorRequestStatusSchema
>;
export type ClassMentorRequest = z.infer<typeof classMentorRequestSchema>;
