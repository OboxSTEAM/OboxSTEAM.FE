"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE, NAV_LINKS } from "@/lib/landing/content";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#FAFAF5]/95 backdrop-blur-md shadow-sm border-b border-[#E5E5E0]"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="OboxSTEAM trang chủ">
            <Image
              src={SITE.logoUrl}
              alt="OboxSTEAM logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="font-heading font-800 text-[1.1rem] text-[#2D2D2D] leading-none tracking-tight hidden sm:block">
              OboxSTEAM
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Menu chính">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#F5F5F0] transition-colors duration-150 min-h-[44px] flex items-center"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#6B6B6B] hover:text-[#2D2D2D] transition-colors px-3 py-2 min-h-[44px] flex items-center"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className={buttonVariants({ size: "sm" }) + " bg-[#E94B3C] hover:bg-[#d43e30] text-white rounded-lg px-5 min-h-[44px]"}
            >
              Đăng ký miễn phí
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-[#2D2D2D] hover:bg-[#F5F5F0] transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden bg-[#FAFAF5] border-t border-[#E5E5E0] shadow-lg">
          <nav className="flex flex-col p-4 gap-1" aria-label="Menu di động">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 rounded-lg text-base font-medium text-[#2D2D2D] hover:bg-[#F5F5F0] transition-colors min-h-[44px] flex items-center"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/login"
                className="px-4 py-3 rounded-lg text-base font-medium text-[#6B6B6B] hover:bg-[#F5F5F0] transition-colors text-center min-h-[44px] flex items-center justify-center"
                onClick={() => setMobileOpen(false)}
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className={buttonVariants() + " bg-[#E94B3C] hover:bg-[#d43e30] text-white rounded-lg min-h-[44px] w-full justify-center"}
              >
                Đăng ký miễn phí
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
