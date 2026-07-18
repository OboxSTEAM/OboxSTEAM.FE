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

const FONT_SCALE_CLASS: Record<PortfolioFontScale, string> = {
  Sm: "text-[0.92em]",
  Base: "text-[1em]",
  Lg: "text-[1.06em]",
  Xl: "text-[1.14em]",
};

const LINE_HEIGHT_CLASS: Record<PortfolioLineHeight, string> = {
  Tight: "leading-snug",
  Normal: "leading-normal",
  Relaxed: "leading-relaxed",
};

const DENSITY_GAP_CLASS: Record<PortfolioDensity, string> = {
  Compact: "space-y-6",
  Cozy: "space-y-8",
  Spacious: "space-y-12",
};

const CARD_SURFACE_CLASS: Record<PortfolioCardStyle, string> = {
  Outline: "border border-[#E5E5E0] bg-white shadow-none",
  Soft: "border-0 bg-[#F5F5F0] shadow-none",
  Elevated: "border border-[#E5E5E0]/80 bg-white shadow-[0_12px_28px_rgba(45,45,45,0.08)]",
};

const DARK_CARD_SURFACE_CLASS: Record<PortfolioCardStyle, string> = {
  Outline: "border border-[#FAFAF5]/14 bg-[#1a1a1a] shadow-none",
  Soft: "border-0 bg-[#222222] shadow-none",
  Elevated:
    "border border-[#FAFAF5]/12 bg-[#1a1a1a] shadow-[0_12px_28px_rgba(0,0,0,0.35)]",
};

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

  return {
    preset,
    templateId,
    overrides,
    background,
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
    backgroundStyle,
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
