"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { SITE } from "@/lib/landing/content";
import {
  getHeroStyle,
  heroPaddingClass,
  heroSurfaceClass,
  type HeroStyleDescriptor,
} from "@/lib/portfolio/hero-styles";
import type { HeroTextSlotId } from "@/lib/portfolio/theme-presets";
import { cn } from "@/lib/utils";

export function PortfolioHeroEyebrow({
  primaryColor,
  className,
}: {
  primaryColor: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Image
        src={SITE.logoUrl}
        alt=""
        width={22}
        height={22}
        unoptimized
        className="size-[22px] shrink-0 object-contain"
      />
      <p
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: primaryColor }}
      >
        Portfolio STEAM
      </p>
    </div>
  );
}

function CornerTicks({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <span
        className="absolute left-2 top-2 size-3 border-l-2 border-t-2"
        style={{ borderColor: color }}
      />
      <span
        className="absolute right-2 top-2 size-3 border-r-2 border-t-2"
        style={{ borderColor: color }}
      />
      <span
        className="absolute bottom-2 left-2 size-3 border-b-2 border-l-2"
        style={{ borderColor: color }}
      />
      <span
        className="absolute bottom-2 right-2 size-3 border-b-2 border-r-2"
        style={{ borderColor: color }}
      />
    </div>
  );
}

function PaperGrain() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] opacity-[0.035]"
      aria-hidden
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

export function HeroAvatarFrame({
  style,
  primaryColor,
  accentColor,
  name,
  avatarUrl,
  textColor,
  compact,
  children,
}: {
  style: HeroStyleDescriptor;
  primaryColor: string;
  accentColor: string;
  name: string;
  avatarUrl?: string | null;
  textColor: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  const sizeClass = cn(
    style.avatarClass,
    compact && "h-16 w-16 @min-[640px]/pf:h-24 @min-[640px]/pf:w-24",
  );

  const shapeClass =
    style.avatarRing === "circle"
      ? "rounded-full"
      : style.avatarRing === "play"
        ? "rounded-[1.75rem]"
        : style.avatarRing === "id-card"
          ? "rounded-md"
          : style.avatarRing === "double"
            ? "rounded-[1.25rem]"
            : "rounded-2xl";

  const ringStyle =
    style.avatarRing === "double"
      ? {
          boxShadow: `0 0 0 3px ${primaryColor}22, 0 0 0 6px ${primaryColor}`,
        }
      : style.avatarRing === "circle"
        ? { boxShadow: `0 0 0 2px ${primaryColor}` }
        : style.avatarRing === "play"
          ? {
              boxShadow: `0 10px 0 0 ${accentColor}55, 0 16px 28px rgba(45,45,45,0.12)`,
            }
          : style.avatarRing === "id-card"
            ? { boxShadow: `inset 0 0 0 1px ${primaryColor}66` }
            : { boxShadow: `0 0 0 1px ${primaryColor}33` };

  const media = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={name}
      fill
      unoptimized
      className="object-cover"
      sizes="144px"
    />
  ) : (
    <div
      className="flex size-full items-center justify-center text-xl font-bold @min-[640px]/pf:text-3xl"
      style={{
        background: `linear-gradient(145deg, ${primaryColor}, ${accentColor})`,
        color: textColor,
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );

  return (
    <div className="relative shrink-0">
      <div
        className={cn("relative overflow-hidden shadow-lg", sizeClass, shapeClass)}
        style={ringStyle}
      >
        {media}
        {style.avatarRing === "id-card" ? (
          <CornerTicks color={primaryColor} />
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function PortfolioHeroShell({
  slot,
  isDark,
  primaryColor,
  secondaryColor,
  accentColor,
  compact,
  cover,
  eyebrowExtra,
  avatar,
  children,
  className,
}: {
  slot: HeroTextSlotId;
  isDark: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  compact?: boolean;
  cover?: ReactNode;
  eyebrowExtra?: ReactNode;
  avatar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const style = getHeroStyle(slot);

  return (
    <section
      className={cn(heroSurfaceClass(slot, isDark), heroPaddingClass(compact), className)}
      style={{
        boxShadow:
          slot === "Plain"
            ? undefined
            : `inset 0 3px 0 0 ${primaryColor}`,
      }}
    >
      {style.decoration === "paper-grain" ? <PaperGrain /> : null}
      {style.decoration === "corner-ticks" ? (
        <CornerTicks color={primaryColor} />
      ) : null}
      {style.decoration === "accent-block" ? (
        <div
          className="pointer-events-none absolute -right-6 top-16 size-24 rounded-[2rem] opacity-40 @min-[640px]/pf:size-36"
          aria-hidden
          style={{
            background: `linear-gradient(145deg, ${secondaryColor}aa, ${accentColor}66)`,
          }}
        />
      ) : null}

      {cover}

      {style.avatarPlacement === "top-left" && avatar ? (
        <div className="relative z-[1] mb-5">{avatar}</div>
      ) : null}

      <div className={cn("relative z-[1]", style.bodyClass)}>
        <div className={style.contentClass}>
          <div className="flex flex-wrap items-center gap-2">
            <PortfolioHeroEyebrow
              primaryColor={primaryColor}
              className={style.eyebrowClass}
            />
            {eyebrowExtra}
          </div>
          {style.decoration === "hairline" ? (
            <div
              className="mt-3 h-px w-16"
              style={{ backgroundColor: `${primaryColor}55` }}
            />
          ) : null}
          {children}
        </div>
        {style.avatarPlacement !== "top-left" && avatar ? avatar : null}
      </div>
    </section>
  );
}

export function PortfolioHeroCover({
  slot,
  coverImageUrl,
  isDark,
  primaryColor,
  secondaryColor,
  accentColor,
  overlay,
}: {
  slot: HeroTextSlotId;
  coverImageUrl?: string | null;
  isDark: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  overlay?: ReactNode;
}) {
  const style = getHeroStyle(slot);
  const bleed =
    slot === "Plain"
      ? "-mx-4 -mt-4 mb-5 @min-[640px]/pf:-mx-6 @min-[640px]/pf:-mt-6 @min-[1024px]/pf:-mx-8 @min-[1024px]/pf:-mt-8 @min-[640px]/pf:mb-6"
      : "-mx-4 -mt-4 mb-4 @min-[640px]/pf:-mx-6 @min-[640px]/pf:-mt-6 @min-[1024px]/pf:-mx-8 @min-[1024px]/pf:-mt-8 @min-[640px]/pf:mb-5";

  return (
    <div className={cn("relative", bleed)}>
      {coverImageUrl ? (
        <div className={cn("relative overflow-hidden", style.coverHeightClass)}>
          <Image
            src={coverImageUrl}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover",
              slot === "TrueFocus" && "opacity-90",
              slot === "Plain" && "opacity-85",
            )}
            sizes="(max-width: 768px) 100vw, 896px"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-16"
            style={{
              background: `linear-gradient(to top, ${
                isDark ? "#1a1a1a" : slot === "TrueFocus" ? "#FDFBF7" : "#ffffff"
              }ee, transparent)`,
            }}
          />
        </div>
      ) : (
        <div
          className={cn(
            "relative overflow-hidden",
            style.coverHeightClass,
            slot === "Plain" && "opacity-70",
          )}
          style={{
            background:
              slot === "Decrypted"
                ? `repeating-linear-gradient(0deg, transparent, transparent 3px, ${primaryColor}12 3px, ${primaryColor}12 4px), linear-gradient(135deg, ${primaryColor}33, ${accentColor}22)`
                : slot === "TrueFocus"
                  ? `linear-gradient(180deg, ${primaryColor}14, transparent)`
                  : `linear-gradient(135deg, ${primaryColor}55 0%, ${secondaryColor}40 48%, ${accentColor}35 100%)`,
          }}
        />
      )}
      {overlay ? (
        <div className="absolute bottom-2 right-2 z-[2]">{overlay}</div>
      ) : null}
    </div>
  );
}
