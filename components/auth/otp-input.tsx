"use client";

import { useCallback, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

import { AuthFieldError } from "./auth-shell";
import { useAuthErrorShake } from "./use-auth-error-shake";

const OTP_LENGTH = 6;

type OtpInputProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  /** Bump to re-shake when the same error message is set again (e.g. API retry). */
  shakeKey?: number;
  disabled?: boolean;
  autoFocus?: boolean;
};

function sanitizeOtp(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function OtpInput({
  id: idProp,
  label = "Mã OTP",
  value,
  onChange,
  onBlur,
  error,
  shakeKey = 0,
  disabled,
  autoFocus,
}: OtpInputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const shakeRef = useRef<HTMLDivElement>(null);
  useAuthErrorShake(shakeRef, error, shakeKey);
  const hasError = Boolean(error);

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  const updateValue = useCallback(
    (next: string) => {
      onChange(sanitizeOtp(next));
    },
    [onChange],
  );

  const focusInput = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateValue(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const hasSelection = end > start;
    const isFullSelection = hasSelection && start === 0 && end === value.length;

    if (
      (event.key === "Backspace" || event.key === "Delete") &&
      isFullSelection
    ) {
      updateValue("");
      event.preventDefault();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    updateValue(event.clipboardData.getData("text"));
  };

  return (
    <div className={cn("t-input-wrap space-y-2", hasError && "is-error")}>
      <Label htmlFor={id} className="text-[#2D2D2D]">
        {label}
      </Label>

      <div
        ref={shakeRef}
        className={cn(
          "t-input t-input--otp relative rounded-xl outline-none",
          hasError && "is-error",
        )}
        onClick={focusInput}
      >
        <div className="flex justify-between gap-2 sm:gap-2.5" aria-hidden>
          {digits.map((digit, index) => {
            const isActive =
              isFocused &&
              (value.length === OTP_LENGTH
                ? index === OTP_LENGTH - 1
                : index === activeIndex);

            return (
              <div
                key={index}
                className={cn(
                  "flex h-12 flex-1 max-w-12 items-center justify-center rounded-xl bg-[#F3F4F6] text-lg font-semibold tabular-nums text-[#2D2D2D] transition-[background-color,box-shadow] duration-150",
                  isActive &&
                    !hasError &&
                    "bg-white ring-2 ring-[#2D2D2D]/25",
                  digit && !isActive && !hasError && "bg-[#ECECF0]",
                  hasError &&
                    "bg-[#F3F4F6] ring-2 ring-destructive/35 ring-offset-0",
                )}
              >
                {digit}
              </div>
            );
          })}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          maxLength={OTP_LENGTH}
          aria-invalid={hasError}
          aria-label={label}
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0 outline-none border-0 shadow-none ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0"
        />
      </div>

      <AuthFieldError message={error} />
    </div>
  );
}
