import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { mediaAssetSchema } from "@/lib/api/entities/media";
import {
  sessionAttendanceSchema,
  sessionAttendanceStatusSchema,
} from "@/lib/api/entities/session-attendance";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";
import {
  sessionEvidenceMediaParamSchema,
  sessionIdParamSchema,
  studentSessionCheckinSchema,
  uploadSessionEvidenceSchema,
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

export const liveSessionJoinSchema = z.object({
  classSessionId: z.string().uuid(),
  jwt: z.string().nullable(),
  roomName: z.string().nullable(),
  appId: z.string().nullable(),
  domain: z.string().nullable(),
  isModerator: z.boolean(),
  attendanceStatus: sessionAttendanceStatusSchema.nullable(),
});

export const liveSessionJoinValueSchema = createApiValueSchema(liveSessionJoinSchema);
export const liveSessionJoinResponseSchema = createApiResponseSchema(
  liveSessionJoinValueSchema,
);

export const liveSessionLeaveSchema = z.object({
  classSessionId: z.string().uuid(),
  attendanceId: z.string().uuid().nullable(),
  checkedInAt: z.string().nullable(),
  leftAt: z.string().nullable(),
  participationMinutes: z.number().int().nullable(),
});

export const liveSessionLeaveValueSchema = createApiValueSchema(liveSessionLeaveSchema);
export const liveSessionLeaveResponseSchema = createApiResponseSchema(
  liveSessionLeaveValueSchema,
);

export const sessionEvidenceListValueSchema = createApiValueSchema(
  z
    .array(mediaAssetSchema)
    .nullish()
    .transform((value) => value ?? []),
);

export const sessionEvidenceListResponseSchema = createApiResponseSchema(
  sessionEvidenceListValueSchema,
);

export const sessionEvidenceUploadValueSchema = createApiValueSchema(mediaAssetSchema);
export const sessionEvidenceUploadResponseSchema = createApiResponseSchema(
  sessionEvidenceUploadValueSchema,
);

export const sessionEvidenceDeleteValueSchema = createApiValueSchema(
  z.boolean().nullish(),
);
export const sessionEvidenceDeleteResponseSchema = createApiResponseSchema(
  sessionEvidenceDeleteValueSchema,
);

export type SessionCheckinToken = z.infer<typeof sessionCheckinTokenSchema>;
export type SessionCheckinTokenResponse = z.infer<
  typeof sessionCheckinTokenResponseSchema
>;
export type SessionCheckinTokenResult = SessionCheckinTokenResponse["value"];
export type SessionCheckinResponse = z.infer<typeof sessionCheckinResponseSchema>;
export type SessionCheckinResult = SessionCheckinResponse["value"];

export type LiveSessionJoin = z.infer<typeof liveSessionJoinSchema>;
export type LiveSessionJoinResponse = z.infer<typeof liveSessionJoinResponseSchema>;
export type LiveSessionJoinResult = LiveSessionJoinResponse["value"];

export type LiveSessionLeave = z.infer<typeof liveSessionLeaveSchema>;
export type LiveSessionLeaveResponse = z.infer<typeof liveSessionLeaveResponseSchema>;
export type LiveSessionLeaveResult = LiveSessionLeaveResponse["value"];

export type SessionEvidenceListResponse = z.infer<
  typeof sessionEvidenceListResponseSchema
>;
export type SessionEvidenceListResult = SessionEvidenceListResponse["value"];

export type SessionEvidenceUploadResponse = z.infer<
  typeof sessionEvidenceUploadResponseSchema
>;
export type SessionEvidenceUploadResult = SessionEvidenceUploadResponse["value"];

export type SessionEvidenceDeleteResponse = z.infer<
  typeof sessionEvidenceDeleteResponseSchema
>;
export type SessionEvidenceDeleteResult = SessionEvidenceDeleteResponse["value"];

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

/**
 * Join a LiveOnline session — records attendance and returns JaaS credentials.
 * Mentors receive `isModerator: true`.
 */
export async function joinLiveSession(
  sessionId: string,
): Promise<LiveSessionJoinResult> {
  const { sessionId: parsedSessionId } = sessionIdParamSchema.parse({ sessionId });

  const response = await apiFetchParsed(
    `${CLASS_SESSIONS_BASE}/${parsedSessionId}/join`,
    liveSessionJoinResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Leave a LiveOnline session — sets LeftAt and ParticipationMinutes for students. */
export async function leaveLiveSession(
  sessionId: string,
): Promise<LiveSessionLeaveResult> {
  const { sessionId: parsedSessionId } = sessionIdParamSchema.parse({ sessionId });

  const response = await apiFetchParsed(
    `${CLASS_SESSIONS_BASE}/${parsedSessionId}/leave`,
    liveSessionLeaveResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** List Offline field evidence photos for a class session. */
export async function listSessionEvidence(
  sessionId: string,
): Promise<SessionEvidenceListResult> {
  const { sessionId: parsedSessionId } = sessionIdParamSchema.parse({ sessionId });

  const response = await apiFetchParsed(
    `${CLASS_SESSIONS_BASE}/${parsedSessionId}/evidence`,
    sessionEvidenceListResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Upload an Offline field evidence photo (.jpg/.jpeg/.png). */
export async function uploadSessionEvidence(
  sessionId: string,
  file: File,
): Promise<SessionEvidenceUploadResult> {
  const { sessionId: parsedSessionId } = sessionIdParamSchema.parse({ sessionId });
  const { file: parsedFile } = uploadSessionEvidenceSchema.parse({ file });

  const formData = new FormData();
  formData.append("file", parsedFile);

  const response = await apiFetchParsed(
    `${CLASS_SESSIONS_BASE}/${parsedSessionId}/evidence`,
    sessionEvidenceUploadResponseSchema,
    { method: "POST", body: formData },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Soft-delete session evidence and remove the stored object. */
export async function deleteSessionEvidence(
  sessionId: string,
  mediaId: string,
): Promise<SessionEvidenceDeleteResult> {
  const { sessionId: parsedSessionId, mediaId: parsedMediaId } =
    sessionEvidenceMediaParamSchema.parse({ sessionId, mediaId });

  const response = await apiFetchParsed(
    `${CLASS_SESSIONS_BASE}/${parsedSessionId}/evidence/${parsedMediaId}`,
    sessionEvidenceDeleteResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
