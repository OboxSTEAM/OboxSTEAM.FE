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
      className="relative h-[420px] w-full sm:h-[480px] lg:h-[560px]"
      aria-label="Tính năng AI Portfolio"
      role="region"
    >
      <CardSwap
        width={460}
        height={360}
        cardDistance={64}
        verticalDistance={74}
        delay={2400}
        pauseOnHover
        skewAmount={5}
        easing="elastic"
      >
        {UNIVERSE_SECTION.features.map((feature) => {
          const Icon = FEATURE_ICONS[feature.iconName];

          return (
            <Card
              key={feature.label}
              customClass="!bg-white !border-[#E5E5E0] shadow-2xl"
              className="flex flex-col justify-between p-7 sm:p-8"
            >
              <div className="flex items-start gap-4">
                {Icon ? (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5F5F0]">
                    <Icon
                      size={24}
                      className="text-[#E94B3C]"
                      aria-hidden="true"
                    />
                  </span>
                ) : null}
                <div className="min-w-0">
                  <p className="font-heading text-xl font-bold leading-snug text-[#2D2D2D] sm:text-2xl">
                    {feature.label}
                  </p>
                  <p className="mt-2.5 text-base leading-relaxed text-[#6B6B6B]">
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
