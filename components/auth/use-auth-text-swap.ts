"use client";

import { useEffect, useRef, type RefObject } from "react";

function readMs(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

/** Three-phase text swap on a `.t-text-swap` element when `next` changes. */
export function useAuthTextSwap(
  elRef: RefObject<HTMLElement | null>,
  next: string,
) {
  const readyRef = useRef(false);
  const currentRef = useRef(next);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    if (!readyRef.current) {
      readyRef.current = true;
      currentRef.current = next;
      el.textContent = next;
      return;
    }

    if (currentRef.current === next) return;

    const dur = readMs("--text-swap-dur", 150);
    el.classList.add("is-exit");

    const timer = window.setTimeout(() => {
      el.textContent = next;
      currentRef.current = next;
      el.classList.remove("is-exit");
      el.classList.add("is-enter-start");
      void el.offsetHeight;
      el.classList.remove("is-enter-start");
    }, dur);

    return () => {
      window.clearTimeout(timer);
      el.classList.remove("is-exit", "is-enter-start");
    };
  }, [elRef, next]);
}
