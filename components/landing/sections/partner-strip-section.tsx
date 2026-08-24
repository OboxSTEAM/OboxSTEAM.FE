import Link from "next/link";

import { PARTNER_BRANDS } from "@/lib/landing/content";

export function PartnerStripSection() {
  return (
    <section
      aria-label="Hệ sinh thái STEAM và giáo dục"
      className="relative bg-[#2C2419]"
      style={{
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.15)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
        <p className="sr-only">
          Thương hiệu STEAM và giáo dục liên quan - hiển thị thử bố cục, chưa phải đối tác chính thức.
        </p>
        <ul className="flex flex-nowrap items-center justify-center gap-x-8 sm:gap-x-10 lg:gap-x-14 overflow-x-auto scrollbar-none">
          {PARTNER_BRANDS.map((brand) => (
            <li key={brand.id} className="shrink-0">
              <Link
                href={brand.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={brand.ariaLabel}
                className={`whitespace-nowrap text-[#E8E0D5]/75 hover:text-[#FAFAF5] transition-colors duration-200 text-base sm:text-lg lg:text-xl ${brand.className}`}
              >
                {brand.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
