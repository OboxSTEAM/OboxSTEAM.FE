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

/**
 * Hero styles use `@container/pf` queries so the device preview frame
 * (not the desktop viewport) drives layout — see PortfolioMicrosite root.
 */
export const HERO_STYLES: Record<HeroTextSlotId, HeroStyleDescriptor> = {
  SplitGradient: {
    id: "SplitGradient",
    label: "Editorial Split",
    containerClass: "rounded-[1.75rem] ring-1 ring-black/5",
    coverHeightClass: "h-28 @min-[640px]/pf:h-44",
    bodyClass:
      "flex flex-col gap-5 @min-[640px]/pf:flex-row @min-[640px]/pf:items-end @min-[640px]/pf:justify-between @min-[640px]/pf:gap-8",
    contentClass: "min-w-0 max-w-2xl flex-1",
    avatarPlacement: "right-large",
    avatarClass: "h-24 w-24 @min-[640px]/pf:h-36 @min-[640px]/pf:w-36",
    avatarRing: "double",
    eyebrowClass: "tracking-[0.2em]",
    nameClass:
      "break-words text-balance text-[1.65rem] font-extrabold leading-[1.15] tracking-tight @min-[640px]/pf:text-5xl @min-[640px]/pf:leading-none @min-[640px]/pf:tracking-tighter",
    headlineClass:
      "mt-2 break-words text-base font-semibold leading-snug @min-[640px]/pf:text-xl",
    taglineClass:
      "mt-3 break-words text-sm leading-relaxed @min-[640px]/pf:text-base",
    decoration: "none",
  },
  TrueFocus: {
    id: "TrueFocus",
    label: "Editorial Ink",
    containerClass: "rounded-[1.25rem]",
    coverHeightClass: "h-24 @min-[640px]/pf:h-32",
    bodyClass: "flex flex-col gap-6 @min-[640px]/pf:gap-8",
    contentClass: "min-w-0 max-w-3xl",
    avatarPlacement: "top-left",
    avatarClass: "h-14 w-14 @min-[640px]/pf:h-20 @min-[640px]/pf:w-20",
    avatarRing: "circle",
    eyebrowClass: "tracking-[0.22em]",
    nameClass:
      "break-words text-balance text-[1.65rem] font-extrabold leading-[1.2] tracking-tight underline decoration-2 underline-offset-4 @min-[640px]/pf:text-4xl @min-[640px]/pf:tracking-tighter @min-[640px]/pf:underline-offset-8",
    headlineClass:
      "mt-3 break-words text-sm font-medium leading-snug @min-[640px]/pf:text-lg",
    taglineClass: "mt-4 max-w-xl break-words text-sm leading-relaxed",
    decoration: "paper-grain",
  },
  Decrypted: {
    id: "Decrypted",
    label: "Neo Lab",
    containerClass: "rounded-xl ring-1 ring-white/10",
    coverHeightClass: "h-20 @min-[640px]/pf:h-28",
    bodyClass:
      "flex flex-col gap-5 @min-[640px]/pf:flex-row @min-[640px]/pf:items-start @min-[640px]/pf:justify-between",
    contentClass: "min-w-0 max-w-2xl flex-1",
    avatarPlacement: "right",
    avatarClass: "h-20 w-20 @min-[640px]/pf:h-28 @min-[640px]/pf:w-28",
    avatarRing: "id-card",
    eyebrowClass: "font-mono tracking-[0.28em]",
    nameClass:
      "break-words font-mono text-xl font-bold leading-snug tracking-[0.04em] @min-[640px]/pf:text-4xl @min-[640px]/pf:tracking-[0.06em]",
    headlineClass:
      "mt-2 break-words font-mono text-sm leading-snug opacity-80 @min-[640px]/pf:text-base",
    taglineClass:
      "mt-3 break-words font-mono text-xs leading-relaxed opacity-75",
    decoration: "corner-ticks",
  },
  BlurShiny: {
    id: "BlurShiny",
    label: "Studio Play",
    containerClass: "rounded-[2rem]",
    coverHeightClass: "h-28 @min-[640px]/pf:h-40",
    bodyClass:
      "relative flex flex-col gap-5 @min-[640px]/pf:flex-row @min-[640px]/pf:items-end @min-[640px]/pf:justify-between",
    contentClass: "relative z-[1] min-w-0 max-w-2xl flex-1",
    avatarPlacement: "right-play",
    avatarClass: "h-24 w-24 @min-[640px]/pf:h-32 @min-[640px]/pf:w-32",
    avatarRing: "play",
    eyebrowClass: "tracking-[0.16em]",
    nameClass:
      "break-words text-balance text-[1.65rem] font-extrabold italic leading-[1.15] tracking-wide @min-[640px]/pf:text-4xl",
    headlineClass: "mt-2 break-words text-base font-medium leading-snug @min-[640px]/pf:text-lg",
    taglineClass: "mt-3 break-words text-sm leading-relaxed",
    decoration: "accent-block",
  },
  Plain: {
    id: "Plain",
    label: "Quiet Minimal",
    containerClass: "rounded-none @min-[640px]/pf:rounded-2xl",
    coverHeightClass: "h-20 @min-[640px]/pf:h-28",
    bodyClass:
      "flex flex-col gap-6 @min-[640px]/pf:flex-row @min-[640px]/pf:items-start @min-[640px]/pf:justify-between @min-[640px]/pf:gap-10",
    contentClass: "min-w-0 max-w-xl flex-1",
    avatarPlacement: "right-small",
    avatarClass: "h-16 w-16 @min-[640px]/pf:h-24 @min-[640px]/pf:w-24",
    avatarRing: "soft",
    eyebrowClass: "tracking-[0.2em]",
    nameClass:
      "break-words text-balance text-[1.65rem] font-semibold leading-[1.2] tracking-tight @min-[640px]/pf:text-3xl",
    headlineClass: "mt-2 break-words text-sm font-medium leading-snug opacity-80 @min-[640px]/pf:text-base",
    taglineClass: "mt-4 break-words text-sm leading-relaxed opacity-70",
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
    slot === "Plain" && !isDark && "bg-transparent @min-[640px]/pf:bg-white/70",
    slot === "Decrypted" && isDark && "bg-[#121212]/95",
    slot === "BlurShiny" && !isDark && "bg-white/85",
  );
}

export function heroPaddingClass(compact?: boolean): string {
  return compact
    ? "p-4 @min-[640px]/pf:p-6"
    : "p-4 @min-[640px]/pf:p-6 @min-[1024px]/pf:p-8";
}
