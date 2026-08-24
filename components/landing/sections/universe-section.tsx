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
type UniverseFeature = (typeof UNIVERSE_SECTION.features)[number];

const FEATURE_ICONS: Record<string, LucideIcon> = {
  ScanFace,
  Video,
  PenLine,
  Globe,
};

/** Muted paper stocks — distinct enough to separate, not loud STEAM fills. */
const FEATURE_SHEETS: Record<
  string,
  { paper: string; tab: string; fill: string; rear: string; border: string }
> = {
  ScanFace: {
    paper: "#F7F2EA",
    tab: "#EDE6DA",
    fill: "#E2D8C8",
    rear: "#E8E0D4",
    border: "rgba(45, 45, 45, 0.12)",
  },
  Video: {
    paper: "#F4F2EC",
    tab: "#DED9CE",
    fill: "#D0CABD",
    rear: "#D8D3C8",
    border: "rgba(45, 45, 45, 0.12)",
  },
  PenLine: {
    paper: "#F3F1EB",
    tab: "#D2CEC4",
    fill: "#C3BEB3",
    rear: "#CBC7BC",
    border: "rgba(45, 45, 45, 0.14)",
  },
  Globe: {
    paper: "#F2F3EE",
    tab: "#C5CBC0",
    fill: "#B4BBAE",
    rear: "#BDC4B7",
    border: "rgba(45, 45, 45, 0.16)",
  },
};

const TAB_DURATION_MS = 5500;
const FEATURE_COUNT = UNIVERSE_SECTION.features.length;

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

function PaperGrain({
  className,
  opacity = 0.18,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 mix-blend-multiply",
        className,
      )}
      style={{
        opacity,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.9'/%3E%3C/svg%3E\")",
        backgroundSize: "160px 160px",
      }}
    />
  );
}

function UniverseFeatureTab({
  feature,
  index,
  isActive,
  progress,
  onSelect,
}: {
  feature: UniverseFeature;
  index: number;
  isActive: boolean;
  progress: number;
  onSelect: () => void;
}) {
  const Icon = FEATURE_ICONS[feature.iconName];
  const sheet = FEATURE_SHEETS[feature.iconName] ?? FEATURE_SHEETS.ScanFace;
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
        "absolute bottom-0 flex min-h-[44px] items-center gap-2 overflow-hidden rounded-t-2xl px-3 text-left outline-none sm:px-4",
        "border border-b-0 transition-[height,box-shadow,filter] duration-200",
        "focus-visible:ring-2 focus-visible:ring-[#4FC3F7] focus-visible:ring-offset-2",
        isActive ? "z-40 h-12" : "z-30 h-11 hover:brightness-[0.98]",
      )}
      style={{
        left: `calc(${index} * (100% / ${FEATURE_COUNT}) + 0.2rem)`,
        width: `calc(100% / ${FEATURE_COUNT} - 0.4rem)`,
        backgroundColor: isActive ? sheet.paper : sheet.tab,
        borderColor: sheet.border,
        boxShadow: isActive
          ? "0 -3px 12px rgba(45,45,45,0.07), inset 0 1px 0 rgba(255,255,255,0.55)"
          : "0 -2px 8px rgba(45,45,45,0.05)",
      }}
    >
      <PaperGrain opacity={isActive ? 0.22 : 0.32} />

      {isActive ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: sheet.fill,
          }}
        />
      ) : null}

      <span className="relative flex min-w-0 items-center gap-2">
        {Icon ? (
          <Icon
            size={16}
            strokeWidth={2}
            className="hidden shrink-0 sm:block"
            style={{ color: isActive ? feature.accent : "#5A5A5A" }}
            aria-hidden="true"
          />
        ) : null}
        <span
          className={cn(
            "truncate font-heading text-xs font-bold sm:text-sm",
            isActive ? "text-[#2D2D2D]" : "text-[#4A4A4A]",
          )}
        >
          {feature.tabLabel}
        </span>
      </span>
    </button>
  );
}

function UniverseFeatureSheet({
  feature,
  isActive,
  depth,
  reduceMotion,
}: {
  feature: UniverseFeature;
  isActive: boolean;
  depth: number;
  reduceMotion: boolean;
}) {
  const sheet = FEATURE_SHEETS[feature.iconName] ?? FEATURE_SHEETS.ScanFace;
  const fill = isActive ? sheet.paper : sheet.rear;

  return (
    <div
      id={isActive ? `universe-panel-${feature.id}` : undefined}
      role={isActive ? "tabpanel" : undefined}
      aria-labelledby={isActive ? `universe-tab-${feature.id}` : undefined}
      aria-hidden={!isActive}
      className={cn(
        isActive ? "relative" : "absolute inset-0",
        !reduceMotion && "transition-[transform,box-shadow] duration-300 ease-out",
      )}
      style={{
        zIndex: 20 - depth,
        transform:
          depth === 0 ? "none" : `translate(${depth * 8}px, ${depth * 10}px)`,
      }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-t-none rounded-b-2xl sm:rounded-b-[1.75rem]",
          isActive
            ? "shadow-[0_20px_48px_rgba(45,45,45,0.12)]"
            : "h-full shadow-[0_12px_28px_rgba(45,45,45,0.08)]",
        )}
        style={{ backgroundColor: fill }}
      >
        <PaperGrain opacity={0.24} />

        {isActive ? (
          <div className="relative grid grid-cols-1 gap-6 p-5 sm:gap-8 sm:p-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:p-8">
            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(45,45,45,0.10)] ring-1 ring-[#E5E5E0]">
                <Image
                  src={feature.imageSrc}
                  alt={feature.label}
                  fill
                  sizes="(max-width: 1024px) 90vw, 480px"
                  className="object-cover object-top"
                  priority={feature.id === "face-detection"}
                />
              </div>
            </div>

            <div
              className="relative min-h-[12rem] px-1 py-2 sm:px-2"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 27px, #E5E5E0 27px, #E5E5E0 28px)",
                backgroundPosition: "0 8px",
              }}
            >
              <p
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: feature.accent }}
              >
                {feature.tabLabel}
              </p>
              <h3 className="mt-3 font-heading text-xl font-extrabold tracking-tight text-[#2D2D2D] sm:text-2xl">
                {feature.label}
              </h3>
              <p className="mt-4 max-w-[42ch] font-display-serif text-base leading-relaxed text-[#2D2D2D] sm:text-lg">
                {feature.body}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function UniverseFolderStack({
  activeIndex,
  progress,
  reduceMotion,
  onSelect,
}: {
  activeIndex: number;
  progress: number;
  reduceMotion: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <div role="tablist" aria-label="Tính năng AI Portfolio">
      <div className="relative pb-16 pr-8 sm:pb-20 sm:pr-10">
        <div className="relative h-11 sm:h-12">
          {UNIVERSE_SECTION.features.map((feature, index) => (
            <UniverseFeatureTab
              key={feature.id}
              feature={feature}
              index={index}
              isActive={index === activeIndex}
              progress={index === activeIndex ? progress : 0}
              onSelect={() => onSelect(index)}
            />
          ))}
        </div>

        <div className="relative -mt-px">
          {UNIVERSE_SECTION.features.map((feature, index) => {
            const depth =
              (index - activeIndex + FEATURE_COUNT) % FEATURE_COUNT;
            return (
              <UniverseFeatureSheet
                key={feature.id}
                feature={feature}
                isActive={index === activeIndex}
                depth={depth}
                reduceMotion={reduceMotion}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function UniverseSection() {
  const reduceMotion = useReducedMotion();
  const { activeIndex, progress, selectTab } = useAutoTabs(
    FEATURE_COUNT,
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
          <UniverseFolderStack
            activeIndex={activeIndex}
            progress={progress}
            reduceMotion={reduceMotion}
            onSelect={selectTab}
          />
        </AnimatedContent>
      </div>
    </section>
  );
}
