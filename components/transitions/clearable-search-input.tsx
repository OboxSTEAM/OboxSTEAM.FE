"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ClearableSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  clearAriaLabel?: string;
};

function readClearOutMs(el: Element): number {
  const raw = getComputedStyle(el).getPropertyValue("--clear-out-dur").trim();
  const ms = parseFloat(raw);
  return Number.isFinite(ms) ? ms : 400;
}

/**
 * Search input with transitions.dev input-clear dissolve (pragmatic CSS mirror + placeholder).
 */
export function ClearableSearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className,
  clearAriaLabel = "Xóa tìm kiếm",
}: ClearableSearchInputProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isClearing, setIsClearing] = useState(false);
  const hasValue = value.length > 0;
  const showClear = hasValue || isClearing;

  function handleClear() {
    if (!hasValue || isClearing) return;
    const wrap = wrapRef.current;
    const duration = wrap ? readClearOutMs(wrap) : 400;
    setIsClearing(true);
    window.setTimeout(() => {
      onChange("");
      setIsClearing(false);
    }, duration);
  }

  return (
    <div
      ref={wrapRef}
      className={cn(
        "t-clear relative w-full",
        hasValue && "has-value",
        isClearing && "is-clearing",
      )}
    >
      <Input
        type="text"
        value={value}
        onChange={(e) => {
          if (isClearing) return;
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={cn(
          "h-9 rounded-lg border-border bg-background/50 pr-8 pl-9 text-sm text-foreground focus-visible:ring-ring",
          className,
        )}
      />
      <div className="t-clear-mirror pl-9 pr-8 text-sm" aria-hidden>
        {value.replace(/ /g, "\u00a0")}
      </div>
      <div className="t-clear-placeholder pl-9 pr-8 text-sm" aria-hidden>
        {placeholder}
      </div>
      {showClear ? (
        <button
          type="button"
          className="t-clear-btn absolute top-2.5 right-2.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:outline-none"
          aria-label={clearAriaLabel}
          onClick={handleClear}
          disabled={isClearing}
        >
          <X className="size-4 text-muted-foreground" />
        </button>
      ) : null}
    </div>
  );
}
