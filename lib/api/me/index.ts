import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";

import {
  getMyScheduleResponseSchema,
  type GetMyScheduleResult,
} from "./schemas";

export type {
  GetMyScheduleResponse,
  GetMyScheduleResult,
  StudentScheduleInterval,
} from "./schemas";

function requireApiValue<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new ApiResponseError("API response missing value.");
  }
  return value;
}

/** `GET /api/me/schedule` — occupied session intervals for the signed-in student. */
export async function getMySchedule(): Promise<GetMyScheduleResult> {
  const response = await apiFetchParsed(
    "/api/me/schedule",
    getMyScheduleResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
