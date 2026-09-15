"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Animated success check (transitions.dev 10). Sets data-state=in on mount. */
export function SuccessCheckIcon({
  className,
  size = 48,
}: {
  className?: string;
  size?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute("data-state", "out");
    void el.offsetWidth;
    el.setAttribute("data-state", "in");
    const path = el.querySelector("path");
    if (path) {
      const len = Math.ceil(path.getTotalLength()) + 1;
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
    }
  }, []);
  return (
    <span
      ref={ref}
      className={cn("t-success-check", className)}
      data-state="out"
      aria-hidden
    >
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" opacity="0.25" />
        <path
          d="M14 24.5L21 31.5L34 16.5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
