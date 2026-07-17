"use client";

import { useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Transparent inline-edit fields for the portfolio document canvas.
 * They inherit the surrounding typography so the document stays WYSIWYG.
 */

type InlineFieldTone = "light" | "dark";

function toneClasses(tone: InlineFieldTone): string {
  return tone === "dark"
    ? "placeholder:text-white/45 hover:bg-white/10 focus:bg-white/15 focus:ring-2 focus:ring-white/50"
    : "placeholder:text-[#A8A8A0] hover:bg-[#2D2D2D]/5 focus:bg-white focus:ring-2 focus:ring-[#4FC3F7]/60";
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
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className={cn(
        "-mx-1 w-full min-w-0 rounded-lg bg-transparent px-1 text-inherit outline-none transition-colors [font:inherit]",
        toneClasses(tone),
        disabled && "pointer-events-none",
        className,
      )}
    />
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
        "-mx-1 block w-full min-w-0 resize-none overflow-hidden rounded-lg bg-transparent px-1 text-inherit outline-none transition-colors [font:inherit]",
        toneClasses(tone),
        disabled && "pointer-events-none",
        className,
      )}
    />
  );
}
