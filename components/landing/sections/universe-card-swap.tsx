"use client";

import CardSwap, { Card } from "@/components/CardSwap";
import { UNIVERSE_SECTION } from "@/lib/landing/content";
import { ScanFace, Video, PenLine, Globe, type LucideProps } from "lucide-react";

type LucideIcon = React.ComponentType<LucideProps>;

const FEATURE_ICONS: Record<string, LucideIcon> = {
  ScanFace,
  Video,
  PenLine,
  Globe,
};

export function UniverseCardSwap() {
  return (
    <div
      className="relative h-[460px] w-full overflow-visible sm:h-[520px] lg:h-[620px]"
      aria-label="Tính năng AI Portfolio"
      role="region"
    >
      <CardSwap
        width="100%"
        height={440}
        cardDistance={76}
        verticalDistance={86}
        delay={2400}
        pauseOnHover={false}
        skewAmount={5}
        easing="elastic"
        containerClassName="!right-0 !translate-x-[6%] !translate-y-[8%] max-[1024px]:!translate-x-0 max-[1024px]:!translate-y-[12%] max-[480px]:!scale-[0.88]"
      >
        {UNIVERSE_SECTION.features.map((feature) => {
          const Icon = FEATURE_ICONS[feature.iconName];

          return (
            <Card
              key={feature.label}
              customClass="!bg-white !border-[#E5E5E0] shadow-2xl"
              className="flex flex-col justify-between p-7 sm:p-8 lg:p-9"
            >
              <div className="flex items-start gap-4">
                {Icon ? (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5F5F0] sm:size-14">
                    <Icon
                      size={26}
                      className="text-[#E94B3C]"
                      aria-hidden="true"
                    />
                  </span>
                ) : null}
                <div className="min-w-0">
                  <p className="font-heading text-xl font-bold leading-snug text-[#2D2D2D] sm:text-2xl lg:text-[1.65rem]">
                    {feature.label}
                  </p>
                  <p className="mt-2.5 text-base leading-relaxed text-[#6B6B6B] sm:text-lg">
                    {feature.desc}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                <span className="size-1.5 rounded-full bg-[#E94B3C]" />
                <span>AI Portfolio</span>
              </div>
            </Card>
          );
        })}
      </CardSwap>
    </div>
  );
}
