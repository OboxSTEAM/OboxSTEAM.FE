"use client";

import AnimatedContent from "@/components/AnimatedContent";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { TESTIMONIALS } from "@/lib/landing/content";

export function TestimonialsSection() {
  return (
    <section
      className="py-20 lg:py-28 bg-[#FAFAF5]"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={30} duration={0.6}>
          <div className="text-center mb-14">
            <EyebrowChip className="mb-4">Phụ huynh & Mentor nói gì</EyebrowChip>
            <h2
              id="testimonials-heading"
              className="font-heading font-extrabold text-[#2D2D2D] text-balance"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.75rem)" }}
            >
              Những hành trình đáng nhớ
            </h2>
          </div>
        </AnimatedContent>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <AnimatedContent
              key={i}
              distance={40}
              duration={0.7}
              delay={i * 0.12}
            >
              <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                {/* Stars */}
                <div className="flex gap-1" aria-label="5 sao">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <svg
                      key={si}
                      className="w-4 h-4 fill-[#FDD835]"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-[#2D2D2D] text-sm leading-relaxed flex-1 italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-[#E5E5E0]">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-10 h-10 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-semibold text-[#2D2D2D] text-sm">{t.author}</p>
                    <p className="text-[#6B6B6B] text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
