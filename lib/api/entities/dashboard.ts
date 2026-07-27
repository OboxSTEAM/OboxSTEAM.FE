import { z } from "zod";

export const trendPointSchema = z.object({
  label: z.string().nullable(),
  value: z.number(),
});

export const revenueByGatewaySchema = z.object({
  gateway: z.enum(["VnPay", "Stripe", "BankTransfer"]),
  amount: z.number(),
});

export const topProgramRevenueSchema = z.object({
  programId: z.string().uuid(),
  programName: z.string().nullable(),
  amount: z.number(),
});

export const topProgramEnrollmentSchema = z.object({
  programId: z.string().uuid(),
  programName: z.string().nullable(),
  count: z.number().int(),
});

export const mentorUtilizationSchema = z.object({
  mentorId: z.string().uuid(),
  mentorName: z.string().nullable(),
  assigned: z.number().int(),
  pending: z.number().int(),
  max: z.number().int(),
});

function createNullablePaginatedSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z
      .array(itemSchema)
      .nullable()
      .transform((items) => items ?? []),
    currentPage: z.number(),
    totalPages: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    hasPrevious: z.boolean(),
    hasNext: z.boolean(),
  });
}

export const revenueKpiSummarySchema = z.object({
  totalRevenue: z.number(),
  revenueInRange: z.number(),
  pendingPaymentRequestsCount: z.number().int(),
  pendingPaymentRequestsAmount: z.number(),
  refundedAmount: z.number(),
});

export const enrollmentKpiSummarySchema = z.object({
  totalPrograms: z.number().int(),
  activeStudents: z.number().int(),
  newEnrollmentsInRange: z.number().int(),
  completionRate: z.number(),
});

export const assessmentKpiSummarySchema = z.object({
  totalSubmissions: z.number().int(),
  gradingBacklogCount: z.number().int(),
  passRate: z.number(),
  averageScore: z.number(),
});

export const operationsKpiSummarySchema = z.object({
  activeClassCount: z.number().int(),
  averageCapacityUtilization: z.number(),
  pendingMentorRequestsCount: z.number().int(),
  averageAttendanceRate: z.number(),
});

export const dashboardOverviewSchema = z.object({
  revenue: revenueKpiSummarySchema,
  enrollment: enrollmentKpiSummarySchema,
  assessment: assessmentKpiSummarySchema,
  operations: operationsKpiSummarySchema,
});

const statusCountMapSchema = z.record(z.string(), z.number().int()).nullable();

export const revenueOverviewSchema = z.object({
  totalRevenue: z.number(),
  revenueInRange: z.number(),
  averageOrderValue: z.number(),
  pendingPaymentRequestsCount: z.number().int(),
  pendingPaymentRequestsAmount: z.number(),
  refundedAmount: z.number(),
  invoiceCount: z.number().int(),
  revenueTrend: z.array(trendPointSchema).nullable(),
  revenueByGateway: z.array(revenueByGatewaySchema).nullable(),
  topProgramsByRevenue: createNullablePaginatedSchema(topProgramRevenueSchema),
});

export const enrollmentOverviewSchema = z.object({
  totalPrograms: z.number().int(),
  totalModules: z.number().int(),
  totalCourses: z.number().int(),
  activeStudents: z.number().int(),
  newEnrollmentsInRange: z.number().int(),
  completionRate: z.number(),
  programEnrollmentsByStatus: statusCountMapSchema,
  moduleEnrollmentsByStatus: statusCountMapSchema,
  classEnrollmentsByStatus: statusCountMapSchema,
  enrollmentTrend: z.array(trendPointSchema).nullable(),
  topProgramsByEnrollment: createNullablePaginatedSchema(topProgramEnrollmentSchema),
});

export const assessmentOverviewSchema = z.object({
  totalSubmissions: z.number().int(),
  submissionsByStatus: statusCountMapSchema,
  gradingBacklogCount: z.number().int(),
  averageGradingTurnaroundHours: z.number(),
  passRate: z.number(),
  averageScore: z.number(),
  submissionsTrend: z.array(trendPointSchema).nullable(),
});

export const operationsOverviewSchema = z.object({
  classesByStatus: statusCountMapSchema,
  averageCapacityUtilization: z.number(),
  pendingMentorRequestsCount: z.number().int(),
  averageAttendanceRate: z.number(),
  attendanceTrend: z.array(trendPointSchema).nullable(),
  mentorUtilization: createNullablePaginatedSchema(mentorUtilizationSchema),
});

export type TrendPoint = z.infer<typeof trendPointSchema>;
export type RevenueByGateway = z.infer<typeof revenueByGatewaySchema>;
export type TopProgramRevenue = z.infer<typeof topProgramRevenueSchema>;
export type TopProgramEnrollment = z.infer<typeof topProgramEnrollmentSchema>;
export type MentorUtilization = z.infer<typeof mentorUtilizationSchema>;
export type RevenueKpiSummary = z.infer<typeof revenueKpiSummarySchema>;
export type EnrollmentKpiSummary = z.infer<typeof enrollmentKpiSummarySchema>;
export type AssessmentKpiSummary = z.infer<typeof assessmentKpiSummarySchema>;
export type OperationsKpiSummary = z.infer<typeof operationsKpiSummarySchema>;
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
export type RevenueOverview = z.infer<typeof revenueOverviewSchema>;
export type EnrollmentOverview = z.infer<typeof enrollmentOverviewSchema>;
export type AssessmentOverview = z.infer<typeof assessmentOverviewSchema>;
export type OperationsOverview = z.infer<typeof operationsOverviewSchema>;
