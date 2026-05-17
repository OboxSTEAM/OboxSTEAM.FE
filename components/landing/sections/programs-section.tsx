"use client";

import Link from "next/link";
import Image from "next/image";
import AnimatedContent from "@/components/AnimatedContent";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { FEATURED_PROGRAMS } from "@/lib/landing/content";
import { ArrowRight } from "lucide-react";

export function ProgramsSection() {
  return (
    <section
      id="programs"
      className="py-16 lg:py-20 bg-[#2D2D2D]"
      aria-labelledby="programs-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedContent distance={30} duration={0.6}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <EyebrowChip dark className="mb-3">Chương trình nổi bật</EyebrowChip>
              <h2
                id="programs-heading"
                className="font-heading font-extrabold text-white tracking-tight leading-[0.97]"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
              >
                Khám phá STEAM.
              </h2>
            </div>
            <Link
              href="/courses"
              className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white hover:gap-2.5 transition-all duration-150 shrink-0"
            >
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
        </AnimatedContent>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURED_PROGRAMS.map((program, i) => (
            <AnimatedContent
              key={program.id}
              distance={30}
              duration={0.55}
              delay={i * 0.08}
            >
              <Link
                href={`/courses/${program.id}`}
                className="group flex flex-col rounded-xl overflow-hidden bg-[#1e1e1e] hover:bg-[#252525] border border-white/6 hover:border-white/12 transition-all duration-200 cursor-pointer"
                aria-label={program.title}
              >
                {/* Thumbnail — 16:9 */}
                <div className="relative aspect-video overflow-hidden bg-[#141414] shrink-0">
                  {program.imageSrc && (
                    <Image
                      src={program.imageSrc}
                      alt={program.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-400 group-hover:scale-[1.03]"
                    />
                  )}
                </div>

                {/* Content below image */}
                <div className="flex flex-col gap-2 p-4">
                  {/* Category label */}
                  <p className="text-[11px] font-medium text-white/40 uppercase tracking-[0.12em]">
                    {program.category}
                  </p>

                  {/* Title */}
                  <h3 className="font-heading font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-white/90 transition-colors duration-150">
                    {program.title}
                  </h3>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-white/35">
                    <span>{program.duration}</span>
                    <span aria-hidden="true">·</span>
                    <span>{program.ageGroup}</span>
                  </div>
                </div>
              </Link>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
