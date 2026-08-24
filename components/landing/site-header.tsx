"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";

import {
  AccountNavSheet,
  ACCOUNT_NAV_SHEET_ID,
} from "@/components/landing/account-nav-sheet";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getAccountRoleLabel } from "@/lib/auth/account-nav";
import { getProfileDisplayName } from "@/lib/auth/profile-display";
import { normalizeAccountRole } from "@/lib/auth/roles";
import { clearAuthSession } from "@/lib/auth/session";
import { SITE, NAV_LINKS } from "@/lib/landing/content";
import { buildSiteHeaderAccountNavItems } from "@/lib/navigation/account-nav-items";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  /** Use on inner pages (no dark hero) so nav text stays readable. */
  defaultScrolled?: boolean;
  /** Show dark/light toggle — opt-in for learn/portfolio; landing stays off. */
  showThemeToggle?: boolean;
};

function getInitials(displayName: string, email: string): string {
  const source = displayName.trim() || email.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function SiteHeader({
  defaultScrolled = false,
  showThemeToggle = false,
}: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, profile, isAuthenticated } = useCurrentUser();
  const [scrolled, setScrolled] = useState(defaultScrolled);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isSolid = defaultScrolled || scrolled;
  const showLandingNav = pathname === "/";
  const accountRole = normalizeAccountRole(profile?.role ?? session?.user?.role);
  const email = profile?.email ?? session?.user?.email ?? "";
  const displayName = profile
    ? getProfileDisplayName(profile)
    : session?.user?.displayName?.trim() ||
      email.split("@")[0] ||
      getAccountRoleLabel(accountRole);
  const userCode = profile?.code ?? session?.user?.code;
  const roleLabel = accountRole ? getAccountRoleLabel(accountRole) : null;
  const avatarUrl = profile?.avatarUrl ?? session?.user?.avatarUrl;
  const initials = getInitials(displayName, email);

  const accountNavItems = useMemo(
    () =>
      buildSiteHeaderAccountNavItems({
        accountRole,
        onLogout: () => {
          clearAuthSession();
          router.push("/");
        },
      }),
    [accountRole, router],
  );

  useEffect(() => {
    if (defaultScrolled) return;

    const handler = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [defaultScrolled]);

  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open);
    if (open) setMobileOpen(false);
  };

  const panelHeader = (
    <div className="flex items-center gap-3 pr-8">
      <Avatar size="lg" className="ring-2 ring-[#E5E5E0]">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
        <AvatarFallback className="bg-[#E94B3C] text-base font-semibold text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-[#2D2D2D]">
          {displayName}
        </p>
        {userCode ? (
          <p className="truncate text-sm font-medium text-[#6B6B6B]">{userCode}</p>
        ) : roleLabel ? (
          <p className="truncate text-sm font-medium text-[#6B6B6B]">{roleLabel}</p>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          isSolid
            ? "bg-[#FAFAF5]/95 backdrop-blur-md shadow-sm border-b border-[#E5E5E0] dark:bg-[#1A1A1A]/95 dark:border-border"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-14 w-full items-center justify-between gap-4 sm:h-16">
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="OboxSTEAM trang chủ"
            >
              <Image
                src={SITE.logoUrl}
                alt="OboxSTEAM logo"
                width={36}
                height={36}
                className={cn(
                  "size-8 object-contain transition-[filter] duration-200 sm:size-9",
                  isSolid
                    ? "dark:brightness-0 dark:invert"
                    : "brightness-0 invert",
                )}
                priority
              />
              <span
                className={cn(
                  "font-heading hidden text-lg font-bold leading-none tracking-tight transition-colors duration-200 sm:block",
                  isSolid ? "text-[#2D2D2D] dark:text-foreground" : "text-white",
                )}
              >
                OboxSTEAM
              </span>
            </Link>

            {showLandingNav ? (
              <nav
                className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2"
                aria-label="Điều hướng chính"
              >
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                      isSolid
                        ? "text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]"
                        : "text-white/80 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            ) : null}

            <div className="flex items-center gap-1 sm:gap-1.5">
              {showThemeToggle ? (
                <ThemeToggle
                  className={cn(
                    isSolid
                      ? "text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D] dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"
                      : "text-white/85 hover:bg-white/10 hover:text-white",
                  )}
                />
              ) : null}

              {isAuthenticated && session ? (
                <NotificationBell
                  triggerClassName={
                    isSolid
                      ? "text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D] dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  }
                />
              ) : null}

              {isAuthenticated && session ? (
                <button
                  type="button"
                  onClick={() => handleMenuOpenChange(!menuOpen)}
                  aria-expanded={menuOpen}
                  aria-controls={ACCOUNT_NAV_SHEET_ID}
                  aria-haspopup="dialog"
                  aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
                  className={cn(
                    "flex min-h-[48px] items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-2 transition-colors duration-150 sm:pr-3",
                    isSolid
                      ? "hover:bg-[#F5F5F0] dark:hover:bg-muted"
                      : "hover:bg-white/10",
                  )}
                >
                  <Avatar className="size-9 sm:size-10">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName} />
                    ) : null}
                    <AvatarFallback
                      className={cn(
                        "text-sm font-semibold",
                        isSolid
                          ? "bg-[#E94B3C] text-white"
                          : "bg-white/15 text-white backdrop-blur-sm",
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "hidden max-w-[10rem] truncate text-sm font-semibold lg:block",
                      isSolid
                        ? "text-[#2D2D2D] dark:text-foreground"
                        : "text-white",
                    )}
                  >
                    {displayName}
                  </span>
                  {menuOpen ? (
                    <X
                      size={20}
                      className={cn(
                        isSolid
                          ? "text-[#2D2D2D] dark:text-foreground"
                          : "text-white",
                      )}
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronDown
                      size={20}
                      className={cn(
                        isSolid
                          ? "text-[#6B6B6B] dark:text-muted-foreground"
                          : "text-white/80",
                      )}
                      aria-hidden="true"
                    />
                  )}
                </button>
              ) : (
                <>
                  <div className="hidden items-center gap-2 md:flex">
                    <Link
                      href="/login"
                      className={cn(
                        "flex min-h-[44px] items-center px-3 py-2 text-sm font-medium transition-colors duration-150",
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
                        buttonVariants({ size: "default" }),
                        "min-h-[44px] rounded-full bg-[#E94B3C] px-5 text-sm text-white shadow-md shadow-[#E94B3C]/25 hover:bg-[#d43e30]",
                      )}
                    >
                      Đăng ký miễn phí
                    </Link>
                  </div>

                  <button
                    type="button"
                    className={cn(
                      "flex size-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-lg transition-colors duration-150 md:hidden",
                      isSolid
                        ? "text-[#2D2D2D] hover:bg-[#F5F5F0]"
                        : "text-white hover:bg-white/10",
                    )}
                    onClick={() => setMobileOpen((value) => !value)}
                    aria-expanded={mobileOpen}
                    aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
                  >
                    {mobileOpen ? <X size={26} /> : <Menu size={26} />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {mobileOpen && !isAuthenticated ? (
          <div className="border-t border-[#E5E5E0] bg-[#FAFAF5] shadow-lg md:hidden">
            <nav className="flex flex-col gap-1 p-4" aria-label="Menu di động">
              {showLandingNav
                ? NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex min-h-[48px] items-center rounded-lg px-4 py-3 text-base font-medium text-[#6B6B6B] transition-colors hover:bg-[#F5F5F0] hover:text-[#2D2D2D]"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))
                : null}
              <div className="mt-1 flex flex-col gap-2">
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
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      {isAuthenticated && session ? (
        <AccountNavSheet
          open={menuOpen}
          onOpenChange={handleMenuOpenChange}
          header={panelHeader}
          items={accountNavItems}
        />
      ) : null}
    </>
  );
}
