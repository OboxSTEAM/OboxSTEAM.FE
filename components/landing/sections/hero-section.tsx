"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { buttonVariants } from "@/components/ui/button";
import { HERO, SITE } from "@/lib/landing/content";
import RotatingText from "@/components/RotatingText";
import Aurora from "@/components/Aurora";

// Single brand accent — Obox Yellow. No gradient fill on display text.
const ROTATING_WORD_CLASS = "inline-block text-[#FDD835]";

const HERO_STATS = [
  { value: "2,400+", label: "Học viên" },
  { value: "48", label: "Chương trình" },
  { value: "5", label: "Lĩnh vực STEAM" },
  { value: "AI", label: "Portfolio tự động" },
];

// Ambient STEAM color orbs — right composition zone, behind vignette
const STEAM_ORBS = [
  { color: "#E94B3C", w: 360, h: 360, top: "10%", right: "18%", blur: 130, opacity: 0.22 },
  { color: "#4FC3F7", w: 260, h: 260, top: "52%", right: "6%",  blur: 110, opacity: 0.18 },
  { color: "#FDD835", w: 200, h: 200, top: "28%", right: "40%", blur: 100, opacity: 0.15 },
  { color: "#7CB342", w: 220, h: 220, top: "70%", right: "30%", blur: 120, opacity: 0.13 },
  { color: "#7E57C2", w: 280, h: 280, top: "5%",  right: "4%",  blur: 140, opacity: 0.16 },
] as const;

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

function fadeUp(delay: number) {
  return {
    animation: `heroFadeUp 0.8s ${delay}s cubic-bezier(0.16, 1, 0.3, 1) both`,
  } as React.CSSProperties;
}

export function HeroSection() {
  const reduce = useReducedMotion();

  return (
    <section
      className="relative min-h-dvh bg-[#1A1A1A] text-[#FAFAF5] overflow-hidden flex flex-col"
      aria-labelledby="hero-headline"
    >
      {/* === Layer 1: Background image — cinematic 50% === */}
      {HERO.imageSrc && (
        <Image
          src={HERO.imageSrc}
          alt="OboxSTEAM classroom"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          style={{ opacity: 0.5, transform: "translateZ(0)" }}
        />
      )}

      {/* === Layer 2: STEAM ambient orbs — behind vignette, right zone === */}
      {!reduce &&
        STEAM_ORBS.map((orb, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="absolute pointer-events-none rounded-full"
            style={{
              width: orb.w,
              height: orb.h,
              top: orb.top,
              right: orb.right,
              background: orb.color,
              filter: `blur(${orb.blur}px)`,
              opacity: orb.opacity,
              transform: "translateZ(0)",
            }}
          />
        ))}

      {/* === Layer 3: Directional cinematic vignette ===
          Left-heavy: content zone is deeply dark; right breathes open to reveal the image.
          Bottom anchor: grounds the section. Top fade: prevents harsh header collision. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "linear-gradient(to right, rgba(14,11,11,0.92) 0%, rgba(14,11,11,0.72) 38%, rgba(14,11,11,0.32) 62%, rgba(14,11,11,0.08) 100%)",
            "linear-gradient(to top, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.55) 22%, rgba(10,10,10,0.0) 48%)",
            "linear-gradient(to bottom, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.0) 18%)",
          ].join(", "),
        }}
      />

      {/* === Layer 4: Aurora tint — soft chromatic wash === */}
      {!reduce && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ mixBlendMode: "soft-light", opacity: 0.55 }}
        >
          <Aurora
            colorStops={["#E94B3C", "#4FC3F7", "#7E57C2"]}
            amplitude={0.65}
            blend={0.4}
            speed={0.4}
          />
        </div>
      )}

      {/* === Reduced-motion fallback: static tint === */}
      {reduce && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(233,75,60,0.12) 0%, rgba(79,195,247,0.08) 50%, rgba(126,87,194,0.10) 100%)",
          }}
        />
      )}

      {/* === Scroll indicator === */}
      <div
        aria-hidden="true"
        className="hidden lg:flex absolute right-6 bottom-10 z-10 flex-col items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-white/25 uppercase"
        style={{ writingMode: "vertical-rl" }}
      >
        <span>01 / 05</span>
        <span className="h-10 w-px bg-white/12" />
        <span>Scroll</span>
      </div>

      {/* === Left vertical brand mark === */}
      <div
        aria-hidden="true"
        className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 z-10 flex-col items-center gap-2 font-mono text-[9px] tracking-[0.4em] text-white/18 uppercase"
        style={{ writingMode: "vertical-rl" }}
      >
        <span>{SITE.name}</span>
        <span className="h-6 w-px bg-white/10" />
        <span>2026</span>
      </div>

      {/* === Main content === */}
      <div className="relative flex-1 flex items-center z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-32 lg:py-40">
          {/* Content column — left-aligned, 55% max width on large screens */}
          <div className="max-w-2xl">

            {/* Eyebrow */}
            <div style={reduce ? undefined : fadeUp(0)}>
              <EyebrowChip dark className="mb-7">
                {HERO.eyebrow}
              </EyebrowChip>
            </div>

            {/* Headline */}
            <h1
              id="hero-headline"
              className="font-heading font-extrabold text-balance tracking-tight mb-6"
              style={{
                fontSize: "clamp(3.5rem, 9vw, 8.5rem)",
                lineHeight: 0.9,
                ...(reduce ? undefined : fadeUp(0.1)),
              }}
            >
              <span className="text-white">{HERO.headlineStatic}</span>
              <br />
              <span
                className="inline-block min-h-[1.05em] align-baseline overflow-visible"
                aria-live="polite"
              >
                {reduce ? (
                  <span className={ROTATING_WORD_CLASS}>{HERO.rotatingWords[0]}</span>
                ) : (
                  <RotatingText
                    texts={[...HERO.rotatingWords]}
                    rotationInterval={2500}
                    staggerDuration={0.03}
                    staggerFrom="first"
                    splitBy="characters"
                    mainClassName="inline-flex flex-wrap"
                    elementLevelClassName={ROTATING_WORD_CLASS}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  />
                )}
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-white/55 text-base lg:text-lg leading-relaxed max-w-[52ch] mb-10"
              style={reduce ? undefined : fadeUp(0.22)}
            >
              {HERO.subheadline}
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap items-center gap-3 mb-12"
              style={reduce ? undefined : fadeUp(0.32)}
            >
              <Link
                href={HERO.ctaPrimary.href}
                className={
                  buttonVariants({ size: "lg" }) +
                  " bg-[#E94B3C] hover:bg-[#d43e30] text-white font-semibold px-8 rounded-lg min-h-[52px] text-base" +
                  " shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_24px_rgba(233,75,60,0.30)]" +
                  " hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
                }
              >
                {HERO.ctaPrimary.label}
              </Link>
              <Link
                href={HERO.ctaSecondary.href}
                className={
                  buttonVariants({ variant: "outline", size: "lg" }) +
                  " border border-white/18 bg-white/6 text-white hover:bg-white/10 hover:border-white/32 backdrop-blur-md font-semibold px-8 rounded-lg min-h-[52px] text-base" +
                  " shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" +
                  " hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
                }
              >
                {HERO.ctaSecondary.label}
              </Link>
            </div>

            {/* Stat chips — liquid glass pills */}
            <div
              className="flex flex-wrap items-center gap-2"
              style={reduce ? undefined : fadeUp(0.42)}
            >
              {HERO_STATS.map((stat, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-1.5 px-4 py-2 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
                  }}
                >
                  <span className="font-heading font-bold text-white text-sm lg:text-[0.9375rem]">
                    {stat.value}
                  </span>
                  <span className="text-white/38 text-xs">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === Bottom STEAM rainbow line === */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-full h-[2px] pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, #E94B3C 0%, #7CB342 25%, #4FC3F7 50%, #FDD835 75%, #7E57C2 100%)",
          opacity: 0.55,
        }}
      />
    </section>
  );
}
