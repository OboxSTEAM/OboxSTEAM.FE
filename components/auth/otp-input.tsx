"use client";

import { useCallback, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

import { AuthFieldError } from "./auth-shell";

const OTP_LENGTH = 6;

type OtpInputProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
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
  disabled,
  autoFocus,
}: OtpInputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

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
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[#2D2D2D]">
        {label}
      </Label>

      <div
        className={cn(
          "relative rounded-xl outline-none",
          isFocused && "ring-2 ring-[#2D2D2D]/15 ring-offset-2 ring-offset-white",
          error && "ring-2 ring-destructive/25 ring-offset-2",
        )}
        onClick={focusInput}
      >
        <div
          className="flex justify-between gap-2 sm:gap-2.5"
          aria-hidden
        >
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
                  "flex h-12 flex-1 max-w-12 items-center justify-center rounded-xl bg-[#F3F4F6] text-lg font-semibold tabular-nums text-[#2D2D2D] transition-all",
                  isActive && "bg-white ring-2 ring-[#2D2D2D]/25",
                  digit && !isActive && "bg-[#ECECF0]",
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
          aria-invalid={!!error}
          aria-label={label}
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
        />
      </div>

      <AuthFieldError message={error} />
    </div>
  );
}
