import { ApiRequestError, ApiResponseError } from "@/lib/api/errors";
import {
  assignmentWindowConflictSchema,
  type AssignmentWindowConflict,
} from "@/lib/api/entities/assignment-window";
import { quizResultSchema, type QuizResult } from "@/lib/api/entities/quiz";

/** Assignment / attempt machine codes shared by quiz, reflection, file-upload, research, recovery. */
export const ASSIGNMENT_ERROR_CODES = {
  windowMissing: "ASSIGNMENT_WINDOW_MISSING",
  windowNotOpen: "ASSIGNMENT_WINDOW_NOT_OPEN",
  windowClosed: "ASSIGNMENT_WINDOW_CLOSED",
  maxAttempts: "ASSIGNMENT_MAX_ATTEMPTS",
  attemptTimeExpired: "ASSIGNMENT_ATTEMPT_TIME_EXPIRED",
  quizAttemptExpiredGraded: "QUIZ_ATTEMPT_EXPIRED_GRADED",
} as const;

/** Machine `error.code` from a BE envelope (HTTP error body or `isSuccess: false`), if any. */
export function extractApiErrorCode(error: unknown): string | null {
  if (error instanceof ApiResponseError) {
    return error.code?.trim() || null;
  }
  if (error instanceof ApiRequestError) {
    const body = error.body as {
      error?: { code?: string | null };
      value?: { code?: string | null };
      code?: string | null;
    } | null;
    return (
      body?.error?.code?.trim() ||
      body?.value?.code?.trim() ||
      body?.code?.trim() ||
      null
    );
  }
  return null;
}

/** `value.data` from a non-2xx BE envelope, if any. */
export function extractApiErrorData(error: unknown): unknown {
  if (!(error instanceof ApiRequestError)) return null;
  const body = error.body as { value?: { data?: unknown } | null } | null;
  return body?.value?.data ?? null;
}

/**
 * Quiz start found an attempt past its time limit, graded it from saved answers,
 * and returned the result instead of opening a new attempt.
 */
export function getExpiredGradedQuizResult(error: unknown): QuizResult | null {
  if (extractApiErrorCode(error) !== ASSIGNMENT_ERROR_CODES.quizAttemptExpiredGraded) {
    return null;
  }
  const parsed = quizResultSchema.safeParse(extractApiErrorData(error));
  return parsed.success ? parsed.data : null;
}

/** Window times from `ASSIGNMENT_WINDOW_NOT_OPEN` / `ASSIGNMENT_WINDOW_CLOSED`. */
export function getAssignmentWindowConflict(
  error: unknown,
): AssignmentWindowConflict | null {
  const code = extractApiErrorCode(error);
  if (
    code !== ASSIGNMENT_ERROR_CODES.windowNotOpen &&
    code !== ASSIGNMENT_ERROR_CODES.windowClosed
  ) {
    return null;
  }
  const parsed = assignmentWindowConflictSchema.safeParse(extractApiErrorData(error));
  return parsed.success ? parsed.data : null;
}
