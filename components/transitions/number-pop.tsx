"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type NumberPopProps = {
  value: string | number;
  className?: string;
};

/**
 * Digit pop-in on value change (transitions.dev 02).
 * Last two characters stagger via data-stagger.
 */
export function NumberPop({ value, className }: NumberPopProps) {
  const text = String(value);
  const groupRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(text);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (prevRef.current === text) return;
    prevRef.current = text;
    setIsAnimating(false);
    const el = groupRef.current;
    if (el) void el.offsetWidth;
    const raf = requestAnimationFrame(() => setIsAnimating(true));
    return () => cancelAnimationFrame(raf);
  }, [text]);

  const chars = Array.from(text);
  const staggerFrom = Math.max(0, chars.length - 2);

  return (
    <span
      ref={groupRef}
      className={cn(
        "t-digit-group",
        isAnimating && "is-animating",
        className,
      )}
    >
      {chars.map((ch, index) => {
        const stagger =
          index >= staggerFrom ? String(index - staggerFrom + 1) : undefined;
        return (
          <span
            key={`${text}-${index}-${ch}`}
            className="t-digit"
            {...(stagger ? { "data-stagger": stagger } : {})}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}
