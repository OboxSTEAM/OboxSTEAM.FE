"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EditableSectionProps = {
  children: ReactNode;
  className?: string;
  isDark?: boolean;
};

/**
 * Section chrome — dashed outline, cyan highlight when focused (no glow).
 */
export function EditableSection({
  children,
  className,
  isDark = false,
}: EditableSectionProps) {
  return (
    <div
      className={cn(
        "group/editable relative min-w-0 overflow-hidden rounded-xl border border-dashed p-3 transition-colors duration-150 sm:p-4",
        isDark
          ? [
              "border-[#FAFAF5]/28",
              "hover:border-[#FAFAF5]/45",
              "focus-within:border-[#4FC3F7] focus-within:bg-[rgba(79,195,247,0.08)]",
            ]
          : [
              "border-[#C4C4BC]",
              "hover:border-[#A8A8A0]",
              "focus-within:border-[#4FC3F7] focus-within:bg-[rgba(79,195,247,0.06)]",
            ],
        className,
      )}
    >
      {children}
    </div>
  );
}

type EditableFieldFrameProps = {
  children: ReactNode;
  className?: string;
  isDark?: boolean;
};

/**
 * Field focus frame — visible on hover, strong cyan when active.
 */
export function EditableFieldFrame({
  children,
  className,
  isDark = false,
}: EditableFieldFrameProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed transition-colors duration-150",
        isDark
          ? "border-[#FAFAF5]/20 hover:border-[#FAFAF5]/40 focus-within:border-[#4FC3F7] focus-within:bg-white/8"
          : "border-[#D0D0C8] bg-white/70 hover:border-[#A8A8A0] focus-within:border-[#4FC3F7] focus-within:bg-white",
        className,
      )}
    >
      {children}
    </div>
  );
}
