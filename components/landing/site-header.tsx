"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/use-auth-session";
import { SITE, NAV_LINKS } from "@/lib/landing/content";
import { cn } from "@/lib/utils";

import { UserAccountMenu } from "./user-account-menu";

export function SiteHeader() {
  const { session, isAuthenticated } = useAuthSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };
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
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between gap-6 sm:h-20">
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0"
            aria-label="OboxSTEAM trang chủ"
          >
            <Image
              src={SITE.logoUrl}
              alt="OboxSTEAM logo"
              width={44}
              height={44}
              className={cn(
                "size-10 object-contain transition-[filter] duration-200 sm:size-11",
                scrolled ? "" : "brightness-0 invert",
              )}
              priority
            />
            <span
              className={cn(
                "font-heading hidden text-lg font-bold leading-none tracking-tight transition-colors duration-200 sm:block sm:text-xl",
                scrolled ? "text-[#2D2D2D]" : "text-white",
              )}
            >
              OboxSTEAM
            </span>
          </Link>

          <nav
            className="hidden items-center gap-0.5 md:flex"
            aria-label="Menu chính"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-h-[48px] items-center rounded-lg px-3.5 py-2 text-base font-medium transition-colors duration-150",
                  scrolled
                    ? "text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]"
                    : "text-white/85 hover:bg-white/10 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            {isAuthenticated && session ? (
              <UserAccountMenu session={session} scrolled={scrolled} />
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    "flex min-h-[48px] items-center px-3.5 py-2 text-base font-medium transition-colors duration-150",
                    scrolled
                      ? "text-[#6B6B6B] hover:text-[#2D2D2D]"
                      : "text-white/85 hover:text-white",
                  )}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "min-h-[48px] rounded-lg bg-[#E94B3C] px-6 text-base text-white shadow-md shadow-[#E94B3C]/25 hover:bg-[#d43e30]",
                  )}
                >
                  Đăng ký miễn phí
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className={cn(
              "flex size-12 items-center justify-center rounded-lg transition-colors duration-150 md:hidden",
              scrolled
                ? "text-[#2D2D2D] hover:bg-[#F5F5F0]"
                : "text-white hover:bg-white/10",
            )}
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#E5E5E0] bg-[#FAFAF5] shadow-lg md:hidden">
          <nav className="flex flex-col gap-1 p-4" aria-label="Menu di động">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-[48px] items-center rounded-lg px-4 py-3 text-lg font-medium text-[#2D2D2D] transition-colors hover:bg-[#F5F5F0]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {isAuthenticated && session ? (
                <div className="flex justify-center py-3">
                  <UserAccountMenu session={session} scrolled />
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex min-h-[48px] items-center justify-center rounded-lg px-4 py-3 text-lg font-medium text-[#6B6B6B] transition-colors hover:bg-[#F5F5F0]"
                    onClick={() => setMobileOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "min-h-[48px] w-full justify-center rounded-lg bg-[#E94B3C] text-base text-white hover:bg-[#d43e30]",
                    )}
                  >
                    Đăng ký miễn phí
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
