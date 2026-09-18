"use client";

import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { GraduationCap, Users } from "lucide-react";

import type { RegisterRole } from "@/lib/api/entities/user";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useSlidingTabs } from "@/components/transitions/use-sliding-tabs";

import { AuthFieldError } from "./auth-shell";
import { useAuthErrorShake } from "./use-auth-error-shake";

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
  const shakeRef = useRef<HTMLDivElement>(null);
  useAuthErrorShake(shakeRef, error);
  const hasError = Boolean(error);
  const { tabsRef, pillRef, syncPill } = useSlidingTabs();

  useEffect(() => {
    syncPill(true);
  }, [value, syncPill]);

  return (
    <div className={cn("t-input-wrap space-y-2", hasError && "is-error")}>
      <Label id="register-role-label" className="text-[#2D2D2D]">
        Vai trò
      </Label>

      <div
        ref={shakeRef}
        className={cn("t-input rounded-xl", hasError && "is-error")}
      >
        <div
          ref={tabsRef}
          role="radiogroup"
          aria-labelledby="register-role-label"
          aria-invalid={hasError ? "true" : undefined}
          className={cn(
            "t-tabs w-full items-stretch gap-1 rounded-xl bg-[#F3F4F6] p-1",
            "[--tabs-bar-bg:#F3F4F6] [--tabs-pill-bg:#ffffff]",
            "[--tabs-text-muted:#6B6B6B] [--tabs-text-active:#2D2D2D]",
          )}
          onBlur={onBlur}
        >
          <span
            className="t-tabs-pill rounded-lg shadow-sm"
            ref={pillRef}
            aria-hidden
          />
          {REGISTER_ROLE_OPTIONS.map((option) => {
            const isSelected = value === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected ? "true" : "false"}
                aria-selected={isSelected}
                onClick={() => onChange(option.value)}
                className={cn(
                  "t-tab relative z-10 flex !h-auto min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-center",
                  isSelected ? "text-[#2D2D2D]" : "text-[#6B6B6B]",
                )}
              >
                <Icon className="size-4 stroke-[1.75]" aria-hidden />
                <span className="text-xs font-semibold leading-tight">
                  {option.label}
                </span>
                <span className="text-[0.65rem] leading-snug opacity-80">
                  {option.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AuthFieldError message={error} />
    </div>
  );
}
