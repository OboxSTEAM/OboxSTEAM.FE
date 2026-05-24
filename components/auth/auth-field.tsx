"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AuthFieldError } from "./auth-shell";

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
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[#2D2D2D]">
        {label}
      </Label>
      <Input
        id={id}
        aria-invalid={!!error}
        className={cn(
          "h-11 rounded-xl border-0 bg-[#F3F4F6] px-4 text-[#2D2D2D] shadow-none focus-visible:ring-2 focus-visible:ring-[#2D2D2D]/20",
          className,
        )}
        {...inputProps}
      />
      <AuthFieldError message={error} />
    </div>
  );
}
