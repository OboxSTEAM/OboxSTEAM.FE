import { z } from "zod";

export const trendGranularitySchema = z.enum(["Daily", "Weekly", "Monthly"]);

export const trendValueKindSchema = z.enum(["Count", "Currency", "Percent"]);

export const trendPointSchema = z.object({
  label: z.string().nullable(),
  bucketStart: z.string(),
  value: z.number(),
});

export const trendSeriesSchema = z.object({
  fromDate: z.string(),
  toDate: z.string(),
  granularity: trendGranularitySchema,
  valueKind: trendValueKindSchema,
  points: z
    .array(trendPointSchema)
    .nullable()
    .transform((points) => points ?? []),
});

export const statusCountSchema = z.object({
  status: z.string().nullable(),
  count: z.number().int(),
});

const nullableStatusCountListSchema = z
  .array(statusCountSchema)
  .nullable()
  .transform((items) => items ?? []);

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
  revenueInPreviousRange: z.number(),
  pendingPaymentRequestsCount: z.number().int(),
  pendingPaymentRequestsAmount: z.number(),
  refundedAmount: z.number(),
});

export const enrollmentKpiSummarySchema = z.object({
  totalPrograms: z.number().int(),
  activeStudents: z.number().int(),
  newEnrollmentsInRange: z.number().int(),
  newEnrollmentsInPreviousRange: z.number().int(),
  completionRate: z.number(),
  completionRateInPreviousRange: z.number(),
  rateUnit: z.string().nullable(),
});

export const assessmentKpiSummarySchema = z.object({
  totalSubmissions: z.number().int(),
  submissionsInRange: z.number().int(),
  submissionsInPreviousRange: z.number().int(),
  gradingBacklogCount: z.number().int(),
  gradingBacklogThresholdHours: z.number().int(),
  passRate: z.number(),
  passRateInPreviousRange: z.number(),
  averageScore: z.number(),
  rateUnit: z.string().nullable(),
});

export const operationsKpiSummarySchema = z.object({
  activeClassCount: z.number().int(),
  averageCapacityUtilization: z.number(),
  averageCapacityUtilizationInPreviousRange: z.number(),
  pendingMentorRequestsCount: z.number().int(),
  averageAttendanceRate: z.number(),
  averageAttendanceRateInPreviousRange: z.number(),
  rateUnit: z.string().nullable(),
});

export const dashboardOverviewSchema = z.object({
  revenue: revenueKpiSummarySchema,
  enrollment: enrollmentKpiSummarySchema,
  assessment: assessmentKpiSummarySchema,
  operations: operationsKpiSummarySchema,
});

export const revenueOverviewSchema = z.object({
  totalRevenue: z.number(),
  revenueInRange: z.number(),
  revenueInPreviousRange: z.number(),
  averageOrderValue: z.number(),
  pendingPaymentRequestsCount: z.number().int(),
  pendingPaymentRequestsAmount: z.number(),
  refundedAmount: z.number(),
  invoiceCount: z.number().int(),
  revenueTrend: trendSeriesSchema,
  revenueByGateway: z
    .array(revenueByGatewaySchema)
    .nullable()
    .transform((items) => items ?? []),
  topProgramsByRevenue: createNullablePaginatedSchema(topProgramRevenueSchema),
});

export const enrollmentOverviewSchema = z.object({
  totalPrograms: z.number().int(),
  totalModules: z.number().int(),
  totalCourses: z.number().int(),
  activeStudents: z.number().int(),
  newEnrollmentsInRange: z.number().int(),
  newEnrollmentsInPreviousRange: z.number().int(),
  completionRate: z.number(),
  completionRateInPreviousRange: z.number(),
  rateUnit: z.string().nullable(),
  programEnrollmentsByStatus: nullableStatusCountListSchema,
  moduleEnrollmentsByStatus: nullableStatusCountListSchema,
  classEnrollmentsByStatus: nullableStatusCountListSchema,
  enrollmentTrend: trendSeriesSchema,
  topProgramsByEnrollment: createNullablePaginatedSchema(
    topProgramEnrollmentSchema,
  ),
});

export const assessmentOverviewSchema = z.object({
  totalSubmissions: z.number().int(),
  submissionsInRange: z.number().int(),
  submissionsInPreviousRange: z.number().int(),
  submissionsByStatus: nullableStatusCountListSchema,
  gradingBacklogCount: z.number().int(),
  gradingBacklogThresholdHours: z.number().int(),
  averageGradingTurnaroundHours: z.number(),
  passRate: z.number(),
  passRateInPreviousRange: z.number(),
  averageScore: z.number(),
  rateUnit: z.string().nullable(),
  submissionsTrend: trendSeriesSchema,
});

export const operationsOverviewSchema = z.object({
  classesByStatus: nullableStatusCountListSchema,
  averageCapacityUtilization: z.number(),
  averageCapacityUtilizationInPreviousRange: z.number(),
  pendingMentorRequestsCount: z.number().int(),
  averageAttendanceRate: z.number(),
  averageAttendanceRateInPreviousRange: z.number(),
  rateUnit: z.string().nullable(),
  attendanceTrend: trendSeriesSchema,
  mentorUtilization: createNullablePaginatedSchema(mentorUtilizationSchema),
});

export const dashboardLandingSchema = z.object({
  revenue: revenueOverviewSchema,
  enrollment: enrollmentOverviewSchema,
  assessment: assessmentOverviewSchema,
  operations: operationsOverviewSchema,
});

export type TrendGranularity = z.infer<typeof trendGranularitySchema>;
export type TrendValueKind = z.infer<typeof trendValueKindSchema>;
export type TrendPoint = z.infer<typeof trendPointSchema>;
export type TrendSeries = z.infer<typeof trendSeriesSchema>;
export type StatusCount = z.infer<typeof statusCountSchema>;
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
export type DashboardLanding = z.infer<typeof dashboardLandingSchema>;
