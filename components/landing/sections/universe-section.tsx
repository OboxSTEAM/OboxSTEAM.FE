import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { UNIVERSE_SECTION } from "@/lib/landing/content";

import { UniverseCardSwap } from "./universe-card-swap";

export function UniverseSection() {
  return (
    <section
      id="portfolio"
      className="relative overflow-x-clip bg-[#F5F5F0]"
      aria-labelledby="universe-heading"
    >
      {/* Top-right STEAM rainbow radial tint (cinematic feel without dark surface) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-[640px] w-[640px]"
        style={{
          background:
            "radial-gradient(circle at center, #E94B3C 0%, #FDD835 25%, #4FC3F7 55%, #7E57C2 85%, transparent 100%)",
          opacity: 0.08,
          filter: "blur(8px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative lg:min-h-[620px]">
          {/* Left — narrative only (features live in CardSwap) */}
          <div className="relative z-10 flex max-w-xl flex-col gap-7 lg:max-w-lg">
            <EyebrowChip className="w-fit">{UNIVERSE_SECTION.eyebrow}</EyebrowChip>

            <h2
              id="universe-heading"
              className="font-heading text-balance font-extrabold tracking-tight text-[#2D2D2D]"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                lineHeight: 0.98,
              }}
            >
              {UNIVERSE_SECTION.headline}
            </h2>

            <p className="max-w-lg text-lg leading-relaxed text-[#6B6B6B]">
              {UNIVERSE_SECTION.subheadline}
            </p>

            <div>
              <Link
                href={UNIVERSE_SECTION.ctaHref}
                className={
                  buttonVariants({ size: "lg" }) +
                  " min-h-[52px] rounded-lg bg-[#2D2D2D] px-8 py-3 font-semibold text-white transition-all duration-150 hover:scale-[1.02] hover:bg-[#1a1a1a]"
                }
              >
                {UNIVERSE_SECTION.ctaLabel}
              </Link>
            </div>
          </div>

          {/* Right — CardSwap pinned to viewport right edge on desktop */}
          <div className="relative mt-12 lg:absolute lg:inset-y-0 lg:right-[calc(-50vw+50%)] lg:mt-0 lg:w-[min(58vw,720px)]">
            <UniverseCardSwap />
          </div>
        </div>
      </div>
    </section>
  );
}
