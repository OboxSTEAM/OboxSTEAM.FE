import { z } from "zod";

export const dashboardRangeSchema = z.enum([
  "Last7Days",
  "Last30Days",
  "Last90Days",
  "Last12Months",
]);

export const paymentStatusFilterSchema = z.enum([
  "Pending",
  "Success",
  "Failed",
  "Cancelled",
  "Refunded",
]);

export const enrollmentStatusFilterSchema = z.enum([
  "PendingPayment",
  "Active",
  "Deferred",
  "Completed",
  "Failed",
  "Dropped",
]);

export const classEnrollmentStatusFilterSchema = z.enum([
  "Active",
  "Transferred",
  "Withdrawn",
  "Completed",
]);

export const submissionStatusFilterSchema = z.enum([
  "Pending",
  "TurnedIn",
  "Graded",
  "ReturnedForRevision",
]);

export const classStatusFilterSchema = z.enum([
  "Draft",
  "Open",
  "InProgress",
  "Completed",
  "Cancelled",
]);

/** Shared query for `GET /api/dashboard/*`. */
export const dashboardQuerySchema = z.object({
  range: dashboardRangeSchema.optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  programId: z.string().uuid().optional(),
  moduleId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  paymentStatus: paymentStatusFilterSchema.optional(),
  enrollmentStatus: enrollmentStatusFilterSchema.optional(),
  classEnrollmentStatus: classEnrollmentStatusFilterSchema.optional(),
  submissionStatus: submissionStatusFilterSchema.optional(),
  classStatus: classStatusFilterSchema.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  sortBy: z.string().optional(),
  isDescending: z.boolean().optional(),
});

export type DashboardRange = z.infer<typeof dashboardRangeSchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
