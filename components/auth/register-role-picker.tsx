"use client";

import type { LucideIcon } from "lucide-react";
import { GraduationCap, Presentation, Users } from "lucide-react";

import type { RegisterRole } from "@/lib/api/entities/user";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

import { AuthFieldError } from "./auth-shell";

const REGISTER_ROLE_OPTIONS: {
  value: RegisterRole;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  {
    value: "Student",
    label: "Học sinh",
    hint: "Học tập & portfolio",
    icon: GraduationCap,
  },
  {
    value: "Parent",
    label: "Phụ huynh",
    hint: "Theo dõi tiến độ",
    icon: Users,
  },
  {
    value: "Mentor",
    label: "Mentor",
    hint: "Giảng dạy STEAM",
    icon: Presentation,
  },
];

type RegisterRolePickerProps = {
  value: RegisterRole;
  onChange: (role: RegisterRole) => void;
  onBlur?: () => void;
  error?: string;
};

export function RegisterRolePicker({
  value,
  onChange,
  onBlur,
  error,
}: RegisterRolePickerProps) {
  return (
    <div className="space-y-2">
      <Label id="register-role-label" className="text-[#2D2D2D]">
        Vai trò
      </Label>

      <div
        role="radiogroup"
        aria-labelledby="register-role-label"
        aria-invalid={error ? "true" : undefined}
        className="grid grid-cols-3 gap-2"
        onBlur={onBlur}
      >
        {REGISTER_ROLE_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected ? "true" : "false"}
              onClick={() => onChange(option.value)}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-3 text-center transition-[background-color,border-color,box-shadow,transform] duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D2D2D]/25 focus-visible:ring-offset-2",
                "motion-safe:active:scale-[0.98]",
                isSelected
                  ? "border-[#2D2D2D]/20 bg-white shadow-sm"
                  : "border-transparent bg-[#F3F4F6] hover:border-[#2D2D2D]/10 hover:bg-[#ECEEF2]",
                error && !isSelected && "border-destructive/20",
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg transition-colors duration-200",
                  isSelected
                    ? "bg-[#2D2D2D] text-white"
                    : "bg-white/80 text-[#6B6B6B] group-hover:text-[#2D2D2D]",
                )}
              >
                <Icon className="size-[1.125rem] stroke-[1.75]" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    isSelected ? "text-[#2D2D2D]" : "text-[#4A4A4A]",
                  )}
                >
                  {option.label}
                </span>
                <span className="text-[0.65rem] leading-snug text-[#8A8A8A]">
                  {option.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <AuthFieldError message={error} />
    </div>
  );
}
