"use client";

import Link from "next/link";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { ImageSlot } from "@/components/common/image-slot";
import { buttonVariants } from "@/components/ui/button";
import { HERO } from "@/lib/landing/content";
import RotatingText from "@/components/RotatingText";
import AnimatedContent from "@/components/AnimatedContent";

export function HeroSection() {
  return (
    <section
      className="relative min-h-svh bg-[#FAFAF5] flex items-center overflow-hidden"
      aria-labelledby="hero-headline"
    >
      {/* Decorative rainbow corner mark */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.06] pointer-events-none"
        style={{
          background:
            "conic-gradient(from 45deg, #E94B3C 0%, #7CB342 25%, #4FC3F7 50%, #FDD835 75%, #7E57C2 100%)",
          borderRadius: "0 0 0 100%",
        }}
      />

      {/* Decorative floating STEAM dots */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {[
          { x: "8%", y: "20%", color: "#E94B3C", size: 10 },
          { x: "12%", y: "75%", color: "#7CB342", size: 7 },
          { x: "88%", y: "15%", color: "#4FC3F7", size: 12 },
          { x: "92%", y: "80%", color: "#FDD835", size: 8 },
          { x: "50%", y: "88%", color: "#7E57C2", size: 9 },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-40"
            style={{
              left: dot.x,
              top: dot.y,
              width: dot.size,
              height: dot.size,
              background: dot.color,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div className="flex flex-col items-start gap-6 lg:gap-8">
            <AnimatedContent distance={30} duration={0.6} delay={0.1}>
              <EyebrowChip>{HERO.eyebrow}</EyebrowChip>
            </AnimatedContent>

            <AnimatedContent distance={40} duration={0.7} delay={0.2}>
              <h1
                id="hero-headline"
                className="font-heading font-extrabold text-[#2D2D2D] text-balance leading-[0.95] tracking-tight"
                style={{ fontSize: "clamp(2.8rem, 7vw, 6rem)" }}
              >
                {HERO.headlineStatic}
                <br />
                <span className="inline-flex items-baseline gap-2">
                  <RotatingText
                    texts={[...HERO.rotatingWords]}
                    rotationInterval={2500}
                    staggerDuration={0.02}
                    staggerFrom="first"
                    splitBy="characters"
                    mainClassName="inline-flex overflow-hidden"
                    elementLevelClassName="inline-block"
                    initial={{ y: "110%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-110%", opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                    style={{
                      background: "linear-gradient(135deg, #E94B3C 0%, #7CB342 40%, #4FC3F7 70%, #7E57C2 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  />
                </span>
              </h1>
            </AnimatedContent>

            <AnimatedContent distance={30} duration={0.7} delay={0.4}>
              <p className="text-[#6B6B6B] text-lg leading-relaxed max-w-xl">
                {HERO.subheadline}
              </p>
            </AnimatedContent>

            <AnimatedContent distance={20} duration={0.6} delay={0.55}>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={HERO.ctaPrimary.href}
                  className={buttonVariants({ size: "lg" }) + " bg-[#E94B3C] hover:bg-[#d43e30] text-white font-semibold px-8 py-3 rounded-lg min-h-[52px] text-base transition-all duration-150 hover:scale-[1.02]"}
                >
                  {HERO.ctaPrimary.label}
                </Link>
                <Link
                  href={HERO.ctaSecondary.href}
                  className={buttonVariants({ variant: "outline", size: "lg" }) + " border-[#E5E5E0] text-[#2D2D2D] hover:bg-[#F5F5F0] font-semibold px-8 py-3 rounded-lg min-h-[52px] text-base transition-all duration-150 hover:scale-[1.02]"}
                >
                  {HERO.ctaSecondary.label}
                </Link>
              </div>
            </AnimatedContent>

            {/* Social proof micro-stat */}
            <AnimatedContent distance={15} duration={0.6} delay={0.7}>
              <p className="text-sm text-[#6B6B6B]">
                ✦ Hơn{" "}
                <span className="font-semibold text-[#2D2D2D]">2.400 học viên</span>{" "}
                đang xây dựng hành trình STEAM cùng chúng tôi
              </p>
            </AnimatedContent>
          </div>

          {/* Right — image slot */}
          <AnimatedContent distance={50} direction="horizontal" reverse duration={0.8} delay={0.3}>
            <div className="relative w-full">
              <ImageSlot
                ratio="16:9"
                alt="Học viên OboxSTEAM trong lab STEAM"
                tone="science"
                className="w-full shadow-2xl"
                priority
              />
              {/* Floating badge — program count */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-[#E5E5E0]">
                <div className="flex -space-x-2">
                  {["#E94B3C", "#7CB342", "#4FC3F7", "#FDD835", "#7E57C2"].map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-white"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-xs text-[#6B6B6B]">5 lĩnh vực STEAM</p>
                  <p className="text-sm font-semibold text-[#2D2D2D]">48 chương trình</p>
                </div>
              </div>

              {/* Floating badge — portfolio */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 border border-[#E5E5E0]">
                <p className="text-xs text-[#6B6B6B]">Portfolio AI</p>
                <p className="text-sm font-bold text-[#2D2D2D]">Tự động hoá ✦</p>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
