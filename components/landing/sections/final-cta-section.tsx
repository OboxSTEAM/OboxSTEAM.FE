"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import ClickSpark from "@/components/ClickSpark";
import AnimatedContent from "@/components/AnimatedContent";
import { FINAL_CTA } from "@/lib/landing/content";

export function FinalCtaSection() {
  return (
    <section
      className="relative py-24 lg:py-32 bg-[#FAFAF5] overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Large decorative watermark letters in STEAM colors — purely visual */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        <span
          className="font-heading font-extrabold leading-none tracking-tighter text-[#2D2D2D]"
          style={{ fontSize: "clamp(12rem, 35vw, 28rem)", opacity: 0.03 }}
        >
          GO
        </span>
      </div>

      {/* STEAM rainbow top rule */}
      <div
        aria-hidden="true"
        className="absolute top-0 inset-x-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, #E94B3C 0%, #7CB342 25%, #4FC3F7 50%, #FDD835 75%, #7E57C2 100%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedContent distance={40} duration={0.7}>
          {/* Mono eyebrow */}
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#6B6B6B] mb-8">
            OboxSTEAM · 2026 · Bắt đầu ngay hôm nay
          </p>

          {/* Giant poster headline */}
          <h2
            id="cta-heading"
            className="font-heading font-extrabold text-[#2D2D2D] text-balance tracking-tight mx-auto"
            style={{
              fontSize: "clamp(2.8rem, 8vw, 6.5rem)",
              lineHeight: 0.95,
              maxWidth: "16ch",
            }}
          >
            {FINAL_CTA.headline}
          </h2>

          {/* Horizontal STEAM rainbow divider */}
          <div
            aria-hidden="true"
            className="mx-auto mt-8 mb-8 h-[2px] w-20 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #E94B3C 0%, #FDD835 50%, #7E57C2 100%)",
            }}
          />

          <p className="text-[#6B6B6B] text-lg max-w-md mx-auto mb-10 leading-relaxed">
            {FINAL_CTA.subheadline}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <ClickSpark
              sparkColor="#E94B3C"
              sparkCount={12}
              sparkRadius={36}
              sparkSize={8}
              duration={500}
            >
              <Link
                href="/register"
                className={
                  buttonVariants({ size: "lg" }) +
                  " bg-[#E94B3C] hover:bg-[#d43e30] text-white font-semibold px-10 py-3 rounded-lg min-h-[56px] text-base transition-all duration-150 hover:scale-[1.02] shadow-xl shadow-[#E94B3C]/25 relative"
                }
              >
                {FINAL_CTA.ctaPrimary.label}
              </Link>
            </ClickSpark>

            <Link
              href={FINAL_CTA.ctaSecondary.href}
              className="text-sm font-semibold text-[#2D2D2D]/60 hover:text-[#2D2D2D] underline underline-offset-4 decoration-[#2D2D2D]/25 hover:decoration-[#2D2D2D]/60 transition-all duration-150 min-h-[56px] flex items-center"
            >
              {FINAL_CTA.ctaSecondary.label}
            </Link>
          </div>

          {/* Micro trust line */}
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]/60 mt-8">
            Miễn phí · Không cần thẻ tín dụng
          </p>
        </AnimatedContent>
      </div>

      {/* STEAM dots row — decorative bottom row */}
      <div
        aria-hidden="true"
        className="absolute bottom-8 inset-x-0 flex justify-center gap-3"
      >
        {["#E94B3C", "#7CB342", "#4FC3F7", "#FDD835", "#7E57C2"].map(
          (color, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{ width: 6, height: 6, background: color, opacity: 0.35 }}
            />
          )
        )}
      </div>
    </section>
  );
}
