"use client";

import { toast } from "sonner";

import { AppErrorToast } from "@/components/errors/app-error-toast";
import { AppSuccessToast } from "@/components/errors/app-success-toast";

import { resolveAppError } from "./resolve-app-error";
import type { AppErrorContext, AppErrorState, AppSuccessState } from "./types";

const ERROR_TOAST_ID = "app-error";
const SUCCESS_TOAST_ID = "app-success";

export function showAppError(state: AppErrorState): void {
  toast.custom(() => <AppErrorToast {...state} />, {
    id: ERROR_TOAST_ID,
    duration: 7000,
    unstyled: true,
    classNames: {
      toast: "p-0 bg-transparent border-0 shadow-none",
    },
  });
}

export function showAppErrorFromUnknown(
  error: unknown,
  context: AppErrorContext = "generic",
): void {
  showAppError(resolveAppError(error, context));
}

export function showAppSuccess(
  state: AppSuccessState,
  options?: { id?: string; duration?: number },
): void {
  toast.custom(() => <AppSuccessToast {...state} />, {
    id: options?.id ?? SUCCESS_TOAST_ID,
    duration: options?.duration ?? 5000,
    unstyled: true,
    classNames: {
      toast: "p-0 bg-transparent border-0 shadow-none",
    },
  });
}
