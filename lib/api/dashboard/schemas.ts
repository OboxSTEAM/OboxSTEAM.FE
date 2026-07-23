import { z } from "zod";

import {
  assessmentOverviewSchema,
  dashboardOverviewSchema,
  enrollmentOverviewSchema,
  operationsOverviewSchema,
  revenueOverviewSchema,
} from "@/lib/api/entities/dashboard";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const dashboardOverviewValueSchema = createApiValueSchema(dashboardOverviewSchema);
export const getDashboardOverviewResponseSchema = createApiResponseSchema(
  dashboardOverviewValueSchema,
);

export const revenueOverviewValueSchema = createApiValueSchema(revenueOverviewSchema);
export const getDashboardRevenueResponseSchema = createApiResponseSchema(
  revenueOverviewValueSchema,
);

export const enrollmentOverviewValueSchema = createApiValueSchema(enrollmentOverviewSchema);
export const getDashboardEnrollmentResponseSchema = createApiResponseSchema(
  enrollmentOverviewValueSchema,
);

export const assessmentOverviewValueSchema = createApiValueSchema(assessmentOverviewSchema);
export const getDashboardAssessmentResponseSchema = createApiResponseSchema(
  assessmentOverviewValueSchema,
);

export const operationsOverviewValueSchema = createApiValueSchema(operationsOverviewSchema);
export const getDashboardOperationsResponseSchema = createApiResponseSchema(
  operationsOverviewValueSchema,
);

export type GetDashboardOverviewResponse = z.infer<typeof getDashboardOverviewResponseSchema>;
export type GetDashboardOverviewResult = GetDashboardOverviewResponse["value"];

export type GetDashboardRevenueResponse = z.infer<typeof getDashboardRevenueResponseSchema>;
export type GetDashboardRevenueResult = GetDashboardRevenueResponse["value"];

export type GetDashboardEnrollmentResponse = z.infer<
  typeof getDashboardEnrollmentResponseSchema
>;
export type GetDashboardEnrollmentResult = GetDashboardEnrollmentResponse["value"];

export type GetDashboardAssessmentResponse = z.infer<
  typeof getDashboardAssessmentResponseSchema
>;
export type GetDashboardAssessmentResult = GetDashboardAssessmentResponse["value"];

export type GetDashboardOperationsResponse = z.infer<
  typeof getDashboardOperationsResponseSchema
>;
export type GetDashboardOperationsResult = GetDashboardOperationsResponse["value"];
