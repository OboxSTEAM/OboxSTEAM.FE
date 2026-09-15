"use client";

import { useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

import { AuthFieldError } from "./auth-shell";
import { useAuthErrorShake } from "./use-auth-error-shake";

const PASSWORD_INPUT_CLASS =
  "auth-password-input h-11 w-full min-w-0 rounded-xl border-0 bg-[#F3F4F6] pr-11 pl-4 text-base text-[#2D2D2D] shadow-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2D2D2D]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/30 md:text-sm";

type PasswordFieldProps = {
  id: string;
  label: string;
  error?: string;
} & Omit<React.ComponentProps<"input">, "type">;

export function PasswordField({
  id,
  label,
  error,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const shakeRef = useRef<HTMLDivElement>(null);
  useAuthErrorShake(shakeRef, error);
  const hasError = Boolean(error);

  return (
    <div className={cn("t-input-wrap space-y-2", hasError && "is-error")}>
      <Label htmlFor={id} className="text-[#2D2D2D]">
        {label}
      </Label>
      <div
        ref={shakeRef}
        className={cn("t-input relative rounded-xl", hasError && "is-error")}
      >
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={hasError}
          className={cn(PASSWORD_INPUT_CLASS, className)}
          {...inputProps}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 z-10 -translate-y-1/2 text-[#6B6B6B] transition-colors hover:text-[#2D2D2D]"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <AuthFieldError message={error} />
    </div>
  );
}
