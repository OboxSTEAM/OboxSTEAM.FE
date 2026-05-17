"use client";

import AnimatedContent from "@/components/AnimatedContent";
import TiltedCard from "@/components/TiltedCard";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { STEAM_CATEGORIES } from "@/lib/landing/content";

export function CategoryCardsSection() {
  return (
    <section
      id="steam"
      className="py-20 lg:py-28 bg-[#F5F5F0]"
      aria-labelledby="category-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={30} duration={0.6}>
          <div className="text-center mb-14">
            <EyebrowChip className="mb-4">5 Lĩnh vực</EyebrowChip>
            <h2
              id="category-heading"
              className="font-heading font-extrabold text-[#2D2D2D] text-balance"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Chọn con đường STEAM của bạn
            </h2>
            <p className="mt-4 text-[#6B6B6B] text-lg max-w-xl mx-auto">
              Mỗi lĩnh vực có chương trình riêng, màu sắc riêng và câu chuyện riêng. Hành trình bắt đầu từ sự tò mò.
            </p>
          </div>
        </AnimatedContent>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {STEAM_CATEGORIES.map((cat, i) => (
            <AnimatedContent
              key={cat.key}
              distance={40}
              duration={0.6}
              delay={i * 0.08}
            >
              <div className="flex flex-col items-center gap-3">
                <TiltedCard
                  imageSrc={undefined}
                  altText={cat.label}
                  containerHeight="200px"
                  containerWidth="100%"
                  imageHeight="200px"
                  imageWidth="100%"
                  captionText={cat.label}
                  showMobileWarning={false}
                  rotateAmplitude={10}
                  scaleOnHover={1.05}
                  displayOverlayContent
                  overlayContent={
                    <div
                      className="absolute inset-0 rounded-[15px] flex flex-col items-center justify-center gap-2 p-4"
                      style={{ background: cat.color }}
                    >
                      <span
                        className="font-heading font-extrabold leading-none"
                        style={{ fontSize: "4rem", color: cat.textColor, opacity: 0.15 }}
                      >
                        {cat.letter}
                      </span>
                      <span
                        className="font-heading font-bold text-lg text-center leading-tight z-10 relative"
                        style={{ color: cat.textColor }}
                      >
                        {cat.label}
                      </span>
                    </div>
                  }
                />
                <p className="text-xs text-[#6B6B6B] text-center leading-relaxed px-1">
                  {cat.description}
                </p>
              </div>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
