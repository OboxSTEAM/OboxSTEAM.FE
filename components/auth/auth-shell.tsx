"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { SITE } from "@/lib/landing/content";
import {
  AUTH_PAGES,
  type AuthPageKey,
  type AuthPanelContent,
} from "@/lib/auth/content";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  pageKey: AuthPageKey;
  children: React.ReactNode;
};

function resolvePageKey(pathname: string): AuthPageKey {
  if (pathname.includes("/register")) return "register";
  if (pathname.includes("/verify-otp")) return "verify-otp";
  if (pathname.includes("/forgot-password")) return "forgot-password";
  if (pathname.includes("/reset-password")) return "reset-password";
  return "login";
}

function AuthBrandPanel({ panel }: { panel: AuthPanelContent }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative hidden min-h-full w-[42%] overflow-hidden bg-[#0f0f12] lg:block">
      <AnimatePresence mode="wait">
        <motion.div
          key={panel.imageSrc}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={panel.imageSrc}
            alt={panel.imageAlt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 42vw, 0px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
        <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-white/70">
          {panel.panelEyebrow}
        </p>
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
            {panel.panelTitle}
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-white/80">
            {panel.panelDescription}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthShell({ pageKey, children }: AuthShellProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const activeKey = pageKey ?? resolvePageKey(pathname);
  const panel = AUTH_PAGES[activeKey];

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -16 },
        transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-8 sm:px-6">
      <div className="flex w-full max-w-[1080px] min-h-[min(720px,92vh)] overflow-hidden rounded-[28px] bg-white shadow-[0_32px_80px_-12px_rgba(0,0,0,0.45)]">
        <AuthBrandPanel panel={panel} />

        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                className="flex flex-1 flex-col"
                {...motionProps}
              >
                <div className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
                  <Link
                    href="/"
                    className="mb-8 inline-flex items-center gap-2 self-center"
                    aria-label="OboxSTEAM trang chủ"
                  >
                    <Image
                      src={SITE.logoUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                    <span className="font-heading text-lg font-bold text-[#2D2D2D]">
                      {SITE.name}
                    </span>
                  </Link>
                  {children}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthFormHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-8 text-center">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-[2rem]">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">{description}</p>
    </header>
  );
}

export function AuthFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function AuthSubmitButton({
  isLoading,
  children,
  className,
}: {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={cn(
        "flex h-11 w-full items-center justify-center rounded-xl bg-[#2D2D2D] text-sm font-semibold text-white transition-colors hover:bg-[#1a1a1a] disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      {isLoading ? "Đang xử lý…" : children}
    </button>
  );
}

export function AuthFooterLink({
  prompt,
  linkLabel,
  href,
}: {
  prompt: string;
  linkLabel: string;
  href: string;
}) {
  return (
    <p className="mt-8 text-center text-sm text-[#6B6B6B]">
      {prompt}{" "}
      <Link
        href={href}
        className="font-semibold text-[#2D2D2D] underline-offset-4 hover:underline"
      >
        {linkLabel}
      </Link>
    </p>
  );
}

export function AuthAlert({
  variant,
  message,
}: {
  variant: "success" | "error";
  message: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "mb-5 rounded-xl px-4 py-3 text-sm",
        variant === "success"
          ? "bg-[#7CB342]/15 text-[#4a7c23]"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {message}
    </div>
  );
}
