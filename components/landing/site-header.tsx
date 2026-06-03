"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getAccountRoleLabel } from "@/lib/auth/account-nav";
import { getProfileDisplayName } from "@/lib/auth/profile-display";
import { normalizeAccountRole } from "@/lib/auth/roles";
import { SITE, NAV_LINKS } from "@/lib/landing/content";
import { cn } from "@/lib/utils";

import { UserAccountMenu } from "./user-account-menu";

type SiteHeaderProps = {
  /** Use on inner pages (no dark hero) so nav text stays readable. */
  defaultScrolled?: boolean;
};

export function SiteHeader({ defaultScrolled = false }: SiteHeaderProps) {
  const {
    session,
    profile,
    isAuthenticated,
    isLoading: isProfileLoading,
  } = useCurrentUser();
  const [scrolled, setScrolled] = useState(defaultScrolled);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSolid = defaultScrolled || scrolled;
  const accountRole = normalizeAccountRole(profile?.role ?? session?.user?.role);
  const displayName = profile
    ? getProfileDisplayName(profile)
    : session?.user?.displayName?.trim() ||
      getAccountRoleLabel(accountRole);
  const userCode = profile?.code ?? session?.user?.code;
  const roleLabel = accountRole ? getAccountRoleLabel(accountRole) : null;

  useEffect(() => {
    if (defaultScrolled) return;

    const handler = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [defaultScrolled]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        isSolid
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
                isSolid ? "" : "brightness-0 invert",
              )}
              priority
            />
            <span
              className={cn(
                "font-heading hidden text-lg font-bold leading-none tracking-tight transition-colors duration-200 sm:block sm:text-xl",
                isSolid ? "text-[#2D2D2D]" : "text-white",
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
                  isSolid
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
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "hidden min-w-0 text-right lg:block",
                    isSolid ? "text-[#2D2D2D]" : "text-white",
                  )}
                >
                  <p className="truncate text-sm font-semibold leading-tight">
                    {displayName}
                  </p>
                  {userCode ? (
                    <p
                      className={cn(
                        "truncate text-xs font-medium",
                        isSolid ? "text-[#6B6B6B]" : "text-white/75",
                      )}
                    >
                      {userCode}
                    </p>
                  ) : roleLabel && displayName !== roleLabel ? (
                    <p
                      className={cn(
                        "truncate text-xs font-medium",
                        isSolid ? "text-[#6B6B6B]" : "text-white/75",
                      )}
                    >
                      {roleLabel}
                    </p>
                  ) : isProfileLoading ? (
                    <p
                      className={cn(
                        "text-xs",
                        isSolid ? "text-[#6B6B6B]/60" : "text-white/50",
                      )}
                    >
                      …
                    </p>
                  ) : null}
                </div>
                <UserAccountMenu
                  session={session}
                  profile={profile}
                  scrolled={isSolid}
                />
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    "flex min-h-[48px] items-center px-3.5 py-2 text-base font-medium transition-colors duration-150",
                    isSolid
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
              isSolid
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
            {isAuthenticated && session ? (
              <div className="mb-2 border-b border-[#E5E5E0] px-4 pb-3">
                <p className="text-base font-semibold text-[#2D2D2D]">
                  {displayName}
                </p>
                {userCode ? (
                  <p className="text-sm text-[#6B6B6B]">{userCode}</p>
                ) : null}
              </div>
            ) : null}
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
                  <UserAccountMenu
                    session={session}
                    profile={profile}
                    scrolled
                  />
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
