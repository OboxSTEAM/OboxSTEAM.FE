import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { sessionAttendanceSchema } from "@/lib/api/entities/session-attendance";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";
import {
  sessionIdParamSchema,
  studentSessionCheckinSchema,
  type StudentSessionCheckinInput,
} from "@/lib/validations/class-sessions";

const CLASS_SESSIONS_BASE = "/api/class-sessions";

export const sessionCheckinTokenSchema = z.object({
  classSessionId: z.string().uuid(),
  token: z.string().uuid(),
  code: z.string(),
  expiresAt: z.string(),
});

export const sessionCheckinTokenValueSchema = createApiValueSchema(
  sessionCheckinTokenSchema,
);
export const sessionCheckinTokenResponseSchema = createApiResponseSchema(
  sessionCheckinTokenValueSchema,
);

export const sessionCheckinValueSchema = createApiValueSchema(sessionAttendanceSchema);
export const sessionCheckinResponseSchema = createApiResponseSchema(
  sessionCheckinValueSchema,
);

export type SessionCheckinToken = z.infer<typeof sessionCheckinTokenSchema>;
export type SessionCheckinTokenResponse = z.infer<
  typeof sessionCheckinTokenResponseSchema
>;
export type SessionCheckinTokenResult = SessionCheckinTokenResponse["value"];
export type SessionCheckinResponse = z.infer<typeof sessionCheckinResponseSchema>;
export type SessionCheckinResult = SessionCheckinResponse["value"];

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** Rotate and fetch a live check-in QR token (Mentor/Manager/Admin). */
export async function createSessionCheckinToken(
  sessionId: string,
): Promise<SessionCheckinTokenResult> {
  const { sessionId: parsedSessionId } = sessionIdParamSchema.parse({ sessionId });

  const response = await apiFetchParsed(
    `${CLASS_SESSIONS_BASE}/${parsedSessionId}/checkin-token`,
    sessionCheckinTokenResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Student self check-in via scanned token or 6-digit code. */
export async function studentSessionCheckin(
  sessionId: string,
  input: StudentSessionCheckinInput,
): Promise<SessionCheckinResult> {
  const { sessionId: parsedSessionId } = sessionIdParamSchema.parse({ sessionId });
  const body = studentSessionCheckinSchema.parse(input);

  const response = await apiFetchParsed(
    `${CLASS_SESSIONS_BASE}/${parsedSessionId}/checkin`,
    sessionCheckinResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
