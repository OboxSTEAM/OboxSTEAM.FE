"use client";

import { LogoLoop } from "@/components/LogoLoop";
import { TRUST_PARTNERS } from "@/lib/landing/content";

const partnerLogos = TRUST_PARTNERS.map((name) => ({
  node: (
    <span
      key={name}
      className="font-heading font-bold text-[#2D2D2D]/40 text-base tracking-tight whitespace-nowrap px-2"
    >
      {name}
    </span>
  ),
  title: name,
}));

export function TrustSection() {
  return (
    <section
      aria-label="Đối tác trường học"
      className="py-10 bg-[#FAFAF5] border-y border-[#E5E5E0]"
    >
      <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-[#6B6B6B] mb-6">
        Tin tưởng bởi các trường và tổ chức hàng đầu
      </p>
      <LogoLoop
        logos={partnerLogos}
        speed={60}
        pauseOnHover
        fadeOut
        fadeOutColor="#FAFAF5"
        logoHeight={32}
        gap={48}
        ariaLabel="Danh sách đối tác"
      />
    </section>
  );
}
