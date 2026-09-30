import { ApiRequestError, ApiResponseError } from "@/lib/api/errors";

const SEAT_HOLD_CHECKOUT_PATTERN =
  /select this class before checkout|seat hold has expired|class seat hold has expired/i;

const CLASS_SEAT_UNAVAILABLE_PATTERN =
  /maximum capacity|two-thirds of an assignment work window/i;

function getErrorMessage(error: unknown): string | null {
  if (error instanceof ApiResponseError) {
    return error.message?.trim() || null;
  }
  if (error instanceof ApiRequestError) {
    const body = error.body;
    if (body && typeof body === "object" && "error" in body) {
      const apiError = (body as { error?: { message?: string } }).error;
      return apiError?.message?.trim() || null;
    }
  }
  if (error instanceof Error) {
    return error.message.trim() || null;
  }
  return null;
}

/** Checkout/parent-pay rejected because hold is missing or expired. */
export function isSeatHoldCheckoutError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message != null && SEAT_HOLD_CHECKOUT_PATTERN.test(message);
}

/** select-class rejected because the class is full (409) or past the join cutoff — refresh the class list. */
export function isClassSeatUnavailableError(error: unknown): boolean {
  if (error instanceof ApiRequestError && error.status === 409) return true;
  const message = getErrorMessage(error);
  return message != null && CLASS_SEAT_UNAVAILABLE_PATTERN.test(message);
}
