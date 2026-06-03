import { ApiRequestError, ApiResponseError } from "@/lib/api/errors";

/** Heuristic: magic-login failed because parent already has a full account. */
export function isExistingParentAccountError(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    if (error.status === 409) return true;
    const body = error.body as {
      error?: { message?: string };
      value?: { message?: string };
      message?: string;
    } | null;
    const msg = (
      body?.error?.message ??
      body?.value?.message ??
      body?.message ??
      ""
    ).toLowerCase();
    return (
      msg.includes("already") ||
      msg.includes("exists") ||
      msg.includes("đã có") ||
      msg.includes("đã tồn tại")
    );
  }

  if (error instanceof ApiResponseError) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("already") ||
      msg.includes("exists") ||
      msg.includes("đã có") ||
      msg.includes("đã tồn tại")
    );
  }

  return false;
}
