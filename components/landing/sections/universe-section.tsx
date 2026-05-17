"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { ImageSlot } from "@/components/common/image-slot";
import { SITE, UNIVERSE_SECTION } from "@/lib/landing/content";
import Aurora from "@/components/Aurora";

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

export function UniverseSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="portfolio"
      className="relative bg-[#2D2D2D] text-[#FAFAF5] overflow-hidden"
      aria-labelledby="universe-heading"
    >
      {/* Aurora shader background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {reduce ? (
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, #E94B3C22 0%, #7CB34222 25%, #4FC3F722 50%, #FDD83522 75%, #7E57C222 100%)",
            }}
          />
        ) : (
          <Aurora
            colorStops={["#E94B3C", "#4FC3F7", "#7E57C2"]}
            amplitude={0.8}
            blend={0.4}
            speed={0.6}
          />
        )}
      </div>

      {/* Noise texture overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        {/* Logo on dark */}
        <div className="flex items-center gap-2 mb-16">
          <Image
            src={SITE.logoUrl}
            alt="OboxSTEAM"
            width={32}
            height={32}
            className="object-contain brightness-0 invert"
          />
          <span className="font-heading font-bold text-sm text-white/60 tracking-tight">OboxSTEAM</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left — narrative */}
          <div className="flex flex-col gap-8">
            <EyebrowChip dark className="w-fit">
              {UNIVERSE_SECTION.eyebrow}
            </EyebrowChip>

            <h2
              id="universe-heading"
              className="font-heading font-extrabold text-white text-balance leading-none tracking-tight"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
            >
              {UNIVERSE_SECTION.headline}
            </h2>

            <p className="text-[#FAFAF5]/70 text-lg leading-relaxed max-w-lg">
              {UNIVERSE_SECTION.subheadline}
            </p>

            {/* Feature list */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {UNIVERSE_SECTION.features.map((feature) => (
                <li
                  key={feature.label}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/8 backdrop-blur-sm"
                >
                  <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-white text-sm leading-snug">{feature.label}</p>
                    <p className="text-[#FAFAF5]/55 text-xs mt-0.5 leading-relaxed">{feature.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href={UNIVERSE_SECTION.ctaHref}
                className={buttonVariants({ size: "lg" }) + " bg-white text-[#2D2D2D] hover:bg-[#FAFAF5] font-semibold px-8 py-3 rounded-lg min-h-[52px] transition-all duration-150 hover:scale-[1.02]"}
              >
                {UNIVERSE_SECTION.ctaLabel}
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ variant: "outline", size: "lg" }) + " border-white/20 text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-lg min-h-[52px]"}
              >
                Đăng ký ngay
              </Link>
            </div>
          </div>

          {/* Right — 16:9 image slot */}
          <div className="flex flex-col gap-4">
            <ImageSlot
              ratio="16:9"
              alt="Portfolio STEAM của học viên OboxSTEAM"
              tone="engineering"
              className="w-full border border-white/10"
            />
            {/* Two smaller slots beneath */}
            <div className="grid grid-cols-2 gap-4">
              <ImageSlot
                ratio="4:3"
                alt="AI nhận dạng khuôn mặt trong lớp học"
                tone="technology"
                className="w-full border border-white/10"
              />
              <ImageSlot
                ratio="4:3"
                alt="Chứng chỉ và thành tích học viên"
                tone="arts"
                className="w-full border border-white/10"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
