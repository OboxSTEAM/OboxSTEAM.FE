"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  PenLine,
  ScanFace,
  Video,
  type LucideProps,
} from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UNIVERSE_SECTION, SITE } from "@/lib/landing/content";

type LucideIcon = React.ComponentType<LucideProps>;

const FEATURE_ICONS: Record<string, LucideIcon> = {
  ScanFace,
  Video,
  PenLine,
  Globe,
};

const FEATURE_ACCENTS: Record<string, string> = {
  ScanFace: "#E94B3C",
  Video: "#7CB342",
  PenLine: "#7E57C2",
  Globe: "#4FC3F7",
};

function UniverseFeatureTile({
  iconName,
  label,
  desc,
  hero = false,
}: {
  iconName: string;
  label: string;
  desc: string;
  hero?: boolean;
}) {
  const Icon = FEATURE_ICONS[iconName];
  const accent = FEATURE_ACCENTS[iconName] ?? "#E94B3C";

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E5E5E0] bg-white p-6 shadow-[0_1px_3px_rgba(45,45,45,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(45,45,45,0.1)]",
        hero && "lg:col-span-2 lg:row-span-1",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-[0.07] transition-opacity duration-200 group-hover:opacity-[0.12]"
        style={{ background: accent }}
      />

      <div className="relative flex items-start gap-4">
        {Icon ? (
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accent}18` }}
          >
            <Icon size={22} style={{ color: accent }} aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-bold leading-snug text-[#2D2D2D] sm:text-xl">
            {label}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B] sm:text-base">
            {desc}
          </p>
        </div>
      </div>

      {hero ? (
        <div className="relative mt-6 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6B6B6B]">
            Portfolio URL
          </p>
          <p className="mt-1 font-mono text-sm font-medium text-[#2D2D2D] sm:text-base">
            <span style={{ color: accent }}>ten-hoc-vien</span>
            <span className="text-[#6B6B6B]">.obox.id</span>
          </p>
        </div>
      ) : (
        <div className="relative mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
          <span
            className="size-1.5 rounded-full"
            style={{ background: accent }}
            aria-hidden="true"
          />
          <span>AI Portfolio</span>
        </div>
      )}
    </article>
  );
}

export function UniverseSection() {
  const heroFeature = UNIVERSE_SECTION.features.find(
    (f) => f.iconName === "Globe",
  );
  const compactFeatures = UNIVERSE_SECTION.features.filter(
    (f) => f.iconName !== "Globe",
  );

  return (
    <section
      id="portfolio"
      className="relative overflow-x-clip bg-[#F5F5F0]"
      aria-labelledby="universe-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-8 right-4 z-0 sm:top-10 sm:right-8 lg:top-12 lg:right-12"
      >
        <Image
          src={SITE.logoUrl}
          alt=""
          width={400}
          height={400}
          className="size-56 object-contain opacity-[0.14] saturate-[0.5] sm:size-72 lg:size-96 xl:size-[28rem]"
          sizes="(max-width: 640px) 224px, (max-width: 1024px) 288px, 448px"
          priority={false}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <AnimatedContent distance={30} duration={0.6}>
          <div className="mb-12 flex max-w-3xl flex-col gap-6 lg:mb-16">
            <EyebrowChip className="w-fit">
              {UNIVERSE_SECTION.eyebrow}
            </EyebrowChip>

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

            <p className="max-w-2xl text-lg leading-relaxed text-[#6B6B6B]">
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
        </AnimatedContent>

        <AnimatedContent distance={24} duration={0.65} delay={0.1}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {compactFeatures.map((feature) => (
              <UniverseFeatureTile
                key={feature.label}
                iconName={feature.iconName}
                label={feature.label}
                desc={feature.desc}
              />
            ))}
            {heroFeature ? (
              <UniverseFeatureTile
                iconName={heroFeature.iconName}
                label={heroFeature.label}
                desc={heroFeature.desc}
                hero
              />
            ) : null}
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}
