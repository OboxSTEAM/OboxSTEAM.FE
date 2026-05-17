"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import AnimatedContent from "@/components/AnimatedContent";
import { CategoryBadge } from "@/components/common/category-badge";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { ImageSlot } from "@/components/common/image-slot";
import { FEATURED_PROGRAMS } from "@/lib/landing/content";
import { ArrowRight, Clock, Users } from "lucide-react";

export function ProgramsSection() {
  return (
    <section
      id="programs"
      className="py-20 lg:py-28 bg-[#FAFAF5]"
      aria-labelledby="programs-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={30} duration={0.6}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <EyebrowChip className="mb-3">Chương trình nổi bật</EyebrowChip>
              <h2
                id="programs-heading"
                className="font-heading font-extrabold text-[#2D2D2D]"
                style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)" }}
              >
                Khám phá các chương trình STEAM
              </h2>
            </div>
            <Link
              href="/courses"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#E94B3C] hover:gap-2.5 transition-all duration-150 shrink-0"
            >
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>
        </AnimatedContent>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_PROGRAMS.map((program, i) => (
            <AnimatedContent
              key={program.id}
              distance={40}
              duration={0.6}
              delay={i * 0.08}
            >
              <Card className="group overflow-hidden border-[#E5E5E0] bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col">
                {/* Top color bar */}
                <div
                  className="h-1.5 w-full shrink-0"
                  style={{ background: program.color }}
                />

                {/* 4:3 thumbnail slot */}
                <ImageSlot
                  ratio="4:3"
                  alt={program.title}
                  tone={program.category}
                  className="rounded-none"
                />

                {/* Content */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <CategoryBadge category={program.category} />
                  <h3 className="font-heading font-bold text-[#2D2D2D] text-base leading-snug">
                    {program.title}
                  </h3>
                  <p className="text-[#6B6B6B] text-sm leading-relaxed flex-1">
                    {program.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[#6B6B6B] pt-1 border-t border-[#E5E5E0]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {program.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {program.ageGroup}
                    </span>
                  </div>
                </div>
              </Card>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
