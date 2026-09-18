"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

function applyPillGeometry(pill: HTMLElement, tab: HTMLElement) {
  pill.style.transform = `translateX(${tab.offsetLeft}px)`;
  pill.style.width = `${tab.offsetWidth}px`;
  pill.style.height = `${tab.offsetHeight}px`;
  pill.style.top = `${tab.offsetTop}px`;
}

/**
 * Sliding pill for `.t-tabs` — measures the active tab and writes
 * transform/width/height/top onto `.t-tabs-pill`. First sync (and resize)
 * snaps with no transition. Height/top matter for multi-line tabs
 * (e.g. register role picker) where the CSS default 30px pill would float
 * at the top of a taller bar.
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
      applyPillGeometry(pill, tab);
      void pill.offsetWidth;
      pill.style.transition = prev;
      hasSyncedRef.current = true;
      return;
    }

    applyPillGeometry(pill, tab);
  }, []);

  useEffect(() => {
    syncPill(false);
    const onResize = () => syncPill(false);
    window.addEventListener("resize", onResize);

    const bar = tabsRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && bar
        ? new ResizeObserver(() => syncPill(false))
        : null;
    if (bar && resizeObserver) resizeObserver.observe(bar);

    return () => {
      window.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
    };
  }, [syncPill]);

  return { tabsRef, pillRef, syncPill };
}
