import { z } from "zod";

export const programEnrollmentSortBySchema = z.enum([
  "enrolledAt",
  "progressPercent",
  "status",
  "createdAt",
]);

/** Query params for `GET /api/program-enrollments/me`. */
export const myProgramEnrollmentsQuerySchema = z.object({
  sortBy: programEnrollmentSortBySchema.optional(),
  isDescending: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
});
