import type {
  PortfolioBackgroundStyle,
  PortfolioCardStyle,
  PortfolioDensity,
  PortfolioFontScale,
  PortfolioLineHeight,
  PortfolioTheme,
  PortfolioThemeSlotOverrides,
} from "@/lib/api/entities/portfolio";
import { parseThemeSettingsJson } from "@/lib/api/entities/portfolio";
import {
  getPortfolioFontCss,
  getPortfolioLayoutStyleId,
  getPortfolioTemplateId,
  type PortfolioLayoutStyleId,
  type PortfolioTemplateId,
} from "@/lib/portfolio/constants";

export type BackgroundSlotId =
  | "Aurora"
  | "Waves"
  | "DotGrid"
  | "None"
  | "GradientSoft";

export type HeroTextSlotId =
  | "SplitGradient"
  | "TrueFocus"
  | "Decrypted"
  | "BlurShiny"
  | "Plain";

export type CardSlotId =
  | "Spotlight"
  | "Tilted"
  | "Bounce"
  | "StarBorder"
  | "Soft";

export type GallerySlotId =
  | "CircularGallery"
  | "Carousel"
  | "Masonry"
  | "Grid";

export type RevealSlotId = "AnimatedContent" | "FadeContent" | "None";

export type ThemePreset = {
  id: PortfolioTemplateId;
  label: string;
  description: string;
  isDark: boolean;
  background: BackgroundSlotId;
  heroText: HeroTextSlotId;
  card: CardSlotId;
  gallery: GallerySlotId;
  reveal: RevealSlotId;
  layoutStyle: PortfolioLayoutStyleId;
  fontFamily: string;
  headingFontFamily: string;
  fontScale: PortfolioFontScale;
  lineHeight: PortfolioLineHeight;
  density: PortfolioDensity;
  cardStyle: PortfolioCardStyle;
  backgroundStyle: PortfolioBackgroundStyle;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export const THEME_PRESETS: Record<PortfolioTemplateId, ThemePreset> = {
  "aurora-signature": {
    id: "aurora-signature",
    label: "Aurora Signature",
    description: "Năng lượng STEAM — aurora, spotlight, circular gallery.",
    isDark: false,
    background: "Aurora",
    heroText: "SplitGradient",
    card: "Spotlight",
    gallery: "CircularGallery",
    reveal: "AnimatedContent",
    layoutStyle: "bento",
    fontFamily: "nunito",
    headingFontFamily: "nunito",
    fontScale: "Lg",
    lineHeight: "Normal",
    density: "Cozy",
    cardStyle: "Elevated",
    backgroundStyle: "Gradient",
    primaryColor: "#E94B3C",
    secondaryColor: "#4FC3F7",
    accentColor: "#7E57C2",
  },
  "editorial-ink": {
    id: "editorial-ink",
    label: "Editorial Ink",
    description: "Tạp chí êm — serif, tilt cards, masonry.",
    isDark: false,
    background: "GradientSoft",
    heroText: "TrueFocus",
    card: "Tilted",
    gallery: "Masonry",
    reveal: "FadeContent",
    layoutStyle: "masonry",
    fontFamily: "inter",
    headingFontFamily: "georgia",
    fontScale: "Base",
    lineHeight: "Relaxed",
    density: "Spacious",
    cardStyle: "Outline",
    backgroundStyle: "Plain",
    primaryColor: "#2D2D2D",
    secondaryColor: "#E94B3C",
    accentColor: "#7CB342",
  },
  "neo-lab": {
    id: "neo-lab",
    label: "Neo Lab",
    description: "Lab tối — grid, decrypted, star border.",
    isDark: true,
    background: "DotGrid",
    heroText: "Decrypted",
    card: "StarBorder",
    gallery: "Carousel",
    reveal: "AnimatedContent",
    layoutStyle: "bento",
    fontFamily: "mono",
    headingFontFamily: "mono",
    fontScale: "Base",
    lineHeight: "Tight",
    density: "Compact",
    cardStyle: "Elevated",
    backgroundStyle: "Pattern",
    primaryColor: "#4FC3F7",
    secondaryColor: "#7E57C2",
    accentColor: "#7CB342",
  },
  "studio-play": {
    id: "studio-play",
    label: "Studio Play",
    description: "Sáng tạo vui — bounce, blur, carousel.",
    isDark: false,
    background: "Waves",
    heroText: "BlurShiny",
    card: "Bounce",
    gallery: "Carousel",
    reveal: "FadeContent",
    layoutStyle: "stacked",
    fontFamily: "nunito",
    headingFontFamily: "nunito",
    fontScale: "Lg",
    lineHeight: "Normal",
    density: "Cozy",
    cardStyle: "Soft",
    backgroundStyle: "Gradient",
    primaryColor: "#7E57C2",
    secondaryColor: "#FDD835",
    accentColor: "#E94B3C",
  },
  "quiet-minimal": {
    id: "quiet-minimal",
    label: "Quiet Minimal",
    description: "Ít chuyển động — nền nhẹ, thẻ soft.",
    isDark: false,
    background: "None",
    heroText: "Plain",
    card: "Soft",
    gallery: "Grid",
    reveal: "None",
    layoutStyle: "stacked",
    fontFamily: "inter",
    headingFontFamily: "inter",
    fontScale: "Base",
    lineHeight: "Relaxed",
    density: "Spacious",
    cardStyle: "Soft",
    backgroundStyle: "Plain",
    primaryColor: "#2D2D2D",
    secondaryColor: "#6B6B6B",
    accentColor: "#4FC3F7",
  },
};

export const BACKGROUND_SLOT_OPTIONS: Array<{ id: BackgroundSlotId; label: string }> = [
  { id: "Aurora", label: "Aurora" },
  { id: "Waves", label: "Waves" },
  { id: "DotGrid", label: "Dot Grid" },
  { id: "GradientSoft", label: "Gradient mềm" },
  { id: "None", label: "Không" },
];

export const HERO_TEXT_SLOT_OPTIONS: Array<{ id: HeroTextSlotId; label: string }> = [
  { id: "SplitGradient", label: "Split + Gradient" },
  { id: "TrueFocus", label: "True Focus" },
  { id: "Decrypted", label: "Decrypted" },
  { id: "BlurShiny", label: "Blur + Shiny" },
  { id: "Plain", label: "Plain" },
];

export const CARD_SLOT_OPTIONS: Array<{ id: CardSlotId; label: string }> = [
  { id: "Spotlight", label: "Spotlight" },
  { id: "Tilted", label: "Tilted" },
  { id: "Bounce", label: "Bounce" },
  { id: "StarBorder", label: "Star Border" },
  { id: "Soft", label: "Soft" },
];

export const GALLERY_SLOT_OPTIONS: Array<{ id: GallerySlotId; label: string }> = [
  { id: "CircularGallery", label: "Circular" },
  { id: "Carousel", label: "Carousel" },
  { id: "Masonry", label: "Masonry" },
  { id: "Grid", label: "Grid" },
];

export const REVEAL_SLOT_OPTIONS: Array<{ id: RevealSlotId; label: string }> = [
  { id: "AnimatedContent", label: "Animated" },
  { id: "FadeContent", label: "Fade" },
  { id: "None", label: "Không" },
];

export type ResolvedPortfolioTheme = {
  preset: ThemePreset;
  templateId: PortfolioTemplateId;
  overrides: PortfolioThemeSlotOverrides;
  background: BackgroundSlotId;
  heroText: HeroTextSlotId;
  card: CardSlotId;
  gallery: GallerySlotId;
  reveal: RevealSlotId;
  layoutStyle: PortfolioLayoutStyleId;
  fontFamily: string;
  headingFontFamily: string;
  bodyFontCss: string;
  headingFontCss: string;
  fontScale: PortfolioFontScale;
  lineHeight: PortfolioLineHeight;
  density: PortfolioDensity;
  cardStyle: PortfolioCardStyle;
  backgroundStyle: PortfolioBackgroundStyle;
  backgroundImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  isDark: boolean;
  densityGapClass: string;
  fontScaleClass: string;
  lineHeightClass: string;
  cardSurfaceClass: string;
  /** Discrete UI steps 0–6 for cỡ chữ / giãn dòng. */
  fontScaleStep: number;
  lineHeightStep: number;
  /** Which background control group is authoritative. */
  backgroundMode: "page" | "effect";
  /** Applied as inline style for fine-grained slider steps. */
  fontScaleEm: number;
  lineHeightEm: number;
};

function pickOverride<T extends string>(
  override: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  if (override && (allowed as readonly string[]).includes(override)) {
    return override as T;
  }
  return fallback;
}

/** 7-stage font scale (em multipliers). */
export const FONT_SCALE_STEPS = [0.82, 0.88, 0.94, 1, 1.12, 1.24, 1.38] as const;

/** 7-stage line-height multipliers (1.0 → 2.0). */
export const LINE_HEIGHT_STEPS = [1, 1.15, 1.3, 1.45, 1.6, 1.8, 2] as const;

const FONT_SCALE_CLASS: Record<PortfolioFontScale, string> = {
  Sm: "text-[0.88em]",
  Base: "text-[1em]",
  Lg: "text-[1.18em]",
  Xl: "text-[1.38em]",
};

const LINE_HEIGHT_CLASS: Record<PortfolioLineHeight, string> = {
  Tight: "leading-snug",
  Normal: "leading-normal",
  Relaxed: "leading-relaxed",
};

const DENSITY_GAP_CLASS: Record<PortfolioDensity, string> = {
  Compact: "space-y-4",
  Cozy: "space-y-9",
  Spacious: "space-y-16",
};

const CARD_SURFACE_CLASS: Record<PortfolioCardStyle, string> = {
  Outline: "border-2 border-[#D8D8D0] bg-white shadow-none",
  Soft: "border-0 bg-[#F0F0EA] shadow-none",
  Elevated:
    "border border-[#E5E5E0] bg-white shadow-[0_16px_40px_rgba(45,45,45,0.12)]",
};

const DARK_CARD_SURFACE_CLASS: Record<PortfolioCardStyle, string> = {
  Outline: "border-2 border-[#FAFAF5]/22 bg-[#1a1a1a] shadow-none",
  Soft: "border-0 bg-[#262626] shadow-none",
  Elevated:
    "border border-[#FAFAF5]/14 bg-[#1a1a1a] shadow-[0_16px_40px_rgba(0,0,0,0.45)]",
};

export function fontScaleEnumFromStep(step: number): PortfolioFontScale {
  if (step <= 1) return "Sm";
  if (step <= 3) return "Base";
  if (step <= 5) return "Lg";
  return "Xl";
}

export function lineHeightEnumFromStep(step: number): PortfolioLineHeight {
  if (step <= 1) return "Tight";
  if (step <= 4) return "Normal";
  return "Relaxed";
}

export function fontScaleStepFromEnum(scale: PortfolioFontScale): number {
  switch (scale) {
    case "Sm":
      return 1;
    case "Lg":
      return 5;
    case "Xl":
      return 6;
    default:
      return 3;
  }
}

export function lineHeightStepFromEnum(line: PortfolioLineHeight): number {
  switch (line) {
    case "Tight":
      return 1;
    case "Relaxed":
      return 6;
    default:
      return 3;
  }
}

function clampStep(value: number | undefined, fallback: number): number {
  if (value == null || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(6, Math.round(value)));
}

/** Resolver: preset default → per-slot override (settingsJson) → granular theme fields. */
export function resolvePortfolioTheme(theme: PortfolioTheme): ResolvedPortfolioTheme {
  const templateId = getPortfolioTemplateId(theme.templateId);
  const preset = THEME_PRESETS[templateId];
  const overrides = parseThemeSettingsJson(theme.settingsJson) ?? {};

  const background = pickOverride(
    overrides.background,
    BACKGROUND_SLOT_OPTIONS.map((o) => o.id),
    preset.background,
  );
  const heroText = pickOverride(
    overrides.heroText,
    HERO_TEXT_SLOT_OPTIONS.map((o) => o.id),
    preset.heroText,
  );
  const card = pickOverride(
    overrides.card,
    CARD_SLOT_OPTIONS.map((o) => o.id),
    preset.card,
  );
  const reveal = pickOverride(
    overrides.reveal,
    REVEAL_SLOT_OPTIONS.map((o) => o.id),
    preset.reveal,
  );

  const fontFamily = theme.fontFamily || preset.fontFamily;
  const headingFontFamily = theme.headingFontFamily || preset.headingFontFamily;
  const fontScale = theme.fontScale ?? preset.fontScale;
  const lineHeight = theme.lineHeight ?? preset.lineHeight;
  const density = theme.density ?? preset.density;
  const cardStyle = theme.cardStyle ?? preset.cardStyle;
  const backgroundStyle = theme.backgroundStyle ?? preset.backgroundStyle;
  const layoutStyle = getPortfolioLayoutStyleId(
    theme.layoutStyle || preset.layoutStyle,
  );

  const fontScaleStep = clampStep(
    overrides.fontScaleStep,
    fontScaleStepFromEnum(fontScale),
  );
  const lineHeightStep = clampStep(
    overrides.lineHeightStep,
    lineHeightStepFromEnum(lineHeight),
  );

  const derivedMode: "page" | "effect" =
    overrides.backgroundMode ??
    (background !== "None" && backgroundStyle === "Plain" ? "effect" : "page");

  const effectiveBackground =
    derivedMode === "page" ? ("None" as BackgroundSlotId) : background;
  const effectiveBackgroundStyle =
    derivedMode === "effect"
      ? ("Plain" as const)
      : backgroundStyle;

  return {
    preset,
    templateId,
    overrides,
    background: effectiveBackground,
    heroText,
    card,
    gallery: preset.gallery,
    reveal,
    layoutStyle,
    fontFamily,
    headingFontFamily,
    bodyFontCss: getPortfolioFontCss(fontFamily),
    headingFontCss: getPortfolioFontCss(headingFontFamily),
    fontScale,
    lineHeight,
    density,
    cardStyle,
    backgroundStyle: effectiveBackgroundStyle,
    backgroundImageUrl: theme.backgroundImageUrl,
    primaryColor: theme.primaryColor || preset.primaryColor,
    secondaryColor: theme.secondaryColor || preset.secondaryColor,
    accentColor: theme.accentColor || preset.accentColor,
    isDark: preset.isDark,
    densityGapClass: DENSITY_GAP_CLASS[density],
    fontScaleClass: FONT_SCALE_CLASS[fontScale],
    lineHeightClass: LINE_HEIGHT_CLASS[lineHeight],
    cardSurfaceClass: preset.isDark
      ? DARK_CARD_SURFACE_CLASS[cardStyle]
      : CARD_SURFACE_CLASS[cardStyle],
    fontScaleStep,
    lineHeightStep,
    backgroundMode: derivedMode,
    fontScaleEm: FONT_SCALE_STEPS[fontScaleStep] ?? 1,
    lineHeightEm: LINE_HEIGHT_STEPS[lineHeightStep] ?? 1.45,
  };
}

/** Apply preset defaults onto a theme (keeps settingsJson overrides). */
export function applyPresetToTheme(
  theme: PortfolioTheme,
  presetId: PortfolioTemplateId,
): PortfolioTheme {
  const preset = THEME_PRESETS[presetId];
  return {
    ...theme,
    templateId: preset.id,
    primaryColor: preset.primaryColor,
    secondaryColor: preset.secondaryColor,
    accentColor: preset.accentColor,
    fontFamily: preset.fontFamily,
    headingFontFamily: preset.headingFontFamily,
    fontScale: preset.fontScale,
    lineHeight: preset.lineHeight,
    density: preset.density,
    cardStyle: preset.cardStyle,
    backgroundStyle: preset.backgroundStyle,
    layoutStyle: preset.layoutStyle,
  };
}
