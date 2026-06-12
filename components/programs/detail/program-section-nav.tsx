"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  PROGRAM_DETAIL_SECTIONS,
  type ProgramDetailSectionId,
} from "@/lib/programs/detail-sections";
import { cn } from "@/lib/utils";

type ProgramSectionNavProps = {
  className?: string;
};

function useReducedMotion() {
  const [reduce, setReduce] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event: MediaQueryListEvent) => setReduce(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduce;
}

export function ProgramSectionNav({ className }: ProgramSectionNavProps) {
  const [activeId, setActiveId] =
    useState<ProgramDetailSectionId>("about");
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const sectionElements = PROGRAM_DETAIL_SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((element): element is HTMLElement => element != null);

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const topmost = visible[0];
        if (topmost?.target.id) {
          setActiveId(topmost.target.id as ProgramDetailSectionId);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.15, 0.35, 0.55],
      },
    );

    for (const element of sectionElements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback(
    (id: ProgramDetailSectionId) => {
      const element = document.getElementById(id);
      if (!element) return;

      setActiveId(id);
      isScrollingRef.current = true;

      if (scrollTimeoutRef.current != null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      element.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });

      scrollTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, reduceMotion ? 50 : 700);
    },
    [reduceMotion],
  );

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current != null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav
      aria-label="Mục nội dung chương trình"
      className={cn(
        "sticky top-[4.5rem] z-20 -mx-4 border-b border-[#E5E5E0] bg-[#FAFAF5]/95 px-4 backdrop-blur-sm sm:-mx-6 sm:top-20 sm:px-6",
        className,
      )}
    >
      <div className="flex gap-1 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PROGRAM_DETAIL_SECTIONS.map((section) => {
          const isActive = activeId === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-[#2D2D2D] shadow-sm ring-1 ring-[#E5E5E0]"
                  : "text-[#6B6B6B] hover:bg-white/70 hover:text-[#2D2D2D]",
              )}
            >
              <span
                className={cn(
                  "relative inline-block pb-0.5",
                  isActive &&
                    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[#E94B3C]",
                )}
              >
                {section.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
