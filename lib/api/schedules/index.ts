import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  getMonthGridMondays,
  isMondayDateOnly,
} from "@/lib/schedules/week";

import {
  weeklyScheduleResponseSchema,
  type ScheduleDay,
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

/**
 * Fan-out weekly API for every Monday covering a civil month.
 * Returns a map keyed by `yyyy-MM-dd`.
 */
export async function getMonthlyScheduleDays(input: {
  year: number;
  month: number;
  studentId?: string | null;
}): Promise<Map<string, ScheduleDay>> {
  const mondays = getMonthGridMondays(input.year, input.month);
  const weeks = await Promise.all(
    mondays.map(async (weekStart) => {
      if (!isMondayDateOnly(weekStart)) {
        throw new Error("Chọn ngày bắt đầu tuần (Thứ Hai)");
      }
      const result = await getWeeklySchedule({
        weekStart,
        studentId: input.studentId,
      });
      return result.data;
    }),
  );

  const byDate = new Map<string, ScheduleDay>();
  for (const week of weeks) {
    for (const day of week.days) {
      byDate.set(day.date, day);
    }
  }
  return byDate;
}
