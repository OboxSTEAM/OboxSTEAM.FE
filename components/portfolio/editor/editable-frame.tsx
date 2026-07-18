"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EditableSectionProps = {
  children: ReactNode;
  className?: string;
  /** Dark microsite canvas — dashed borders need higher contrast. */
  isDark?: boolean;
};

/**
 * Section chrome for the portfolio editor (TopCV-style).
 * Always shows a dashed outline; highlights on focus-within / click into children.
 */
export function EditableSection({
  children,
  className,
  isDark = false,
}: EditableSectionProps) {
  return (
    <div
      className={cn(
        "group/editable relative rounded-xl border border-dashed p-3 transition-[border-color,box-shadow,background-color] duration-200 sm:p-4",
        isDark
          ? [
              "border-[#FAFAF5]/22",
              "hover:border-[#FAFAF5]/40",
              "focus-within:border-[#4FC3F7] focus-within:bg-[#4FC3F7]/10",
              "focus-within:shadow-[inset_0_0_0_1px_rgba(79,195,247,0.45)]",
            ]
          : [
              "border-[#C9C9C2]/90",
              "hover:border-[#A8A8A0]",
              "focus-within:border-[#4FC3F7] focus-within:bg-[rgba(79,195,247,0.06)]",
              "focus-within:shadow-[inset_0_0_0_1px_rgba(79,195,247,0.35)]",
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
 * Dashed focus ring around a single inline text / rich-text control.
 */
export function EditableFieldFrame({
  children,
  className,
  isDark = false,
}: EditableFieldFrameProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-transparent transition-[border-color,background-color,box-shadow] duration-150",
        isDark
          ? "hover:border-[#FAFAF5]/25 focus-within:border-[#4FC3F7] focus-within:bg-white/5 focus-within:shadow-[inset_0_0_0_1px_rgba(79,195,247,0.4)]"
          : "hover:border-[#C9C9C2] focus-within:border-[#4FC3F7] focus-within:bg-white/90 focus-within:shadow-[inset_0_0_0_1px_rgba(79,195,247,0.3)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
