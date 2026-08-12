import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  forceCompleteActivitySchema,
  type ForceCompleteActivityInput,
} from "@/lib/validations/activity-progresses";

import {
  forceCompleteActivityResponseSchema,
  type ForceCompleteActivityResult,
} from "./schemas";

export type {
  ForceCompleteActivityResponse,
  ForceCompleteActivityResult,
} from "./schemas";

export type {
  ActivityProgressRecord,
  ActivityProgressStatus,
} from "@/lib/api/entities/activity-progress-record";

export type { ForceCompleteActivityInput };

const ACTIVITY_PROGRESSES_BASE = "/api/activity-progresses";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/**
 * `POST /api/activity-progresses/force-complete`
 * Test-only mentor/manager endpoint — bypasses sequential locks and activity rules.
 */
export async function forceCompleteActivity(
  input: ForceCompleteActivityInput,
): Promise<ForceCompleteActivityResult> {
  const body = forceCompleteActivitySchema.parse(input);

  const response = await apiFetchParsed(
    `${ACTIVITY_PROGRESSES_BASE}/force-complete`,
    forceCompleteActivityResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
