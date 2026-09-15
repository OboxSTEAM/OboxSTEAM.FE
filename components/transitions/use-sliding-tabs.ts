"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * Sliding pill for `.t-tabs` — measures the active tab and writes
 * transform/width onto `.t-tabs-pill`. First sync (and resize) snaps
 * with no transition.
 */
export function useSlidingTabs(): {
  tabsRef: RefObject<HTMLDivElement | null>;
  pillRef: RefObject<HTMLSpanElement | null>;
  syncPill: (animate?: boolean) => void;
} {
  const tabsRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const hasSyncedRef = useRef(false);

  const syncPill = useCallback((animate = true) => {
    const bar = tabsRef.current;
    const pill = pillRef.current;
    if (!bar || !pill) return;

    const tab =
      (bar.querySelector('[aria-selected="true"]') as HTMLElement | null) ??
      (bar.querySelector(".t-tab") as HTMLElement | null);
    if (!tab) return;

    const shouldAnimate = animate && hasSyncedRef.current;
    if (!shouldAnimate) {
      const prev = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      void pill.offsetWidth;
      pill.style.transition = prev;
      hasSyncedRef.current = true;
      return;
    }

    pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    pill.style.width = `${tab.offsetWidth}px`;
  }, []);

  useEffect(() => {
    syncPill(false);
    const onResize = () => syncPill(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncPill]);

  return { tabsRef, pillRef, syncPill };
}
