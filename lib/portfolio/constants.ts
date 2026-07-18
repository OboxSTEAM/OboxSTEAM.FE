/** Curated FE catalog for portfolio theme fields (backend stores free-form / enum strings). */

export const PORTFOLIO_TEMPLATES = [
  {
    id: "aurora-signature",
    label: "Aurora Signature",
    description: "Năng lượng STEAM — gradient sống, thẻ spotlight, gallery vòng tròn.",
  },
  {
    id: "editorial-ink",
    label: "Editorial Ink",
    description: "Tạp chí êm dịu — serif, masonry, typography rõ ràng.",
  },
  {
    id: "neo-lab",
    label: "Neo Lab",
    description: "Lab tối — mono, decrypted text, thẻ tilt + glow.",
  },
  {
    id: "studio-play",
    label: "Studio Play",
    description: "Sáng tạo vui — bounce cards, blur text, carousel.",
  },
  {
    id: "quiet-minimal",
    label: "Quiet Minimal",
    description: "Ít chuyển động — nền nhẹ, thẻ soft, dễ đọc.",
  },
] as const;

export type PortfolioTemplateId = (typeof PORTFOLIO_TEMPLATES)[number]["id"];

/** Legacy template ids → current presets. */
const TEMPLATE_ALIASES: Record<string, PortfolioTemplateId> = {
  aurora: "aurora-signature",
  editorial: "editorial-ink",
  minimal: "quiet-minimal",
};

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
    description: "Một cột, khoảng cách gọn.",
  },
  {
    id: "bento",
    label: "Bento",
    description: "Lưới thẻ với span đa dạng.",
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Trục thời gian cho các mục.",
  },
  {
    id: "masonry",
    label: "Masonry",
    description: "Cột so le kiểu tạp chí.",
  },
] as const;

export type PortfolioLayoutStyleId = (typeof PORTFOLIO_LAYOUT_STYLES)[number]["id"];

export const PORTFOLIO_FONT_SCALES = [
  { id: "Sm" as const, label: "Nhỏ" },
  { id: "Base" as const, label: "Vừa" },
  { id: "Lg" as const, label: "Lớn" },
  { id: "Xl" as const, label: "Rất lớn" },
];

export const PORTFOLIO_LINE_HEIGHTS = [
  { id: "Tight" as const, label: "Chặt" },
  { id: "Normal" as const, label: "Vừa" },
  { id: "Relaxed" as const, label: "Rộng" },
];

export const PORTFOLIO_DENSITIES = [
  { id: "Compact" as const, label: "Gọn" },
  { id: "Cozy" as const, label: "Vừa" },
  { id: "Spacious" as const, label: "Thoáng" },
];

export const PORTFOLIO_BACKGROUND_STYLES = [
  { id: "Plain" as const, label: "Trơn" },
  { id: "Gradient" as const, label: "Gradient" },
  { id: "Pattern" as const, label: "Họa tiết" },
  { id: "Image" as const, label: "Ảnh" },
];

export const PORTFOLIO_CARD_STYLES = [
  { id: "Outline" as const, label: "Viền" },
  { id: "Soft" as const, label: "Mềm" },
  { id: "Elevated" as const, label: "Nổi" },
];

export const PORTFOLIO_ITEM_SPANS = [
  { id: "Single" as const, label: "1 cột" },
  { id: "Wide" as const, label: "Rộng" },
  { id: "Tall" as const, label: "Cao" },
  { id: "Large" as const, label: "Lớn" },
];

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

export const PORTFOLIO_SECTION_KIND_LABELS: Record<string, string> = {
  ProjectsGroup: "Nhóm dự án",
  ActivitiesGroup: "Nhóm hoạt động",
  LinksGroup: "Nhóm liên kết",
  RichText: "Khối văn bản",
  Gallery: "Thư viện ảnh",
  Embed: "Nhúng",
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
  if (!templateId) return PORTFOLIO_TEMPLATES[0].id;
  const aliased = TEMPLATE_ALIASES[templateId];
  if (aliased) return aliased;
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
