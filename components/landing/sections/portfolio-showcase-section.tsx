"use client";

import AnimatedContent from "@/components/AnimatedContent";
import ChromaGrid from "@/components/ChromaGrid";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { PORTFOLIO_SHOWCASE_ITEMS } from "@/lib/landing/content";

export function PortfolioShowcaseSection() {
  return (
    <section
      className="py-20 lg:py-28 bg-[#FAFAF5]"
      aria-labelledby="showcase-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={30} duration={0.6}>
          <div className="text-center mb-14">
            <EyebrowChip className="mb-4">Portfolio học viên</EyebrowChip>
            <h2
              id="showcase-heading"
              className="font-heading font-extrabold text-[#2D2D2D] text-balance"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.75rem)" }}
            >
              Hành trình của từng học viên
            </h2>
            <p className="mt-4 text-[#6B6B6B] text-lg max-w-xl mx-auto">
              Di chuyển chuột để khám phá. Mỗi tile là một câu chuyện STEAM thật.
            </p>
          </div>
        </AnimatedContent>

        <AnimatedContent distance={40} duration={0.8} delay={0.2}>
          <div className="h-[520px] w-full">
            <ChromaGrid
              items={PORTFOLIO_SHOWCASE_ITEMS}
              radius={280}
              damping={0.5}
              className="h-full"
            />
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}
