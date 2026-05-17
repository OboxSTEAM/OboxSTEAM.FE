"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import BorderGlow from "@/components/BorderGlow";
import ClickSpark from "@/components/ClickSpark";
import AnimatedContent from "@/components/AnimatedContent";
import { FINAL_CTA } from "@/lib/landing/content";

export function FinalCtaSection() {
  return (
    <section
      className="py-20 lg:py-28 bg-[#F5F5F0]"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={40} duration={0.7}>
          <BorderGlow
            className="p-10 lg:p-16"
            backgroundColor="#ffffff"
            borderRadius={24}
            colors={["#E94B3C", "#4FC3F7", "#7E57C2"]}
            glowColor="10 80 80"
            animated
            fillOpacity={0.3}
          >
            <div className="text-center flex flex-col items-center gap-6">
              {/* Rainbow accent bar */}
              <div
                className="h-1 w-16 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #E94B3C 0%, #7CB342 25%, #4FC3F7 50%, #FDD835 75%, #7E57C2 100%)",
                }}
                aria-hidden="true"
              />

              <h2
                id="cta-heading"
                className="font-heading font-extrabold text-[#2D2D2D] text-balance"
                style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
              >
                {FINAL_CTA.headline}
              </h2>

              <p className="text-[#6B6B6B] text-lg max-w-md">{FINAL_CTA.subheadline}</p>

              <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                <ClickSpark
                  sparkColor="#E94B3C"
                  sparkCount={10}
                  sparkRadius={30}
                  sparkSize={8}
                  duration={500}
                >
                  <Link
                    href="/register"
                    className={buttonVariants({ size: "lg" }) + " bg-[#E94B3C] hover:bg-[#d43e30] text-white font-semibold px-10 py-3 rounded-lg min-h-[52px] text-base transition-all duration-150 hover:scale-[1.02] shadow-lg shadow-[#E94B3C]/20 relative"}
                  >
                    {FINAL_CTA.ctaPrimary.label}
                  </Link>
                </ClickSpark>

                <Link
                  href={FINAL_CTA.ctaSecondary.href}
                  className={buttonVariants({ variant: "outline", size: "lg" }) + " border-[#E5E5E0] text-[#2D2D2D] hover:bg-[#F5F5F0] font-semibold px-8 py-3 rounded-lg min-h-[52px] text-base"}
                >
                  {FINAL_CTA.ctaSecondary.label}
                </Link>
              </div>

              <p className="text-[#6B6B6B] text-xs">
                Không cần thẻ tín dụng · Huỷ bất cứ lúc nào · Hỗ trợ 24/7
              </p>
            </div>
          </BorderGlow>
        </AnimatedContent>
      </div>
    </section>
  );
}
