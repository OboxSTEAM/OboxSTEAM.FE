"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True when the observed element's content box is narrower than `minWidth`.
 * Use for layouts that should react to sidebar / inset width, not only viewport.
 */
export function useContainerNarrow(
  ref: RefObject<HTMLElement | null>,
  minWidth = 1100,
): boolean {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const update = (width: number) => {
      setIsNarrow(width < minWidth);
    };

    update(el.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      update(entry.contentRect.width);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, minWidth]);

  return isNarrow;
}

/** Live content-box width of an element (0 until measured). */
export function useContainerWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const update = (next: number) => {
      setWidth(next);
    };

    update(el.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      update(entry.contentRect.width);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
