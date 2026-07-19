import type { HeroTextSlotId } from "@/lib/portfolio/theme-presets";
import { cn } from "@/lib/utils";

/** Tuned ReactBits timings for portfolio hero text — single source of truth. */
export const HERO_MOTION = {
  trueFocus: {
    animationDuration: 0.65,
    pauseBetweenAnimations: 1.85,
    blurAmount: 4,
  },
  splitText: {
    delay: 42,
    duration: 1.05,
    ease: "power3.out" as const,
  },
  decrypted: {
    speed: 42,
    maxIterations: 12,
  },
  blurText: {
    delay: 110,
    stepDuration: 0.28,
  },
  shinyText: {
    speed: 2.35,
  },
  gradientText: {
    animationSpeed: 5.5,
  },
} as const;

export type HeroAvatarPlacement =
  | "right"
  | "top-left"
  | "right-large"
  | "right-play"
  | "right-small";

export type HeroDecoration =
  | "none"
  | "hairline"
  | "corner-ticks"
  | "accent-block"
  | "paper-grain";

export type HeroStyleDescriptor = {
  id: HeroTextSlotId;
  label: string;
  /** Outer section chrome. */
  containerClass: string;
  coverHeightClass: string;
  /** Content + avatar row. */
  bodyClass: string;
  contentClass: string;
  avatarPlacement: HeroAvatarPlacement;
  avatarClass: string;
  avatarRing: "soft" | "double" | "circle" | "id-card" | "play";
  eyebrowClass: string;
  nameClass: string;
  headlineClass: string;
  taglineClass: string;
  decoration: HeroDecoration;
};

export const HERO_STYLES: Record<HeroTextSlotId, HeroStyleDescriptor> = {
  SplitGradient: {
    id: "SplitGradient",
    label: "Editorial Split",
    containerClass: "rounded-[1.75rem] ring-1 ring-black/5",
    coverHeightClass: "h-36 sm:h-44",
    bodyClass:
      "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8",
    contentClass: "min-w-0 max-w-2xl flex-1",
    avatarPlacement: "right-large",
    avatarClass: "h-28 w-28 sm:h-36 sm:w-36",
    avatarRing: "double",
    eyebrowClass: "tracking-[0.2em]",
    nameClass:
      "text-3xl font-extrabold tracking-tighter sm:text-5xl leading-none",
    headlineClass: "mt-2 text-lg font-semibold sm:text-xl",
    taglineClass: "mt-3 text-sm leading-relaxed sm:text-base",
    decoration: "none",
  },
  TrueFocus: {
    id: "TrueFocus",
    label: "Editorial Ink",
    containerClass: "rounded-[1.25rem]",
    coverHeightClass: "h-28 sm:h-32",
    bodyClass: "flex flex-col gap-8",
    contentClass: "min-w-0 max-w-3xl",
    avatarPlacement: "top-left",
    avatarClass: "h-16 w-16 sm:h-20 sm:w-20",
    avatarRing: "circle",
    eyebrowClass: "tracking-[0.22em]",
    nameClass:
      "text-3xl font-extrabold tracking-tighter sm:text-4xl underline decoration-2 underline-offset-8",
    headlineClass: "mt-3 text-base font-medium sm:text-lg",
    taglineClass: "mt-4 max-w-xl text-sm leading-relaxed",
    decoration: "paper-grain",
  },
  Decrypted: {
    id: "Decrypted",
    label: "Neo Lab",
    containerClass: "rounded-xl ring-1 ring-white/10",
    coverHeightClass: "h-24 sm:h-28",
    bodyClass:
      "flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between",
    contentClass: "min-w-0 max-w-2xl flex-1",
    avatarPlacement: "right",
    avatarClass: "h-24 w-24 sm:h-28 sm:w-28",
    avatarRing: "id-card",
    eyebrowClass: "font-mono tracking-[0.28em]",
    nameClass: "font-mono text-2xl font-bold tracking-[0.06em] sm:text-4xl",
    headlineClass: "mt-2 font-mono text-sm opacity-80 sm:text-base",
    taglineClass: "mt-3 font-mono text-xs leading-relaxed opacity-75",
    decoration: "corner-ticks",
  },
  BlurShiny: {
    id: "BlurShiny",
    label: "Studio Play",
    containerClass: "rounded-[2rem]",
    coverHeightClass: "h-32 sm:h-40",
    bodyClass:
      "relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
    contentClass: "relative z-[1] min-w-0 max-w-2xl flex-1",
    avatarPlacement: "right-play",
    avatarClass: "h-28 w-28 sm:h-32 sm:w-32",
    avatarRing: "play",
    eyebrowClass: "tracking-[0.16em]",
    nameClass: "text-3xl font-extrabold italic tracking-wide sm:text-4xl",
    headlineClass: "mt-2 text-lg font-medium",
    taglineClass: "mt-3 text-sm leading-relaxed",
    decoration: "accent-block",
  },
  Plain: {
    id: "Plain",
    label: "Quiet Minimal",
    containerClass: "rounded-none sm:rounded-2xl",
    coverHeightClass: "h-24 sm:h-28",
    bodyClass:
      "flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between",
    contentClass: "min-w-0 max-w-xl flex-1",
    avatarPlacement: "right-small",
    avatarClass: "h-20 w-20 sm:h-24 sm:w-24",
    avatarRing: "soft",
    eyebrowClass: "tracking-[0.2em]",
    nameClass: "text-2xl font-semibold tracking-tight sm:text-3xl",
    headlineClass: "mt-2 text-base font-medium opacity-80",
    taglineClass: "mt-4 text-sm leading-relaxed opacity-70",
    decoration: "hairline",
  },
};

export function getHeroStyle(slot: HeroTextSlotId): HeroStyleDescriptor {
  return HERO_STYLES[slot] ?? HERO_STYLES.Plain;
}

export function heroSurfaceClass(
  slot: HeroTextSlotId,
  isDark: boolean,
): string {
  const style = getHeroStyle(slot);
  return cn(
    "relative overflow-hidden",
    style.containerClass,
    isDark ? "bg-[#1a1a1a]/90" : "bg-white/92",
    slot === "TrueFocus" && !isDark && "bg-[#FDFBF7]/95",
    slot === "Plain" && !isDark && "bg-transparent sm:bg-white/70",
    slot === "Decrypted" && isDark && "bg-[#121212]/95",
    slot === "BlurShiny" && !isDark && "bg-white/85",
  );
}

export function heroPaddingClass(compact?: boolean): string {
  return compact ? "p-5 sm:p-6" : "p-5 sm:p-6 lg:p-8";
}
