"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  PenLine,
  ScanFace,
  Video,
  type LucideProps,
} from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { buttonVariants } from "@/components/ui/button";
import { UNIVERSE_SECTION } from "@/lib/landing/content";
import { cn } from "@/lib/utils";

type LucideIcon = React.ComponentType<LucideProps>;

const FEATURE_ICONS: Record<string, LucideIcon> = {
  ScanFace,
  Video,
  PenLine,
  Globe,
};

/** Soft pill fill tints — progress sweeps left → right over base beige. */
const FEATURE_TAB_FILLS: Record<string, { base: string; fill: string }> = {
  ScanFace: { base: "#F3EEEA", fill: "#E8D8D5" },
  Video: { base: "#F3EEEA", fill: "#DCE8D4" },
  PenLine: { base: "#F3EEEA", fill: "#DFDBED" },
  Globe: { base: "#F3EEEA", fill: "#D4E8F2" },
};

const TAB_DURATION_MS = 5500;

function useReducedMotion() {
  const [reduce, setReduce] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduce;
}

function useAutoTabs(count: number, reduceMotion: boolean) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());

  const selectTab = useCallback((index: number) => {
    setActiveIndex(index);
    setProgress(0);
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setProgress(1);
      return;
    }

    startRef.current = Date.now();
    setProgress(0);

    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const nextProgress = Math.min(elapsed / TAB_DURATION_MS, 1);
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        setActiveIndex((current) => (current + 1) % count);
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeIndex, count, reduceMotion]);

  return { activeIndex, progress, selectTab };
}

function GridBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundColor: "#FAFAF5",
        backgroundImage: `
          linear-gradient(#E6E6E0 1px, transparent 1px),
          linear-gradient(90deg, #E6E6E0 1px, transparent 1px)
        `,
        backgroundSize: "28px 28px",
      }}
    />
  );
}

function UniverseFeatureTab({
  feature,
  isActive,
  progress,
  onSelect,
}: {
  feature: (typeof UNIVERSE_SECTION.features)[number];
  isActive: boolean;
  progress: number;
  onSelect: () => void;
}) {
  const Icon = FEATURE_ICONS[feature.iconName];
  const tabColors = FEATURE_TAB_FILLS[feature.iconName] ?? FEATURE_TAB_FILLS.ScanFace;
  const tabId = `universe-tab-${feature.id}`;
  const panelId = `universe-panel-${feature.id}`;

  return (
    <button
      type="button"
      id={tabId}
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      onClick={onSelect}
      className={cn(
        "relative min-w-[11.5rem] shrink-0 overflow-hidden rounded-full text-left transition-shadow duration-300 sm:min-w-0 sm:flex-1",
        isActive && "shadow-[0_2px_12px_rgba(45,45,45,0.06)]",
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundColor: tabColors.base }}
      />

      {isActive ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: tabColors.fill,
          }}
        />
      ) : null}

      <span className="relative flex items-center gap-2.5 px-4 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
        {Icon ? (
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/80 sm:size-9 sm:rounded-xl"
            style={{ color: feature.accent }}
          >
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
          </span>
        ) : null}

        <span
          className={cn(
            "min-w-0 truncate font-heading text-sm font-semibold leading-tight sm:text-[0.9375rem]",
            isActive ? "text-[#2D2D2D]" : "text-[#6B6B6B]",
          )}
        >
          {feature.label}
        </span>
      </span>
    </button>
  );
}

function UniverseFeatureStage({
  feature,
  isActive,
}: {
  feature: (typeof UNIVERSE_SECTION.features)[number];
  isActive: boolean;
}) {
  return (
    <div
      id={`universe-panel-${feature.id}`}
      role="tabpanel"
      aria-labelledby={`universe-tab-${feature.id}`}
      aria-hidden={!isActive}
      className={cn(
        "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out",
        isActive
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
    >
      <div
        className="relative w-full max-w-6xl px-2 sm:px-4"
        style={{ perspective: "1600px" }}
      >
        <div
          className="relative origin-center overflow-hidden rounded-2xl bg-white shadow-[0_32px_80px_rgba(45,45,45,0.16)] sm:rounded-[1.75rem]"
          style={{
            transform: "rotateY(-14deg) rotateX(5deg) translateZ(0)",
          }}
        >
          <div className="relative aspect-[16/10] w-full sm:aspect-[16/9] lg:aspect-[16/9] lg:max-h-[520px]">
            <Image
              src={feature.imageSrc}
              alt={feature.label}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px"
              className="object-cover object-top"
              priority={feature.id === "face-detection"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function UniverseSection() {
  const reduceMotion = useReducedMotion();
  const { activeIndex, progress, selectTab } = useAutoTabs(
    UNIVERSE_SECTION.features.length,
    reduceMotion,
  );

  return (
    <section
      id="portfolio"
      className="relative overflow-hidden bg-[#FAFAF5]"
      aria-labelledby="universe-heading"
    >
      <GridBackground />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <AnimatedContent distance={30} duration={0.6}>
          <div className="mb-10 max-w-3xl lg:mb-14">
            <EyebrowChip className="mb-5 w-fit">{UNIVERSE_SECTION.eyebrow}</EyebrowChip>

            <h2
              id="universe-heading"
              className="font-heading text-balance font-extrabold tracking-tight text-[#2D2D2D]"
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                lineHeight: 1.05,
              }}
            >
              {UNIVERSE_SECTION.headline}
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#6B6B6B] sm:text-lg">
              {UNIVERSE_SECTION.subheadline}
            </p>

            <div className="mt-6">
              <Link
                href={UNIVERSE_SECTION.ctaHref}
                className={
                  buttonVariants({ size: "lg" }) +
                  " min-h-[48px] rounded-full bg-[#2D2D2D] px-7 font-semibold text-white transition-all duration-150 hover:bg-[#1a1a1a]"
                }
              >
                {UNIVERSE_SECTION.ctaLabel}
              </Link>
            </div>
          </div>
        </AnimatedContent>

        <AnimatedContent distance={24} duration={0.65} delay={0.08}>
          <div role="tablist" aria-label="Tính năng AI Portfolio">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:gap-2.5 sm:overflow-visible sm:px-0">
              {UNIVERSE_SECTION.features.map((feature, index) => (
                <UniverseFeatureTab
                  key={feature.id}
                  feature={feature}
                  isActive={index === activeIndex}
                  progress={index === activeIndex ? progress : 0}
                  onSelect={() => selectTab(index)}
                />
              ))}
            </div>

            <div className="relative mt-10 min-h-[240px] sm:mt-12 sm:min-h-[320px] lg:mt-14 lg:min-h-[460px]">
              {UNIVERSE_SECTION.features.map((feature, index) => (
                <UniverseFeatureStage
                  key={feature.id}
                  feature={feature}
                  isActive={index === activeIndex}
                />
              ))}
            </div>
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}
