"use client";

import AnimatedContent from "@/components/AnimatedContent";
import { ImageSlot } from "@/components/common/image-slot";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { HOW_IT_WORKS } from "@/lib/landing/content";

export function HowItWorksSection() {
  return (
    <section
      id="about"
      className="py-20 lg:py-28 bg-[#FAFAF5]"
      aria-labelledby="hiw-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={30} duration={0.6}>
          <div className="text-center mb-16">
            <EyebrowChip className="mb-4">Cách hoạt động</EyebrowChip>
            <h2
              id="hiw-heading"
              className="font-heading font-extrabold text-[#2D2D2D] text-balance"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Ba bước đến Portfolio du học
            </h2>
            <p className="mt-4 text-[#6B6B6B] text-lg max-w-xl mx-auto">
              Từ lúc đăng ký đến khi Portfolio sẵn sàng gửi trường — OboxSTEAM đồng hành mỗi bước.
            </p>
          </div>
        </AnimatedContent>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {HOW_IT_WORKS.map((step, i) => (
            <AnimatedContent
              key={step.step}
              distance={50}
              duration={0.7}
              delay={i * 0.15}
            >
              <div className="flex flex-col gap-5">
                {/* 16:9 image slot */}
                <div className="relative">
                  <ImageSlot
                    ratio="16:9"
                    alt={step.title}
                    tone={step.tone}
                    className="w-full"
                  />
                  {/* Step number badge */}
                  <div
                    className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm font-bold text-white shadow-md"
                    style={{ background: step.color }}
                  >
                    {step.step}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <span
                    className="font-mono text-xs uppercase tracking-[0.18em] font-medium"
                    style={{ color: step.color }}
                  >
                    {step.label}
                  </span>
                  <h3 className="font-heading font-bold text-xl text-[#2D2D2D] mt-1 mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-[#6B6B6B] text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Connector arrow (not on last) */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/3 translate-x-1/2 text-[#E5E5E0] text-2xl select-none" aria-hidden="true">
                    →
                  </div>
                )}
              </div>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
