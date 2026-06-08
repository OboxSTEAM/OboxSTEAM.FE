import { z } from "zod";

export const programReviewSchema = z.object({
  id: z.string(),
  programId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  studentAvatarUrl: z.string().nullable(),
  starRating: z.number(),
  comment: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProgramReview = z.infer<typeof programReviewSchema>;
