"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AuthFieldError } from "./auth-shell";

type PasswordFieldProps = {
  id: string;
  label: string;
  error?: string;
} & Omit<React.ComponentProps<typeof Input>, "type">;

export function PasswordField({
  id,
  label,
  error,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[#2D2D2D]">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          className={cn(
            "h-11 rounded-xl border-0 bg-[#F3F4F6] pr-11 pl-4 text-[#2D2D2D] shadow-none focus-visible:ring-2 focus-visible:ring-[#2D2D2D]/20",
            className,
          )}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-[#6B6B6B] transition-colors hover:text-[#2D2D2D]"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <AuthFieldError message={error} />
    </div>
  );
}
