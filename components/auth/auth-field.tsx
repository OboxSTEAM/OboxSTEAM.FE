"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AuthFieldError } from "./auth-shell";
import { useAuthErrorShake } from "./use-auth-error-shake";

type AuthFieldProps = {
  id: string;
  label: string;
  error?: string;
  className?: string;
} & React.ComponentProps<typeof Input>;

export function AuthField({
  id,
  label,
  error,
  className,
  ...inputProps
}: AuthFieldProps) {
  const shakeRef = useRef<HTMLDivElement>(null);
  useAuthErrorShake(shakeRef, error);
  const hasError = Boolean(error);

  return (
    <div className={cn("t-input-wrap w-full min-w-0 space-y-2", hasError && "is-error")}>
      <Label htmlFor={id} className="text-[#2D2D2D]">
        {label}
      </Label>
      <div
        ref={shakeRef}
        className={cn("t-input rounded-xl", hasError && "is-error")}
      >
        <Input
          id={id}
          aria-invalid={hasError}
          className={cn(
            "h-11 w-full min-w-0 rounded-xl border-0 bg-[#F3F4F6] px-4 text-[#2D2D2D] shadow-none focus-visible:ring-2 focus-visible:ring-[#2D2D2D]/20",
            className,
          )}
          {...inputProps}
        />
      </div>
      <AuthFieldError message={error} />
    </div>
  );
}
