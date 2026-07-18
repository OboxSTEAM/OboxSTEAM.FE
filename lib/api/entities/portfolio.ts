import { z } from "zod";

/** Map FE PascalCase enum → BE camelCase wire value (`Sm` → `sm`). */
export function toPortfolioEnumWire(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function coercePascalEnum<const T extends readonly [string, ...string[]]>(
  values: T,
  raw: unknown,
): T[number] | unknown {
  if (typeof raw !== "string") return raw;
  const matched = values.find((value) => value.toLowerCase() === raw.toLowerCase());
  return matched ?? raw;
}

export const portfolioPlanTypeSchema = z.enum(["Standard", "Premium"]);

export const portfolioItemTypeSchema = z.enum([
  "CapstoneProject",
  "InternalCertificate",
  "ExternalCert",
  "Hobby",
  "Extracurricular",
  "Project",
  "HighlightReel",
]);

export const portfolioItemSourceSchema = z.enum(["AutoImported", "StudentEdited"]);

export const PORTFOLIO_FONT_SCALE_VALUES = ["Sm", "Base", "Lg", "Xl"] as const;
export const PORTFOLIO_LINE_HEIGHT_VALUES = ["Tight", "Normal", "Relaxed"] as const;
export const PORTFOLIO_DENSITY_VALUES = ["Compact", "Cozy", "Spacious"] as const;
export const PORTFOLIO_BACKGROUND_STYLE_VALUES = [
  "Plain",
  "Gradient",
  "Pattern",
  "Image",
] as const;
export const PORTFOLIO_CARD_STYLE_VALUES = ["Outline", "Soft", "Elevated"] as const;
export const PORTFOLIO_ITEM_SPAN_VALUES = ["Single", "Wide", "Tall", "Large"] as const;

export const portfolioFontScaleSchema = z.enum(PORTFOLIO_FONT_SCALE_VALUES);
export const portfolioLineHeightSchema = z.enum(PORTFOLIO_LINE_HEIGHT_VALUES);
export const portfolioDensitySchema = z.enum(PORTFOLIO_DENSITY_VALUES);
export const portfolioBackgroundStyleSchema = z.enum(PORTFOLIO_BACKGROUND_STYLE_VALUES);
export const portfolioCardStyleSchema = z.enum(PORTFOLIO_CARD_STYLE_VALUES);
export const portfolioItemSpanSchema = z.enum(PORTFOLIO_ITEM_SPAN_VALUES);
export const portfolioMediaTypeSchema = z.enum(["Image"]);
export const portfolioSectionKindSchema = z.enum([
  "ProjectsGroup",
  "ActivitiesGroup",
  "LinksGroup",
  "RichText",
  "Gallery",
  "Embed",
]);

/** Per-slot component overrides stored in `theme.settingsJson`. */
export const portfolioThemeSlotOverridesSchema = z
  .object({
    background: z.string().optional(),
    heroText: z.string().optional(),
    card: z.string().optional(),
    reveal: z.string().optional(),
    /** `page` = Nền trang drives look; `effect` = Nền hiệu ứng drives look. */
    backgroundMode: z.enum(["page", "effect"]).optional(),
    /** 0–6 discrete typography steps (finer than enum wire values). */
    fontScaleStep: z.number().int().min(0).max(6).optional(),
    lineHeightStep: z.number().int().min(0).max(6).optional(),
  })
  .strict();

/** Gallery (and future) settings stored in `section.settingsJson`. */
export const portfolioSectionSettingsSchema = z
  .object({
    variant: z.string().optional(),
  })
  .passthrough();

export const portfolioThemeSchema = z.object({
  templateId: z.string().nullable(),
  primaryColor: z.string().nullable(),
  secondaryColor: z.string().nullable(),
  fontFamily: z.string().nullable(),
  headingFontFamily: z.string().nullable(),
  fontScale: portfolioFontScaleSchema.nullable(),
  lineHeight: portfolioLineHeightSchema.nullable(),
  density: portfolioDensitySchema.nullable(),
  accentColor: z.string().nullable(),
  backgroundStyle: portfolioBackgroundStyleSchema.nullable(),
  backgroundImageUrl: z.string().nullable(),
  cardStyle: portfolioCardStyleSchema.nullable(),
  layoutStyle: z.string().nullable(),
  settingsJson: z.string().max(2000).nullable(),
  sectionOrder: z.array(z.string()).nullable(),
});

/**
 * Response theme: BE `CamelCaseJsonStringEnumConverter` sends `sm`/`base`/…
 * Coerce to PascalCase before the strict theme schema.
 */
export const portfolioThemeApiSchema = z
  .object({
    templateId: z.string().nullable(),
    primaryColor: z.string().nullable(),
    secondaryColor: z.string().nullable(),
    fontFamily: z.string().nullable(),
    headingFontFamily: z.string().nullable(),
    fontScale: z.string().nullable(),
    lineHeight: z.string().nullable(),
    density: z.string().nullable(),
    accentColor: z.string().nullable(),
    backgroundStyle: z.string().nullable(),
    backgroundImageUrl: z.string().nullable(),
    cardStyle: z.string().nullable(),
    layoutStyle: z.string().nullable(),
    settingsJson: z.string().max(2000).nullable(),
    sectionOrder: z.array(z.string()).nullable(),
  })
  .transform((theme) =>
    portfolioThemeSchema.parse({
      ...theme,
      fontScale: coercePascalEnum(PORTFOLIO_FONT_SCALE_VALUES, theme.fontScale),
      lineHeight: coercePascalEnum(PORTFOLIO_LINE_HEIGHT_VALUES, theme.lineHeight),
      density: coercePascalEnum(PORTFOLIO_DENSITY_VALUES, theme.density),
      backgroundStyle: coercePascalEnum(
        PORTFOLIO_BACKGROUND_STYLE_VALUES,
        theme.backgroundStyle,
      ),
      cardStyle: coercePascalEnum(PORTFOLIO_CARD_STYLE_VALUES, theme.cardStyle),
    }),
  );
export const portfolioLinkSchema = z.object({
  label: z.string().nullable(),
  url: z.string().nullable(),
});

export const portfolioAppendixItemSchema = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  sectionTitle: z.string().nullable(),
  displayOrder: z.number().int(),
  contentText: z.string().nullable(),
  fileUrl: z.string().nullable(),
  assignedGrade: z.number().nullable(),
  milestoneTitle: z.string().nullable(),
});

/** Media asset attached to an item or section (response shape). */
export const portfolioMediaAssetSchema = z.object({
  id: z.string().uuid(),
  url: z.string().nullable(),
  type: portfolioMediaTypeSchema,
  caption: z.string().nullable(),
  displayOrder: z.number().int(),
});

/** Uploaded library asset returned by `/me/media` (includes file metadata). */
export const portfolioMediaUploadSchema = z.object({
  id: z.string().uuid(),
  url: z.string().nullable(),
  type: portfolioMediaTypeSchema,
  fileName: z.string().nullable(),
  contentType: z.string().nullable(),
  sizeBytes: z.number().int(),
  createdAt: z.string(),
});

export const portfolioItemSchema = z.object({
  id: z.string().uuid(),
  itemType: portfolioItemTypeSchema,
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  organization: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  description: z.string().nullable(),
  mentorEndorsement: z.string().nullable(),
  studentEditedBody: z.string().nullable(),
  mediaUrl: z.string().nullable(),
  externalUrl: z.string().nullable(),
  displayOrder: z.number().int(),
  isVisible: z.boolean(),
  source: portfolioItemSourceSchema,
  accentColor: z.string().nullable(),
  isFeatured: z.boolean().nullable(),
  span: z
    .string()
    .nullable()
    .transform((raw) => {
      if (raw == null) return null;
      return portfolioItemSpanSchema.parse(
        coercePascalEnum(PORTFOLIO_ITEM_SPAN_VALUES, raw),
      );
    }),
  mediaAssets: z.array(portfolioMediaAssetSchema).nullable(),
  programId: z.string().uuid().nullable(),
  programName: z.string().nullable(),
  moduleId: z.string().uuid().nullable(),
  moduleName: z.string().nullable(),
  moduleEnrollmentId: z.string().uuid().nullable(),
  submissionId: z.string().uuid().nullable(),
  appendixSections: z.array(portfolioAppendixItemSchema).nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const portfolioSectionSchema = z.object({
  id: z.string().uuid(),
  kind: portfolioSectionKindSchema,
  title: z.string().nullable(),
  displayOrder: z.number().int(),
  isVisible: z.boolean(),
  contentHtml: z.string().nullable(),
  settingsJson: z.string().max(2000).nullable(),
  mediaAssets: z.array(portfolioMediaAssetSchema).nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const portfolioSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable(),
  studentId: z.string().uuid(),
  studentName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  subdomain: z.string().nullable(),
  displayName: z.string().nullable(),
  headline: z.string().nullable(),
  tagline: z.string().nullable(),
  summary: z.string().nullable(),
  planType: portfolioPlanTypeSchema,
  isPublic: z.boolean(),
  lastPublishedAt: z.string().nullable(),
  hasUnpublishedChanges: z.boolean(),
  theme: portfolioThemeApiSchema,
  links: z.array(portfolioLinkSchema).nullable(),
  items: z.array(portfolioItemSchema).nullable(),
  sections: z.array(portfolioSectionSchema).nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const publicPortfolioSchema = z.object({
  subdomain: z.string().nullable(),
  displayName: z.string().nullable(),
  headline: z.string().nullable(),
  tagline: z.string().nullable(),
  summary: z.string().nullable(),
  studentName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  theme: portfolioThemeApiSchema,
  links: z.array(portfolioLinkSchema).nullable(),
  items: z.array(portfolioItemSchema).nullable(),
  sections: z.array(portfolioSectionSchema).nullable(),
});

export const subdomainAvailabilitySchema = z.object({
  subdomain: z.string().nullable(),
  available: z.boolean(),
  reason: z.string().nullable(),
});

export type PortfolioPlanType = z.infer<typeof portfolioPlanTypeSchema>;
export type PortfolioItemType = z.infer<typeof portfolioItemTypeSchema>;
export type PortfolioItemSource = z.infer<typeof portfolioItemSourceSchema>;
export type PortfolioFontScale = z.infer<typeof portfolioFontScaleSchema>;
export type PortfolioLineHeight = z.infer<typeof portfolioLineHeightSchema>;
export type PortfolioDensity = z.infer<typeof portfolioDensitySchema>;
export type PortfolioBackgroundStyle = z.infer<typeof portfolioBackgroundStyleSchema>;
export type PortfolioCardStyle = z.infer<typeof portfolioCardStyleSchema>;
export type PortfolioItemSpan = z.infer<typeof portfolioItemSpanSchema>;
export type PortfolioMediaType = z.infer<typeof portfolioMediaTypeSchema>;
export type PortfolioSectionKind = z.infer<typeof portfolioSectionKindSchema>;
export type PortfolioThemeSlotOverrides = z.infer<typeof portfolioThemeSlotOverridesSchema>;
export type PortfolioSectionSettings = z.infer<typeof portfolioSectionSettingsSchema>;
export type PortfolioTheme = z.infer<typeof portfolioThemeSchema>;
export type PortfolioLink = z.infer<typeof portfolioLinkSchema>;
export type PortfolioAppendixItem = z.infer<typeof portfolioAppendixItemSchema>;
export type PortfolioMediaAsset = z.infer<typeof portfolioMediaAssetSchema>;
export type PortfolioMediaUpload = z.infer<typeof portfolioMediaUploadSchema>;
export type PortfolioItem = z.infer<typeof portfolioItemSchema>;
export type PortfolioSection = z.infer<typeof portfolioSectionSchema>;
export type Portfolio = z.infer<typeof portfolioSchema>;
export type PublicPortfolio = z.infer<typeof publicPortfolioSchema>;
export type SubdomainAvailability = z.infer<typeof subdomainAvailabilitySchema>;

/** Parse `theme.settingsJson` into typed slot overrides; returns null on empty/invalid. */
export function parseThemeSettingsJson(
  settingsJson: string | null | undefined,
): PortfolioThemeSlotOverrides | null {
  if (settingsJson == null || settingsJson.trim() === "") return null;
  try {
    const parsed: unknown = JSON.parse(settingsJson);
    const result = portfolioThemeSlotOverridesSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Serialize slot overrides for `theme.settingsJson` (null when empty). */
export function serializeThemeSettingsJson(
  overrides: PortfolioThemeSlotOverrides | null | undefined,
): string | null {
  if (overrides == null) return null;
  const cleaned = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value != null && value !== ""),
  );
  if (Object.keys(cleaned).length === 0) return null;
  return JSON.stringify(cleaned);
}

/**
 * Map theme enums to BE camelCase wire values before PUT.
 * Response parsing already normalizes camelCase → PascalCase.
 */
export function themeToApiWire(theme: PortfolioTheme) {
  const wire = (value: string | null) =>
    value == null ? null : toPortfolioEnumWire(value);

  return {
    ...theme,
    fontScale: wire(theme.fontScale),
    lineHeight: wire(theme.lineHeight),
    density: wire(theme.density),
    backgroundStyle: wire(theme.backgroundStyle),
    cardStyle: wire(theme.cardStyle),
  };
}

/** Parse `section.settingsJson`; returns null on empty/invalid. */
export function parseSectionSettingsJson(
  settingsJson: string | null | undefined,
): PortfolioSectionSettings | null {
  if (settingsJson == null || settingsJson.trim() === "") return null;
  try {
    const parsed: unknown = JSON.parse(settingsJson);
    const result = portfolioSectionSettingsSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Serialize section settings for `section.settingsJson` (null when empty). */
export function serializeSectionSettingsJson(
  settings: PortfolioSectionSettings | null | undefined,
): string | null {
  if (settings == null) return null;
  const cleaned = Object.fromEntries(
    Object.entries(settings).filter(([, value]) => value != null && value !== ""),
  );
  if (Object.keys(cleaned).length === 0) return null;
  return JSON.stringify(cleaned);
}
