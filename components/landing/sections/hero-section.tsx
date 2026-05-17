"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { buttonVariants } from "@/components/ui/button";
import { HERO, SITE } from "@/lib/landing/content";
import RotatingText from "@/components/RotatingText";
import Aurora from "@/components/Aurora";

const ROTATING_WORD_CLASS =
  "inline-block text-[#FDD835] bg-gradient-to-br from-[#FDD835] via-[#4FC3F7] to-[#7E57C2] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] supports-[background-clip:text]:text-transparent";

const HERO_STATS = [
  { value: "2,400+", label: "Học viên" },
  { value: "48", label: "Chương trình" },
  { value: "5", label: "Lĩnh vực STEAM" },
  { value: "AI", label: "Portfolio tự động" },
];

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

export function HeroSection() {
  const reduce = useReducedMotion();

  return (
    <section
      className="relative min-h-svh bg-[#1a1a1a] text-[#FAFAF5] overflow-hidden flex flex-col"
      aria-labelledby="hero-headline"
    >
      {/* === Layer 1: Background image === */}
      {HERO.imageSrc && (
        <Image
          src={HERO.imageSrc}
          alt="OboxSTEAM classroom"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
      )}

      {/* === Layer 2: Aurora shader tint === */}
      <div className="absolute inset-0 pointer-events-none mix-blend-soft-light" aria-hidden="true">
        {reduce ? (
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, #E94B3C33 0%, #4FC3F733 50%, #7E57C233 100%)",
            }}
          />
        ) : (
          <Aurora
            colorStops={["#E94B3C", "#4FC3F7", "#7E57C2"]}
            amplitude={0.8}
            blend={0.5}
            speed={0.5}
          />
        )}
      </div>

      {/* === Layer 3: Dark vignette gradient === */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.4) 40%, rgba(10,10,10,0.25) 65%, rgba(10,10,10,0.6) 100%)",
        }}
      />

      {/* === Layer 4: Noise texture === */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* === Vertical indicator (Tizi-style) === */}
      <div
        aria-hidden="true"
        className="hidden lg:flex absolute right-6 bottom-28 z-10 flex-col items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-white/30 uppercase"
        style={{ writingMode: "vertical-rl" }}
      >
        <span>01 / 05</span>
        <span className="h-10 w-px bg-white/15" />
        <span>Scroll</span>
      </div>

      {/* === Left vertical brand mark === */}
      <div
        aria-hidden="true"
        className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 z-10 flex-col items-center gap-2 font-mono text-[9px] tracking-[0.4em] text-white/20 uppercase"
        style={{ writingMode: "vertical-rl" }}
      >
        <span>{SITE.name}</span>
        <span className="h-6 w-px bg-white/10" />
        <span>2026</span>
      </div>

      {/* === Main content === */}
      <div className="relative flex-1 flex items-center z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-32 lg:py-36">
          <div className="max-w-3xl">
            <EyebrowChip dark className="mb-6">
              {HERO.eyebrow}
            </EyebrowChip>

            <h1
              id="hero-headline"
              className="font-heading font-extrabold text-balance tracking-tight mb-6"
              style={{
                fontSize: "clamp(3rem, 8vw, 7rem)",
                lineHeight: 0.93,
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

            <p className="text-white/60 text-base lg:text-lg leading-relaxed max-w-lg mb-8">
              {HERO.subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mb-12">
              <Link
                href={HERO.ctaPrimary.href}
                className={
                  buttonVariants({ size: "lg" }) +
                  " bg-[#E94B3C] hover:bg-[#d43e30] text-white font-semibold px-8 py-3 rounded-lg min-h-[52px] text-base transition-all duration-150 hover:scale-[1.02] shadow-lg shadow-[#E94B3C]/25"
                }
              >
                {HERO.ctaPrimary.label}
              </Link>
              <Link
                href={HERO.ctaSecondary.href}
                className={
                  buttonVariants({ variant: "outline", size: "lg" }) +
                  " border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/35 backdrop-blur-sm font-semibold px-8 py-3 rounded-lg min-h-[52px] text-base transition-all duration-150 hover:scale-[1.02]"
                }
              >
                {HERO.ctaSecondary.label}
              </Link>
            </div>

            {/* Inline stat chips */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {HERO_STATS.map((stat, i) => (
                <div key={i} className="flex items-baseline gap-1.5">
                  <span className="font-heading font-bold text-white text-sm lg:text-base">
                    {stat.value}
                  </span>
                  <span className="text-white/35 text-xs">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === Bottom info strip === */}
      <div className="relative z-10 border-t border-white/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-6 overflow-x-auto scrollbar-none">
            {/* Left: STEAM color dots + tagline */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex gap-1">
                {["#E94B3C", "#7CB342", "#4FC3F7", "#FDD835", "#7E57C2"].map(
                  (c, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ background: c }}
                    />
                  )
                )}
              </div>
              <span className="text-white/40 text-xs font-mono uppercase tracking-[0.15em]">
                5 lĩnh vực · Trải nghiệm thực tế
              </span>
            </div>

            {/* Center: key feature chips */}
            <div className="hidden md:flex items-center gap-2">
              {["Portfolio AI", "Mentor 1:1", "Chứng chỉ quốc tế"].map(
                (label) => (
                  <span
                    key={label}
                    className="px-3 py-1 rounded-full bg-white/6 border border-white/8 text-white/50 text-[11px] font-medium"
                  >
                    {label}
                  </span>
                )
              )}
            </div>

            {/* Right: scroll hint */}
            <div className="hidden sm:flex items-center gap-2 shrink-0 text-white/25 text-xs font-mono uppercase tracking-[0.15em]">
              <span>Scroll to explore</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="animate-bounce"
              >
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* === Bottom STEAM rainbow accent bar === */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, #E94B3C 0%, #7CB342 25%, #4FC3F7 50%, #FDD835 75%, #7E57C2 100%)",
          opacity: 0.5,
        }}
      />
    </section>
  );
}
