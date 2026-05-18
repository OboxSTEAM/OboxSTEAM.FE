"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, CheckCircle, Users, ArrowRight } from "lucide-react";
import AnimatedContent from "@/components/AnimatedContent";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { FEATURED_PROGRAMS } from "@/lib/landing/content";

// Mock enrichment — swap for real API data when backend is ready
const ENRICHMENTS: Record<
  string,
  {
    mentorName: string;
    mentorInitials: string;
    isVerified: boolean;
    students: number;
    rating: number;
    level: string;
    badge?: string;
    badgeColor?: string;
  }
> = {
  "robotics-ai": {
    mentorName: "Trần Minh Khoa",
    mentorInitials: "MK",
    isVerified: true,
    students: 347,
    rating: 4.9,
    level: "Trung cấp",
    badge: "Phổ biến nhất",
    badgeColor: "#FDD835",
  },
  "green-science": {
    mentorName: "Nguyễn Thị Lan",
    mentorInitials: "TL",
    isVerified: true,
    students: 218,
    rating: 4.8,
    level: "Cơ bản",
  },
  "creative-coding": {
    mentorName: "Lê Anh Tú",
    mentorInitials: "AT",
    isVerified: false,
    students: 164,
    rating: 4.7,
    level: "Cơ bản",
    badge: "Mới nhất",
    badgeColor: "#4FC3F7",
  },
  "math-logic": {
    mentorName: "Phạm Văn Đức",
    mentorInitials: "VĐ",
    isVerified: true,
    students: 291,
    rating: 4.9,
    level: "Nâng cao",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  science: "Khoa học",
  technology: "Công nghệ",
  engineering: "Kỹ thuật",
  arts: "Nghệ thuật",
  mathematics: "Toán học",
};

export function ProgramsSection() {
  return (
    <section
      id="programs"
      className="relative py-20 lg:py-28 bg-[#2D2D2D] overflow-hidden"
      aria-labelledby="programs-heading"
    >
      {/* Background: dot grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Background: corner ambient glow */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(233,75,60,0.10) 0%, transparent 68%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <AnimatedContent distance={30} duration={0.6}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <EyebrowChip dark className="mb-3">
                Chương trình nổi bật
              </EyebrowChip>
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
              className="flex items-center gap-1.5 text-sm font-medium text-white/45 hover:text-white hover:gap-2.5 transition-all duration-150 shrink-0"
            >
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
        </AnimatedContent>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_PROGRAMS.map((program, i) => {
            const enrich = ENRICHMENTS[program.id];
            return (
              <AnimatedContent
                key={program.id}
                distance={32}
                duration={0.55}
                delay={i * 0.08}
              >
                <Link
                  href={`/courses/${program.id}`}
                  className="group flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-[#1e1e1e] hover:-translate-y-1 hover:border-white/16 transition-all duration-200 cursor-pointer"
                  style={{
                    boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
                  }}
                  aria-label={program.title}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-[#141414] shrink-0">
                    {/* STEAM category color bar — top edge */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[3px] z-10"
                      style={{ background: program.color }}
                    />

                    {program.imageSrc && (
                      <Image
                        src={program.imageSrc}
                        alt={program.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    )}

                    {/* Bottom image gradient for readability */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.52) 0%, transparent 55%)",
                      }}
                    />

                    {/* Optional badge chip */}
                    {enrich?.badge && (
                      <span
                        className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: enrich.badgeColor ?? "#FDD835",
                          color: enrich.badgeColor === "#FDD835" ? "#1e1e1e" : "#ffffff",
                          boxShadow: "0 1px 6px rgba(0,0,0,0.35)",
                        }}
                      >
                        {enrich.badge}
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-4 gap-0">
                    {/* Category dot + label */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: program.color }}
                      />
                      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                        {CATEGORY_LABELS[program.category] ?? program.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-semibold text-white text-[0.9375rem] leading-snug line-clamp-2 group-hover:text-white/90 transition-colors duration-150 mb-3">
                      {program.title}
                    </h3>

                    {/* Rating + students */}
                    {enrich && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <Star
                            size={11}
                            className="fill-[#FDD835] text-[#FDD835]"
                          />
                          <span className="text-[11px] font-semibold text-white/80">
                            {enrich.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-white/20 text-[10px]">·</span>
                        <div className="flex items-center gap-1 text-white/38">
                          <Users size={10} />
                          <span className="text-[11px]">
                            {enrich.students.toLocaleString("vi-VN")} học viên
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="w-full h-px bg-white/8 mb-3" />

                    {/* Instructor row */}
                    {enrich && (
                      <div className="flex items-center gap-2 mb-3">
                        {/* Avatar */}
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-white/90"
                          style={{ background: program.color }}
                        >
                          {enrich.mentorInitials}
                        </div>
                        <span className="text-[11px] text-white/55 truncate flex-1">
                          {enrich.mentorName}
                        </span>
                        {enrich.isVerified && (
                          <CheckCircle
                            size={13}
                            className="text-[#4FC3F7] shrink-0"
                            aria-label="Mentor đã xác thực"
                          />
                        )}
                      </div>
                    )}

                    {/* Divider */}
                    <div className="w-full h-px bg-white/8 mb-3" />

                    {/* Meta: duration · age · level */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-white/32">
                      <span>{program.duration}</span>
                      <span aria-hidden="true">·</span>
                      <span>{program.ageGroup}</span>
                      {enrich?.level && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                            style={{
                              background: `${program.color}22`,
                              color: program.color,
                            }}
                          >
                            {enrich.level}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </AnimatedContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
