"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { ImageSlot } from "@/components/common/image-slot";
import { buttonVariants } from "@/components/ui/button";
import { HERO } from "@/lib/landing/content";
import RotatingText from "@/components/RotatingText";
import Aurora from "@/components/Aurora";

/** Per-glyph gradient — must live on the element that wraps each character (not the outer RotatingText root). */
const ROTATING_WORD_CLASS =
  "inline-block text-[#FDD835] bg-gradient-to-br from-[#FDD835] via-[#4FC3F7] to-[#7E57C2] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] supports-[background-clip:text]:text-transparent";

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
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
      className="relative min-h-svh bg-[#2D2D2D] text-[#FAFAF5] overflow-hidden flex items-center"
      aria-labelledby="hero-headline"
    >
      {/* Aurora cinematic shader (cool STEAM pair) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {reduce ? (
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, #E94B3C22 0%, #4FC3F722 50%, #7E57C222 100%)",
            }}
          />
        ) : (
          <Aurora
            colorStops={["#E94B3C", "#4FC3F7", "#7E57C2"]}
            amplitude={0.9}
            blend={0.45}
            speed={0.55}
          />
        )}
      </div>

      {/* Subtle noise overlay for film texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "240px 240px",
        }}
      />

      {/* Vertical position indicator (Tizi-style) */}
      <div
        aria-hidden="true"
        className="hidden lg:flex absolute right-6 bottom-10 z-10 flex-col items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-white/35 uppercase"
        style={{ writingMode: "vertical-rl" }}
      >
        <span>01 / 05</span>
        <span className="h-12 w-px bg-white/20" />
        <span>Scroll</span>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-28 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left — poster typography (60% on desktop) */}
          <div className="lg:col-span-7 flex flex-col items-start gap-7 lg:gap-9">
            <EyebrowChip dark>
              {HERO.eyebrow}
            </EyebrowChip>

            <h1
              id="hero-headline"
              className="font-heading font-extrabold text-balance tracking-tight"
              style={{
                fontSize: "clamp(3rem, 8vw, 7rem)",
                lineHeight: 0.95,
              }}
            >
              <span className="text-white">{HERO.headlineStatic}</span>
              <br />
              {/* min-h prevents layout jump; overflow-visible so y-slide animation isn't clipped */}
              <span
                className="inline-block min-h-[1em] align-baseline overflow-visible"
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

            <p className="text-white/65 text-lg lg:text-xl leading-relaxed max-w-xl">
              {HERO.subheadline}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-2">
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
                  " border-white/25 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 backdrop-blur-sm font-semibold px-8 py-3 rounded-lg min-h-[52px] text-base transition-all duration-150 hover:scale-[1.02]"
                }
              >
                {HERO.ctaSecondary.label}
              </Link>
            </div>
          </div>

          {/* Right — single 3:4 portrait slot (40%) */}
          <div className="lg:col-span-5">
            <div className="relative">
              <ImageSlot
                ratio="3:4"
                src={HERO.imageSrc}
                alt="Học viên OboxSTEAM trong lab STEAM"
                tone="science"
                className="w-full border border-white/10 shadow-2xl shadow-black/50"
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              {/* Top-left edge tag */}
              <div className="absolute top-4 left-4 font-mono text-[10px] tracking-[0.3em] uppercase text-white/70 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1">
                Profile · 2026
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom STEAM rainbow accent bar */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #E94B3C 20%, #7CB342 35%, #4FC3F7 50%, #FDD835 65%, #7E57C2 80%, transparent 100%)",
          opacity: 0.45,
        }}
      />
    </section>
  );
}
