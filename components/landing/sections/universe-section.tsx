import Link from "next/link";
import { ScanFace, Video, PenLine, Globe, type LucideProps } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { UNIVERSE_SECTION } from "@/lib/landing/content";

import { UniverseCardSwap } from "./universe-card-swap";

type LucideIcon = React.ComponentType<LucideProps>;

const FEATURE_ICONS: Record<string, LucideIcon> = {
  ScanFace,
  Video,
  PenLine,
  Globe,
};

export function UniverseSection() {
  return (
    <section
      id="portfolio"
      className="relative bg-[#F5F5F0] overflow-hidden"
      aria-labelledby="universe-heading"
    >
      {/* Top-right STEAM rainbow radial tint (cinematic feel without dark surface) */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 w-[640px] h-[640px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, #E94B3C 0%, #FDD835 25%, #4FC3F7 55%, #7E57C2 85%, transparent 100%)",
          opacity: 0.08,
          filter: "blur(8px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left — narrative (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-7">
            <EyebrowChip className="w-fit">{UNIVERSE_SECTION.eyebrow}</EyebrowChip>

            <h2
              id="universe-heading"
              className="font-heading font-extrabold text-[#2D2D2D] text-balance tracking-tight"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                lineHeight: 0.98,
              }}
            >
              {UNIVERSE_SECTION.headline}
            </h2>

            <p className="text-[#6B6B6B] text-lg leading-relaxed max-w-lg">
              {UNIVERSE_SECTION.subheadline}
            </p>

            {/* 2x2 feature micro-cards */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {UNIVERSE_SECTION.features.map((feature) => {
                const Icon = FEATURE_ICONS[feature.iconName];
                return (
                  <li
                    key={feature.label}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E5E5E0] shadow-sm"
                  >
                    {Icon && (
                      <Icon
                        size={20}
                        className="text-[#E94B3C] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-[#2D2D2D] text-sm leading-snug">
                        {feature.label}
                      </p>
                      <p className="text-[#6B6B6B] text-xs mt-0.5 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2">
              <Link
                href={UNIVERSE_SECTION.ctaHref}
                className={
                  buttonVariants({ size: "lg" }) +
                  " bg-[#2D2D2D] hover:bg-[#1a1a1a] text-white font-semibold px-8 py-3 rounded-lg min-h-[52px] transition-all duration-150 hover:scale-[1.02]"
                }
              >
                {UNIVERSE_SECTION.ctaLabel}
              </Link>
            </div>
          </div>

          {/* Right — CardSwap feature stack (6 cols) */}
          <div className="lg:col-span-6">
            <UniverseCardSwap />
          </div>
        </div>
      </div>
    </section>
  );
}
