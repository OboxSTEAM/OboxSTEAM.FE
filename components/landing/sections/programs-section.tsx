"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Star,
  Users,
  Clock,
  UserRound,
  BadgeCheck,
} from "lucide-react";
import AnimatedContent from "@/components/AnimatedContent";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { FEATURED_PROGRAMS } from "@/lib/landing/content";

// Mock enrichment — swap for real API data when backend is ready
const ENRICHMENTS: Record<
  string,
  {
    mentorName: string;
    isVerified: boolean;
    students: number;
    rating: number;
    level: string;
    badge?: string;
  }
> = {
  "robotics-ai": {
    mentorName: "Trần Minh Khoa",
    isVerified: true,
    students: 347,
    rating: 4.9,
    level: "Trung cấp",
    badge: "Phổ biến nhất",
  },
  "green-science": {
    mentorName: "Nguyễn Thị Lan",
    isVerified: true,
    students: 218,
    rating: 4.8,
    level: "Cơ bản",
  },
  "creative-coding": {
    mentorName: "Lê Anh Tú",
    isVerified: false,
    students: 164,
    rating: 4.7,
    level: "Cơ bản",
    badge: "Mới nhất",
  },
  "math-logic": {
    mentorName: "Phạm Văn Đức",
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

const META_ICON_CLASS =
  "shrink-0 text-white/35 group-hover:text-white/50 transition-colors";

export function ProgramsSection() {
  return (
    <section
      id="programs"
      className="relative py-20 lg:py-28 bg-[#1A1A1A] overflow-hidden"
      aria-labelledby="programs-heading"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(233,75,60,0.12) 0%, transparent 68%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(79,195,247,0.08) 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={30} duration={0.6}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 lg:mb-12">
            <div className="max-w-xl">
              <EyebrowChip dark className="mb-3">
                Chương trình nổi bật
              </EyebrowChip>
              <h2
                id="programs-heading"
                className="font-heading font-extrabold text-white text-balance tracking-tight leading-[0.97]"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
              >
                Khám phá STEAM.
              </h2>
              <p className="mt-3 text-white/50 text-sm sm:text-base leading-relaxed">
                Chọn khóa học, gặp giảng viên — bắt đầu từ một câu hỏi nhỏ.
              </p>
            </div>
            <Link
              href="/courses"
              className="flex items-center gap-1.5 text-sm font-medium text-white/45 hover:text-white hover:gap-2.5 transition-all duration-150 shrink-0"
            >
              Xem tất cả <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </AnimatedContent>

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
                  className="group flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-[#252525] hover:-translate-y-1 hover:border-white/16 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-200 cursor-pointer"
                  style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.25)" }}
                  aria-label={program.title}
                >
                  <div className="relative aspect-video overflow-hidden bg-[#141414] shrink-0">
                    {program.imageSrc && (
                      <Image
                        src={program.imageSrc}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                    <div
                      className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-transparent"
                      aria-hidden="true"
                    />
                    {enrich?.badge && (
                      <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/95 text-[#2D2D2D] shadow-sm">
                        {enrich.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 p-3.5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                      {CATEGORY_LABELS[program.category] ?? program.category}
                    </p>

                    <h3 className="font-heading font-semibold text-white text-[0.9375rem] leading-snug line-clamp-2 group-hover:text-[#FDD835] transition-colors duration-150">
                      {program.title}
                    </h3>

                    {enrich && (
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-white/45">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Star
                            size={11}
                            className="fill-[#FDD835] text-[#FDD835] shrink-0"
                            aria-hidden="true"
                          />
                          <span className="font-semibold text-white/85">
                            {enrich.rating.toFixed(1)}
                          </span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1"
                          aria-label={`${enrich.students.toLocaleString("vi-VN")} học viên`}
                        >
                          <Users size={11} className={META_ICON_CLASS} aria-hidden="true" />
                          {enrich.students.toLocaleString("vi-VN")}
                        </span>
                        <span className="px-1.5 py-px rounded-md bg-white/8 text-[10px] font-medium text-white/70">
                          {enrich.level}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-[10px] text-white/35">
                      <Clock size={10} className={META_ICON_CLASS} aria-hidden="true" />
                      <span>
                        {program.duration}
                        <span aria-hidden="true"> · </span>
                        {program.ageGroup}
                      </span>
                    </div>

                    {enrich && (
                      <div className="flex items-center gap-1.5 pt-1 border-t border-white/8 text-[11px] text-white/70">
                        <UserRound size={11} className={META_ICON_CLASS} aria-hidden="true" />
                        <span className="truncate font-medium text-white/80">
                          {enrich.mentorName}
                        </span>
                        {enrich.isVerified && (
                          <BadgeCheck
                            size={12}
                            className="shrink-0 text-[#4FC3F7]"
                            aria-label="Giảng viên đã xác thực"
                          />
                        )}
                      </div>
                    )}
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
