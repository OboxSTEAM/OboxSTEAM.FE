"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { HeroPhotoPrint } from "@/components/landing/hero-photo-print";
import { buttonVariants } from "@/components/ui/button";
import { HERO } from "@/lib/landing/content";
import { HERO_PRINTS } from "@/lib/landing/hero-print-layout";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

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
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const printRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (reduce || !sectionRef.current || !stickyRef.current || !contentRef.current) return;

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=70%",
            scrub: 0.55,
            pin: stickyRef.current,
            anticipatePin: 1,
          },
        });

        tl.to(
          contentRef.current,
          {
            filter: "blur(8px)",
            opacity: 0.32,
            y: -20,
            ease: "none",
          },
          0,
        );

        printRefs.current.forEach((el, index) => {
          if (!el) return;
          const { slide } = HERO_PRINTS[index]!;
          tl.to(
            el,
            {
              x: slide.x,
              y: slide.y,
              opacity: 0.55,
              ease: "none",
            },
            0,
          );
        });
      }, sectionRef);

      return () => ctx.revert();
    },
    { dependencies: [reduce], scope: sectionRef },
  );

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative bg-[#1A1410]"
      aria-labelledby="hero-headline"
    >
      <div ref={stickyRef} className="relative min-h-dvh overflow-hidden flex flex-col">
        <Image
          src={HERO.deskTextureSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          aria-hidden="true"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] pointer-events-none bg-[#120c08]/35"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[2] pointer-events-none opacity-[0.14] mix-blend-soft-light"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.9'/%3E%3C/svg%3E\")",
            backgroundSize: "180px 180px",
          }}
        />

        {/* Soft vignette so center copy stays readable over prints. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[3] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(18,12,8,0.55)_0%,rgba(18,12,8,0.22)_45%,transparent_72%)]"
        />

        {HERO_PRINTS.map((print, index) => (
          <HeroPhotoPrint
            key={print.id}
            ref={(node) => {
              printRefs.current[index] = node;
            }}
            src={print.src}
            alt={print.alt}
            width={print.width}
            height={print.height}
            rotate={print.rotate}
            zIndex={print.zIndex}
            className={print.className}
            frameClassName={print.frameClassName}
            priority={print.priority}
          />
        ))}

        <div className="relative z-40 flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-28">
          <div
            ref={contentRef}
            className="max-w-3xl text-center will-change-[transform,filter,opacity]"
          >
            <h1
              id="hero-headline"
              className="tracking-tight mb-4 drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)]"
            >
              <span
                className="block whitespace-nowrap font-heading font-extrabold text-white"
                style={{ fontSize: "clamp(1.5rem, 5.5vw, 3.75rem)", lineHeight: 1.08 }}
              >
                {HERO.headlineLine1}
              </span>
              <span
                className="block whitespace-nowrap font-[family-name:var(--font-display-serif)] italic font-normal text-white pb-1"
                style={{ fontSize: "clamp(1.35rem, 4.8vw, 3.25rem)", lineHeight: 1.18 }}
              >
                {HERO.headlineLine2}
              </span>
            </h1>

            <p className="text-white/80 text-sm sm:text-[0.95rem] leading-relaxed max-w-[40ch] mx-auto mb-8 drop-shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
              {HERO.subheadline}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={HERO.primaryCta.href}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "min-h-[44px] rounded-full bg-white px-7 text-sm sm:text-base text-[#2D2D2D] hover:bg-white/90",
                )}
              >
                {HERO.primaryCta.label}
              </Link>
              <Link
                href={HERO.secondaryCta.href}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-h-[44px] rounded-full border-white/60 bg-transparent px-7 text-sm sm:text-base text-white hover:bg-white/10 hover:text-white",
                )}
              >
                {HERO.secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full h-[2px] pointer-events-none z-40"
          style={{
            background:
              "linear-gradient(90deg, #E94B3C 0%, #7CB342 25%, #4FC3F7 50%, #FDD835 75%, #7E57C2 100%)",
            opacity: 0.5,
          }}
        />
      </div>
    </section>
  );
}
