"use client";

import AnimatedContent from "@/components/AnimatedContent";
import CountUp from "@/components/CountUp";
import { IMPACT_STATS } from "@/lib/landing/content";

const STAT_COLORS = ["#E94B3C", "#7CB342", "#4FC3F7", "#7E57C2"];

export function StatsSection() {
  return (
    <section
      aria-label="Số liệu tác động"
      className="py-16 bg-[#F5F5F0] border-y border-[#E5E5E0]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {IMPACT_STATS.map((stat, i) => (
            <AnimatedContent
              key={stat.label}
              distance={30}
              duration={0.6}
              delay={i * 0.1}
            >
              <div className="flex flex-col items-center text-center gap-1">
                <div
                  className="flex items-baseline gap-0.5 font-heading font-extrabold text-[#2D2D2D]"
                  style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
                >
                  <CountUp
                    to={stat.value}
                    duration={2}
                    delay={0.2}
                    className=""
                  />
                  {stat.suffix && (
                    <span style={{ color: STAT_COLORS[i] }}>{stat.suffix}</span>
                  )}
                </div>
                <p className="text-[#6B6B6B] text-sm font-medium">{stat.label}</p>
                {/* Small color accent line */}
                <div
                  className="h-0.5 w-8 rounded-full mt-1"
                  style={{ background: STAT_COLORS[i] }}
                />
              </div>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
