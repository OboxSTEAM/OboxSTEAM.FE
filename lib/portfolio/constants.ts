/** Curated FE catalog for portfolio theme fields (backend stores free-form strings). */

export const PORTFOLIO_TEMPLATES = [
  {
    id: "aurora",
    label: "Aurora",
    description: "Gradient hero, soft STEAM accents, modern cards.",
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Wide typography, magazine-style sections.",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Clean whitespace, quiet hierarchy.",
  },
] as const;

export type PortfolioTemplateId = (typeof PORTFOLIO_TEMPLATES)[number]["id"];

export const PORTFOLIO_FONTS = [
  {
    id: "nunito",
    label: "Nunito",
    cssFamily: '"Nunito", ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: "inter",
    label: "Inter",
    cssFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: "georgia",
    label: "Georgia",
    cssFamily: "Georgia, 'Times New Roman', serif",
  },
  {
    id: "system",
    label: "System",
    cssFamily: "ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "mono",
    label: "JetBrains Mono",
    cssFamily: '"JetBrains Mono", ui-monospace, monospace',
  },
] as const;

export type PortfolioFontId = (typeof PORTFOLIO_FONTS)[number]["id"];

export const PORTFOLIO_LAYOUT_STYLES = [
  {
    id: "stacked",
    label: "Stacked",
    description: "Single column, generous spacing.",
  },
  {
    id: "bento",
    label: "Bento",
    description: "Card grid with varied spans.",
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Chronological rail for items.",
  },
] as const;

export type PortfolioLayoutStyleId = (typeof PORTFOLIO_LAYOUT_STYLES)[number]["id"];

export const PORTFOLIO_SECTIONS = [
  { id: "profile", label: "Hồ sơ" },
  { id: "projects", label: "Dự án & chứng chỉ" },
  { id: "activities", label: "Hoạt động ngoại khóa" },
  { id: "links", label: "Liên kết" },
] as const;

export type PortfolioSectionId = (typeof PORTFOLIO_SECTIONS)[number]["id"];

export const PORTFOLIO_DEFAULT_SECTION_ORDER: PortfolioSectionId[] = [
  "profile",
  "projects",
  "activities",
  "links",
];

/** STEAM brand swatches for theme color pickers. */
export const PORTFOLIO_COLOR_SWATCHES = [
  { label: "Obox Red", value: "#E94B3C" },
  { label: "Obox Green", value: "#7CB342" },
  { label: "Obox Yellow", value: "#FDD835" },
  { label: "Obox Cyan", value: "#4FC3F7" },
  { label: "Obox Purple", value: "#7E57C2" },
  { label: "Charcoal", value: "#2D2D2D" },
] as const;

export const MANUAL_PORTFOLIO_ITEM_TYPES = [
  "ExternalCert",
  "Hobby",
  "Extracurricular",
  "Project",
] as const;

export const PORTFOLIO_ITEM_TYPE_LABELS: Record<string, string> = {
  CapstoneProject: "Dự án capstone",
  InternalCertificate: "Chứng chỉ nội bộ",
  ExternalCert: "Chứng chỉ bên ngoài",
  Hobby: "Sở thích",
  Extracurricular: "Ngoại khóa",
  Project: "Dự án",
  HighlightReel: "Highlight reel",
};

export const RESERVED_PORTFOLIO_SUBDOMAINS = [
  "www",
  "app",
  "api",
  "admin",
  "mail",
  "cdn",
  "static",
] as const;

export function getPortfolioFontCss(fontId: string | null | undefined): string {
  const match = PORTFOLIO_FONTS.find((font) => font.id === fontId);
  return match?.cssFamily ?? PORTFOLIO_FONTS[0].cssFamily;
}

export function getPortfolioTemplateId(
  templateId: string | null | undefined,
): PortfolioTemplateId {
  const match = PORTFOLIO_TEMPLATES.find((template) => template.id === templateId);
  return match?.id ?? PORTFOLIO_TEMPLATES[0].id;
}

export function getPortfolioLayoutStyleId(
  layoutStyle: string | null | undefined,
): PortfolioLayoutStyleId {
  const match = PORTFOLIO_LAYOUT_STYLES.find((layout) => layout.id === layoutStyle);
  return match?.id ?? PORTFOLIO_LAYOUT_STYLES[0].id;
}

export function normalizeSectionOrder(
  sectionOrder: string[] | null | undefined,
): PortfolioSectionId[] {
  const known = new Set(PORTFOLIO_SECTIONS.map((section) => section.id));
  const fromTheme = (sectionOrder ?? []).filter(
    (id): id is PortfolioSectionId => known.has(id as PortfolioSectionId),
  );
  const missing = PORTFOLIO_DEFAULT_SECTION_ORDER.filter(
    (id) => !fromTheme.includes(id),
  );
  return [...fromTheme, ...missing];
}
