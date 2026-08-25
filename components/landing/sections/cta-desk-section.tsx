"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { HeroPhotoPrint } from "@/components/landing/hero-photo-print";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { CTA_DESK_SECTION } from "@/lib/landing/content";
import { CTA_PRINTS } from "@/lib/landing/cta-print-layout";
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

export function CtaDeskSection() {
  const reduce = useReducedMotion();
  const { isAuthenticated } = useCurrentUser();
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const printRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (reduce || !sectionRef.current || !stickyRef.current || !contentRef.current) return;

      const ctx = gsap.context(() => {
        gsap.set(contentRef.current, {
          filter: "blur(10px)",
          opacity: 0.2,
          y: 48,
        });

        printRefs.current.forEach((el, index) => {
          if (!el) return;
          const { slide } = CTA_PRINTS[index]!;
          gsap.set(el, {
            x: slide.x,
            y: slide.y,
            opacity: 0.25,
          });
        });

        /**
         * Soft scrub reveal (no hard pin jump from Programs).
         * Scroll down → settle in; scroll up → blur + slide out.
         */
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 78%",
            end: "top 18%",
            scrub: 1.15,
            invalidateOnRefresh: true,
          },
        });

        tl.to(
          contentRef.current,
          {
            filter: "blur(0px)",
            opacity: 1,
            y: 0,
            ease: "none",
          },
          0,
        );

        printRefs.current.forEach((el) => {
          if (!el) return;
          tl.to(
            el,
            {
              x: 0,
              y: 0,
              opacity: 1,
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
      ref={sectionRef}
      id="cta"
      className="relative bg-[#1A1410]"
      aria-labelledby="cta-desk-headline"
    >
      <div ref={stickyRef} className="relative min-h-dvh overflow-hidden">
        <Image
          src={CTA_DESK_SECTION.deskTextureSrc}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          aria-hidden="true"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] pointer-events-none bg-[#120c08]/38"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[2] pointer-events-none opacity-[0.12] mix-blend-soft-light"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.9'/%3E%3C/svg%3E\")",
            backgroundSize: "180px 180px",
          }}
        />

        {CTA_PRINTS.map((print, index) => (
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

        <div className="relative z-40 flex min-h-dvh items-center justify-center px-4 sm:px-6 lg:px-8">
          <div
            ref={contentRef}
            className="flex w-full max-w-[46rem] flex-col items-center will-change-[transform,filter,opacity] sm:max-w-[52rem]"
          >
            <h2
              id="cta-desk-headline"
              className="relative text-center text-white drop-shadow-[0_3px_28px_rgba(0,0,0,0.55)]"
            >
              <span
                className="block font-heading font-extrabold uppercase tracking-tight whitespace-nowrap"
                style={{ fontSize: "clamp(1.35rem, 5.2vw, 4.25rem)", lineHeight: 1.05 }}
              >
                {CTA_DESK_SECTION.headline}
              </span>

              <span
                className="font-display-serif mt-3 block italic font-normal text-white/95"
                style={{ fontSize: "clamp(1.25rem, 3.2vw, 2.25rem)", lineHeight: 1.2 }}
              >
                {CTA_DESK_SECTION.headlineSupport}
              </span>
            </h2>

            {!isAuthenticated ? (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
                <Link
                  href={CTA_DESK_SECTION.primaryCta.href}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "min-h-[44px] rounded-full bg-white px-7 text-sm sm:text-base text-[#2D2D2D] hover:bg-white/90",
                  )}
                >
                  {CTA_DESK_SECTION.primaryCta.label}
                </Link>
                <Link
                  href={CTA_DESK_SECTION.secondaryCta.href}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "min-h-[44px] rounded-full border-white/60 bg-transparent px-7 text-sm sm:text-base text-white hover:bg-white/10 hover:text-white",
                  )}
                >
                  {CTA_DESK_SECTION.secondaryCta.label}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
