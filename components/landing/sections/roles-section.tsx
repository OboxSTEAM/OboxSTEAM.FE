"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import AnimatedContent from "@/components/AnimatedContent";
import SpotlightCard from "@/components/SpotlightCard";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { ImageSlot } from "@/components/common/image-slot";
import { ROLES } from "@/lib/landing/content";

export function RolesSection() {
  return (
    <section
      id="parents"
      className="py-20 lg:py-28 bg-[#F5F5F0]"
      aria-labelledby="roles-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={30} duration={0.6}>
          <div className="text-center mb-14">
            <EyebrowChip className="mb-4">Dành cho bạn</EyebrowChip>
            <h2
              id="roles-heading"
              className="font-heading font-extrabold text-[#2D2D2D] text-balance"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.75rem)" }}
            >
              OboxSTEAM có mặt cho mọi người
            </h2>
            <p className="mt-4 text-[#6B6B6B] text-lg max-w-xl mx-auto">
              Học viên, phụ huynh hay Mentor — nền tảng được thiết kế để hỗ trợ từng vai trò.
            </p>
          </div>
        </AnimatedContent>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLES.map((role, i) => (
            <AnimatedContent
              key={role.key}
              distance={40}
              duration={0.7}
              delay={i * 0.12}
            >
              <SpotlightCard
                spotlightColor={role.spotlightColor}
                className="flex flex-col gap-5 h-full border-[#E5E5E0] bg-white rounded-2xl p-0 overflow-hidden"
              >
                {/* 3:4 portrait slot */}
                <ImageSlot
                  ratio="3:4"
                  alt={role.title}
                  tone={role.tone}
                  className="rounded-none rounded-t-2xl w-full"
                />

                {/* Content */}
                <div className="flex flex-col gap-3 p-6 flex-1">
                  <h3 className="font-heading font-bold text-xl text-[#2D2D2D] leading-snug">
                    {role.title}
                  </h3>
                  <p className="text-[#6B6B6B] text-sm leading-relaxed flex-1">
                    {role.description}
                  </p>
                  <Link
                    href={role.href}
                    className={buttonVariants({ variant: "outline" }) + " border-[#E5E5E0] text-[#2D2D2D] hover:bg-[#F5F5F0] font-semibold rounded-lg min-h-[44px] mt-2 w-full justify-center"}
                  >
                    {role.cta}
                  </Link>
                </div>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
