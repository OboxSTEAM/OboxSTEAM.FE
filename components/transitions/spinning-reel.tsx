"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readPx(el: Element, name: string, fallback: number): number {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readMs(el: Element, name: string, fallback: number): number {
  return readPx(el, name, fallback);
}

type SpinningReelProps = {
  /** Numeric string (non-digits stripped for columns). */
  value: string;
  className?: string;
  cellClassName?: string;
  /** Full 0–9 loops before landing. Countdown: prefer `1`. */
  spins?: number;
};

/** Slot-machine digit reels (transitions.dev 26). */
export function SpinningReel({
  value,
  className,
  cellClassName,
  spins = 2,
}: SpinningReelProps) {
  const digits = value.replace(/\D/g, "").split("");
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (reduceMotion || digits.length === 0) return;
    const root = rootRef.current;
    if (!root) return;

    const cellPx = readPx(root, "--reel-cell", 30);
    const dur =
      getComputedStyle(root).getPropertyValue("--reel-dur").trim() || "1400ms";
    const ease =
      getComputedStyle(root).getPropertyValue("--reel-ease").trim() ||
      "cubic-bezier(0.16, 1, 0.3, 1)";
    const stagger = readMs(root, "--reel-stagger", 90);
    const digitChars = value.replace(/\D/g, "").split("");

    digitChars.forEach((digitChar, col) => {
      const strip = stripRefs.current[col];
      if (!strip) return;
      const digit = Number(digitChar);
      if (!Number.isFinite(digit)) return;

      const target = (spins * 10 + digit) * cellPx;

      if (!readyRef.current) {
        strip.style.transition = "none";
        strip.style.transform = `translateY(${-digit * cellPx}px)`;
        void strip.offsetWidth;
        return;
      }

      strip.style.transition = "none";
      strip.style.transform = "translateY(0)";
      void strip.offsetWidth;
      strip.style.transition = `transform ${dur} ${ease} ${col * stagger}ms`;
      strip.style.transform = `translateY(${-target}px)`;
    });

    readyRef.current = true;
  }, [reduceMotion, spins, value]);

  if (digits.length === 0) return null;

  if (reduceMotion) {
    return (
      <span
        className={cn("t-reel inline-flex tabular-nums", className)}
        aria-hidden
      >
        {digits.map((d, i) => (
          <span key={`${i}-${d}`} className={cn("t-reel-digit", cellClassName)}>
            {d}
          </span>
        ))}
      </span>
    );
  }

  return (
    <div ref={rootRef} className={cn("t-reel", className)} aria-hidden>
      {digits.map((_, col) => (
        <div key={col} className="t-reel-col">
          <div
            ref={(el) => {
              stripRefs.current[col] = el;
            }}
            className="t-reel-strip"
          >
            {Array.from({ length: spins + 1 }, (_, loop) =>
              DIGITS.map((n) => (
                <span
                  key={`${loop}-${n}`}
                  className={cn("t-reel-digit", cellClassName)}
                >
                  {n}
                </span>
              )),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
