import { resolveAppError } from "@/lib/errors/resolve-app-error";
import type { AppErrorContext, AppErrorState } from "@/lib/errors/types";

export function resolveAuthError(
  error: unknown,
  context: AppErrorContext,
): AppErrorState {
  return resolveAppError(error, context);
}

/** @deprecated Use `resolveAuthError` or `showAppErrorFromUnknown` instead. */
export function getAuthErrorMessage(error: unknown): string {
  const state = resolveAppError(error, "generic");
  return `${state.reason} ${state.action}`;
}
