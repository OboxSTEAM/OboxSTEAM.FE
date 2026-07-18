"use client";

import { useLayoutEffect, useRef } from "react";

import { EditableFieldFrame } from "@/components/portfolio/editor/editable-frame";
import { cn } from "@/lib/utils";

/**
 * Transparent inline-edit fields for the portfolio document canvas.
 * They inherit the surrounding typography so the document stays WYSIWYG.
 * Dashed focus frame (TopCV-style) marks the active text control.
 */

type InlineFieldTone = "light" | "dark";

function toneClasses(tone: InlineFieldTone): string {
  return tone === "dark"
    ? "placeholder:text-white/45 hover:bg-white/10 focus:bg-white/10"
    : "placeholder:text-[#A8A8A0] hover:bg-[rgba(45,45,45,0.03)] focus:bg-transparent";
}

type InlineTextProps = {
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  placeholder?: string;
  tone?: InlineFieldTone;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
};

export function InlineText({
  value,
  onChange,
  ariaLabel,
  placeholder,
  tone = "light",
  disabled = false,
  maxLength,
  className,
}: InlineTextProps) {
  return (
    <EditableFieldFrame isDark={tone === "dark"} className={className}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={cn(
          "w-full min-w-0 rounded-md bg-transparent px-1.5 py-0.5 text-inherit outline-none transition-colors [font:inherit]",
          toneClasses(tone),
          disabled && "pointer-events-none",
        )}
      />
    </EditableFieldFrame>
  );
}

type InlineTextareaProps = InlineTextProps;

export function InlineTextarea({
  value,
  onChange,
  ariaLabel,
  placeholder,
  tone = "light",
  disabled = false,
  maxLength,
  className,
}: InlineTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <EditableFieldFrame isDark={tone === "dark"} className={className}>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={cn(
          "block w-full min-w-0 resize-none overflow-hidden rounded-md bg-transparent px-1.5 py-0.5 text-inherit outline-none transition-colors [font:inherit]",
          toneClasses(tone),
          disabled && "pointer-events-none",
        )}
      />
    </EditableFieldFrame>
  );
}
