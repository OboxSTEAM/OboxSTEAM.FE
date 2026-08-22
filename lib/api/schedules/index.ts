import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";

import {
  weeklyScheduleResponseSchema,
  type WeeklyScheduleResult,
} from "./schemas";

export type {
  ScheduleDay,
  ScheduleDayOfWeek,
  ScheduleSession,
  WeeklySchedule,
  WeeklyScheduleResponse,
  WeeklyScheduleResult,
} from "./schemas";

export type WeeklyScheduleQuery = {
  /** Monday in Asia/Ho_Chi_Minh as `yyyy-MM-dd`. Omit for current week. */
  weekStart?: string | null;
  /** Required when caller is Parent. */
  studentId?: string | null;
};

function requireApiValue<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new ApiResponseError("API response missing value.");
  }
  return value;
}

/** `GET /api/schedules/weekly` — student (or parent+studentId) weekly timetable. */
export async function getWeeklySchedule(
  query: WeeklyScheduleQuery = {},
): Promise<WeeklyScheduleResult> {
  const params = new URLSearchParams();
  if (query.weekStart?.trim()) {
    params.set("weekStart", query.weekStart.trim());
  }
  if (query.studentId?.trim()) {
    params.set("studentId", query.studentId.trim());
  }
  const qs = params.toString();
  const path = qs ? `/api/schedules/weekly?${qs}` : "/api/schedules/weekly";

  const response = await apiFetchParsed(path, weeklyScheduleResponseSchema, {
    method: "GET",
  });
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
