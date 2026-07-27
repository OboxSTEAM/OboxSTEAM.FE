import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  dashboardQuerySchema,
  type DashboardQuery,
} from "@/lib/validations/dashboard";

import {
  getDashboardAssessmentResponseSchema,
  getDashboardEnrollmentResponseSchema,
  getDashboardOperationsResponseSchema,
  getDashboardOverviewResponseSchema,
  getDashboardRevenueResponseSchema,
  type GetDashboardAssessmentResult,
  type GetDashboardEnrollmentResult,
  type GetDashboardOperationsResult,
  type GetDashboardOverviewResult,
  type GetDashboardRevenueResult,
} from "./schemas";

export type {
  GetDashboardAssessmentResponse,
  GetDashboardAssessmentResult,
  GetDashboardEnrollmentResponse,
  GetDashboardEnrollmentResult,
  GetDashboardOperationsResponse,
  GetDashboardOperationsResult,
  GetDashboardOverviewResponse,
  GetDashboardOverviewResult,
  GetDashboardRevenueResponse,
  GetDashboardRevenueResult,
} from "./schemas";

export type {
  AssessmentKpiSummary,
  AssessmentOverview,
  DashboardOverview,
  EnrollmentKpiSummary,
  EnrollmentOverview,
  MentorUtilization,
  OperationsKpiSummary,
  OperationsOverview,
  RevenueByGateway,
  RevenueKpiSummary,
  RevenueOverview,
  TopProgramEnrollment,
  TopProgramRevenue,
  TrendPoint,
} from "@/lib/api/entities/dashboard";

export type { DashboardQuery, DashboardRange } from "@/lib/validations/dashboard";

const DASHBOARD_BASE = "/api/dashboard";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildDashboardQuery(params?: DashboardQuery): string {
  if (!params) return "";
  const parsed = dashboardQuerySchema.parse(params);
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/** `GET /api/dashboard/overview` — landing KPI summaries. */
export async function getDashboardOverview(
  params?: DashboardQuery,
): Promise<GetDashboardOverviewResult> {
  const response = await apiFetchParsed(
    `${DASHBOARD_BASE}/overview${buildDashboardQuery(params)}`,
    getDashboardOverviewResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/dashboard/revenue` — revenue section. */
export async function getDashboardRevenue(
  params?: DashboardQuery,
): Promise<GetDashboardRevenueResult> {
  const response = await apiFetchParsed(
    `${DASHBOARD_BASE}/revenue${buildDashboardQuery(params)}`,
    getDashboardRevenueResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/dashboard/enrollment` — enrollment section + trend. */
export async function getDashboardEnrollment(
  params?: DashboardQuery,
): Promise<GetDashboardEnrollmentResult> {
  const response = await apiFetchParsed(
    `${DASHBOARD_BASE}/enrollment${buildDashboardQuery(params)}`,
    getDashboardEnrollmentResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/dashboard/assessment` — assessment section. */
export async function getDashboardAssessment(
  params?: DashboardQuery,
): Promise<GetDashboardAssessmentResult> {
  const response = await apiFetchParsed(
    `${DASHBOARD_BASE}/assessment${buildDashboardQuery(params)}`,
    getDashboardAssessmentResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/dashboard/operations` — operations section. */
export async function getDashboardOperations(
  params?: DashboardQuery,
): Promise<GetDashboardOperationsResult> {
  const response = await apiFetchParsed(
    `${DASHBOARD_BASE}/operations${buildDashboardQuery(params)}`,
    getDashboardOperationsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
