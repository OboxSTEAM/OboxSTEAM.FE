import Image from "next/image";
import type { ReactNode } from "react";

import {
  PortfolioBackground,
  PortfolioCardShell,
  PortfolioGallery,
  PortfolioHeroText,
  PortfolioReveal,
  type GalleryImage,
} from "@/components/portfolio/reactbits/slots";
import { RichText } from "@/components/portfolio/render/rich-text";
import type {
  Portfolio,
  PortfolioItem,
  PortfolioLink,
  PortfolioMediaAsset,
  PortfolioSection,
  PortfolioTheme,
  PublicPortfolio,
} from "@/lib/api/entities/portfolio";
import { parseSectionSettingsJson } from "@/lib/api/entities/portfolio";
import {
  normalizeSectionOrder,
  PORTFOLIO_ITEM_TYPE_LABELS,
  type PortfolioSectionId,
} from "@/lib/portfolio/constants";
import {
  GALLERY_SLOT_OPTIONS,
  resolvePortfolioTheme,
  type GallerySlotId,
  type ResolvedPortfolioTheme,
} from "@/lib/portfolio/theme-presets";
import { cn } from "@/lib/utils";

export type PortfolioMicrositeData = {
  displayName: string | null;
  headline: string | null;
  tagline: string | null;
  summary: string | null;
  studentName: string | null;
  avatarUrl: string | null;
  coverImageUrl?: string | null;
  theme: PortfolioTheme;
  links: PortfolioLink[] | null;
  items: PortfolioItem[] | null;
  sections?: PortfolioSection[] | null;
};

export function toPortfolioMicrositeData(
  portfolio: Portfolio | PublicPortfolio | PortfolioMicrositeData,
): PortfolioMicrositeData {
  return {
    displayName: portfolio.displayName,
    headline: portfolio.headline,
    tagline: portfolio.tagline,
    summary: portfolio.summary,
    studentName: portfolio.studentName,
    avatarUrl: portfolio.avatarUrl,
    coverImageUrl: portfolio.coverImageUrl ?? null,
    theme: portfolio.theme,
    links: portfolio.links,
    items: portfolio.items,
    sections: portfolio.sections ?? null,
  };
}

type PortfolioMicrositeProps = {
  data: PortfolioMicrositeData;
  className?: string;
  compact?: boolean;
};

const PROJECT_TYPES = new Set([
  "CapstoneProject",
  "InternalCertificate",
  "ExternalCert",
  "Project",
  "HighlightReel",
]);

const ACTIVITY_TYPES = new Set(["Hobby", "Extracurricular"]);

function visibleItems(items: PortfolioItem[] | null | undefined): PortfolioItem[] {
  return (items ?? [])
    .filter((item) => item.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function visibleSections(
  sections: PortfolioSection[] | null | undefined,
): PortfolioSection[] {
  return (sections ?? [])
    .filter((section) => section.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function hasHtmlTags(value: string): boolean {
  return /<[^>]+>/.test(value);
}

function looksLikeUrl(value: string): boolean {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed);
}

function normalizeEmbedUrl(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function resolveGalleryVariant(
  section: PortfolioSection,
  resolved: ResolvedPortfolioTheme,
): GallerySlotId {
  const settings = parseSectionSettingsJson(section.settingsJson);
  const variant = settings?.variant;
  if (variant && GALLERY_SLOT_OPTIONS.some((option) => option.id === variant)) {
    return variant as GallerySlotId;
  }
  return resolved.gallery;
}

function sectionMediaToGalleryImages(
  mediaAssets: PortfolioMediaAsset[] | null | undefined,
): GalleryImage[] {
  return (mediaAssets ?? [])
    .filter((asset) => Boolean(asset.url))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((asset) => ({
      src: asset.url!,
      alt: asset.caption ?? undefined,
      caption: asset.caption,
    }));
}

function itemSpanClass(
  span: PortfolioItem["span"],
  layoutStyle: ResolvedPortfolioTheme["layoutStyle"],
): string {
  if (layoutStyle !== "bento") return "";
  switch (span) {
    case "Wide":
      return "sm:col-span-2";
    case "Tall":
      return "sm:row-span-2";
    case "Large":
      return "sm:col-span-2 sm:row-span-2";
    default:
      return "";
  }
}

function itemsLayoutClass(
  layoutStyle: ResolvedPortfolioTheme["layoutStyle"],
): string {
  switch (layoutStyle) {
    case "bento":
      return "grid auto-rows-auto gap-4 sm:grid-cols-2";
    case "timeline":
      return "relative space-y-4";
    case "masonry":
      return "columns-1 gap-4 sm:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid";
    default:
      return "space-y-4";
  }
}

function itemMediaSources(item: PortfolioItem): PortfolioMediaAsset[] {
  if (item.mediaAssets?.length) {
    return item.mediaAssets.filter((asset) => Boolean(asset.url));
  }
  if (item.mediaUrl) {
    return [
      {
        id: item.id,
        url: item.mediaUrl,
        type: "Image",
        caption: null,
        displayOrder: 0,
      },
    ];
  }
  return [];
}

function ItemBody({ item, isDark }: { item: PortfolioItem; isDark: boolean }) {
  const content = item.studentEditedBody ?? item.description;
  if (!content) return null;

  if (hasHtmlTags(content)) {
    return <RichText html={content} className="mt-3 text-sm" />;
  }

  return (
    <p
      className={cn(
        "mt-3 text-sm leading-relaxed",
        isDark ? "text-[#FAFAF5]/90" : "text-[#2D2D2D]/90",
      )}
    >
      {content}
    </p>
  );
}

function ItemMediaRow({ assets }: { assets: PortfolioMediaAsset[] }) {
  const sorted = [...assets].sort((a, b) => a.displayOrder - b.displayOrder);
  if (sorted.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sorted.map((asset, index) => (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote media URLs
        <img
          key={asset.id ?? `${asset.url}-${index}`}
          src={asset.url!}
          alt={asset.caption ?? ""}
          className="h-16 w-16 rounded-lg object-cover"
        />
      ))}
    </div>
  );
}

function ItemCard({
  item,
  resolved,
  layoutStyle,
}: {
  item: PortfolioItem;
  resolved: ResolvedPortfolioTheme;
  layoutStyle: ResolvedPortfolioTheme["layoutStyle"];
}) {
  const cardSurface = resolved.cardSurfaceClass;

  return (
    <div className={cn("h-full", itemSpanClass(item.span, layoutStyle))}>
      <PortfolioCardShell
        slot={resolved.card}
        surfaceClass={cardSurface}
        isDark={resolved.isDark}
        accentColor={resolved.primaryColor}
        className="h-full"
      >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.16em]"
          style={{ color: resolved.primaryColor }}
        >
          {PORTFOLIO_ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
        </p>
        {item.isFeatured ? (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: resolved.primaryColor }}
          >
            Nổi bật
          </span>
        ) : null}
      </div>

      <h3
        className={cn(
          "mt-2 text-lg font-semibold tracking-tight",
          resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
        )}
        style={{ fontFamily: resolved.headingFontCss }}
      >
        {item.title ?? "Không có tiêu đề"}
      </h3>

      {item.subtitle || item.organization ? (
        <p
          className={cn(
            "mt-1 text-sm",
            resolved.isDark ? "text-[#FAFAF5]/70" : "text-[#6B6B6B]",
          )}
        >
          {[item.subtitle, item.organization].filter(Boolean).join(" · ")}
        </p>
      ) : null}

      <ItemBody item={item} isDark={resolved.isDark} />
      <ItemMediaRow assets={itemMediaSources(item)} />

      {item.mentorEndorsement ? (
        <blockquote
          className={cn(
            "mt-3 border-l-[3px] pl-3 text-sm italic",
            resolved.isDark ? "text-[#FAFAF5]/75" : "text-[#6B6B6B]",
          )}
          style={{ borderColor: resolved.accentColor }}
        >
          {item.mentorEndorsement}
        </blockquote>
      ) : null}

      {item.externalUrl ? (
        <a
          href={item.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-semibold underline-offset-4 hover:underline"
          style={{ color: resolved.primaryColor }}
        >
          Xem liên kết
        </a>
      ) : null}
      </PortfolioCardShell>
    </div>
  );
}

function SectionHeading({
  title,
  resolved,
}: {
  title: string;
  resolved: ResolvedPortfolioTheme;
}) {
  return (
    <h2
      className={cn(
        "text-xl font-bold tracking-tight",
        resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
      )}
      style={{ fontFamily: resolved.headingFontCss }}
    >
      {title}
    </h2>
  );
}

function ItemsSection({
  title,
  items,
  resolved,
}: {
  title: string;
  items: PortfolioItem[];
  resolved: ResolvedPortfolioTheme;
}) {
  if (items.length === 0) return null;

  const layoutClass = itemsLayoutClass(resolved.layoutStyle);

  return (
    <section className="space-y-4">
      <SectionHeading title={title} resolved={resolved} />
      <div className={layoutClass}>
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            resolved={resolved}
            layoutStyle={resolved.layoutStyle}
          />
        ))}
      </div>
    </section>
  );
}

function LinksSection({
  links,
  resolved,
  title = "Liên kết",
}: {
  links: PortfolioLink[];
  resolved: ResolvedPortfolioTheme;
  title?: string;
}) {
  const visible = links.filter((link) => Boolean(link.url));
  if (visible.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeading title={title} resolved={resolved} />
      <div className="flex flex-wrap gap-2">
        {visible.map((link, index) => {
          const palette = [
            resolved.primaryColor,
            resolved.secondaryColor,
            resolved.accentColor,
          ];
          return (
            <a
              key={`${link.url}-${index}`}
              href={link.url!}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              style={{ backgroundColor: palette[index % palette.length] }}
            >
              {link.label || link.url}
            </a>
          );
        })}
      </div>
    </section>
  );
}

function ProfileSection({
  data,
  resolved,
  compact,
}: {
  data: PortfolioMicrositeData;
  resolved: ResolvedPortfolioTheme;
  compact?: boolean;
}) {
  const name = data.displayName ?? data.studentName ?? "Học viên OboxSTEAM";
  const summaryIsHtml = data.summary ? hasHtmlTags(data.summary) : false;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.5rem]",
        resolved.isDark ? "bg-[#1a1a1a]/80" : "bg-white/80 backdrop-blur-sm",
        compact ? "p-5" : "p-6 sm:p-8",
      )}
      style={{ boxShadow: `inset 0 4px 0 0 ${resolved.primaryColor}` }}
    >
      {data.coverImageUrl ? (
        <div className="relative -mx-6 -mt-6 mb-5 h-36 overflow-hidden sm:-mx-8 sm:-mt-8 sm:h-44">
          <Image
            src={data.coverImageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-16"
            style={{
              background: `linear-gradient(to top, ${resolved.isDark ? "#1a1a1a" : "#ffffff"}ee, transparent)`,
            }}
          />
        </div>
      ) : (
        <div
          className="relative -mx-6 -mt-6 mb-5 h-28 sm:-mx-8 sm:-mt-8 sm:h-36"
          style={{
            background: `linear-gradient(135deg, ${resolved.primaryColor}55 0%, ${resolved.secondaryColor}40 48%, ${resolved.accentColor}35 100%)`,
          }}
        />
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: resolved.primaryColor }}
          >
            Portfolio STEAM
          </p>

          <div className={cn("mt-2", compact && "scale-[0.95] origin-top-left")}>
            <PortfolioHeroText
              slot={resolved.heroText}
              name={name}
              headline={data.headline}
              colors={[
                resolved.primaryColor,
                resolved.accentColor,
                resolved.secondaryColor,
              ]}
            />
          </div>

          {data.tagline ? (
            <p
              className={cn(
                "mt-2 text-sm leading-relaxed",
                resolved.isDark ? "text-[#FAFAF5]/75" : "text-[#6B6B6B]",
              )}
            >
              {data.tagline}
            </p>
          ) : null}

          {data.summary ? (
            summaryIsHtml ? (
              <RichText html={data.summary} className="mt-4 max-w-xl text-sm" />
            ) : (
              <p
                className={cn(
                  "mt-4 max-w-xl text-sm leading-relaxed",
                  resolved.isDark ? "text-[#FAFAF5]/85" : "text-[#2D2D2D]/85",
                )}
              >
                {data.summary}
              </p>
            )
          ) : null}
        </div>

        {data.avatarUrl ? (
          <div
            className={cn(
              "relative shrink-0 overflow-hidden rounded-2xl shadow-lg",
              compact ? "h-20 w-20" : "h-28 w-28 sm:h-32 sm:w-32",
            )}
            style={{ boxShadow: `0 0 0 3px ${resolved.primaryColor}` }}
          >
            <Image
              src={data.avatarUrl}
              alt={name}
              fill
              unoptimized
              className="object-cover"
              sizes={compact ? "80px" : "128px"}
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-2xl font-bold text-white",
              compact ? "h-20 w-20 text-xl" : "h-28 w-28 text-3xl sm:h-32 sm:w-32",
            )}
            style={{
              background: `linear-gradient(145deg, ${resolved.primaryColor}, ${resolved.accentColor})`,
            }}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
    </section>
  );
}

function RichTextSection({
  section,
  resolved,
}: {
  section: PortfolioSection;
  resolved: ResolvedPortfolioTheme;
}) {
  if (!section.contentHtml?.trim()) return null;

  return (
    <section className="space-y-3">
      {section.title ? (
        <SectionHeading title={section.title} resolved={resolved} />
      ) : null}
      <RichText html={section.contentHtml} />
    </section>
  );
}

function GallerySection({
  section,
  resolved,
}: {
  section: PortfolioSection;
  resolved: ResolvedPortfolioTheme;
}) {
  const images = sectionMediaToGalleryImages(section.mediaAssets);
  if (images.length === 0 && !section.title) return null;

  return (
    <section className="space-y-3">
      {section.title ? (
        <SectionHeading title={section.title} resolved={resolved} />
      ) : null}
      <PortfolioGallery
        slot={resolveGalleryVariant(section, resolved)}
        images={images}
      />
    </section>
  );
}

function EmbedSection({
  section,
  resolved,
}: {
  section: PortfolioSection;
  resolved: ResolvedPortfolioTheme;
}) {
  const content = section.contentHtml?.trim();
  if (!content) return null;

  return (
    <section className="space-y-3">
      {section.title ? (
        <SectionHeading title={section.title} resolved={resolved} />
      ) : null}
      {looksLikeUrl(content) ? (
        <div className="space-y-3">
          <iframe
            src={normalizeEmbedUrl(content)}
            title={section.title ?? "Nhúng nội dung"}
            className={cn(
              "h-64 w-full rounded-xl border",
              resolved.isDark ? "border-[#FAFAF5]/15" : "border-[#E5E5E0]",
            )}
          />
          <a
            href={normalizeEmbedUrl(content)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm font-medium text-[#4FC3F7] underline-offset-4 hover:underline"
          >
            Mở liên kết
          </a>
        </div>
      ) : (
        <RichText html={content} />
      )}
    </section>
  );
}

function renderDynamicSection(
  section: PortfolioSection,
  resolved: ResolvedPortfolioTheme,
  projectItems: PortfolioItem[],
  activityItems: PortfolioItem[],
  links: PortfolioLink[],
): ReactNode {
  switch (section.kind) {
    case "ProjectsGroup":
      return (
        <ItemsSection
          title={section.title ?? "Dự án & chứng chỉ"}
          items={projectItems}
          resolved={resolved}
        />
      );
    case "ActivitiesGroup":
      return (
        <ItemsSection
          title={section.title ?? "Hoạt động ngoại khóa"}
          items={activityItems}
          resolved={resolved}
        />
      );
    case "LinksGroup":
      return (
        <LinksSection
          title={section.title ?? "Liên kết"}
          links={links}
          resolved={resolved}
        />
      );
    case "RichText":
      return <RichTextSection section={section} resolved={resolved} />;
    case "Gallery":
      return <GallerySection section={section} resolved={resolved} />;
    case "Embed":
      return <EmbedSection section={section} resolved={resolved} />;
    default:
      return null;
  }
}

export function PortfolioMicrosite({
  data,
  className,
  compact = false,
}: PortfolioMicrositeProps) {
  const resolved = resolvePortfolioTheme(data.theme);
  const sections = visibleSections(data.sections);
  const useDynamicSections = sections.length > 0;

  const items = visibleItems(data.items);
  const projectItems = items.filter((item) => PROJECT_TYPES.has(item.itemType));
  const activityItems = items.filter((item) => ACTIVITY_TYPES.has(item.itemType));
  const links = (data.links ?? []).filter((link) => Boolean(link.url));

  const sectionOrder = normalizeSectionOrder(data.theme.sectionOrder);

  const legacySections: Record<PortfolioSectionId, ReactNode> = {
    profile: (
      <ProfileSection data={data} resolved={resolved} compact={compact} />
    ),
    projects: (
      <ItemsSection
        title="Dự án & chứng chỉ"
        items={projectItems}
        resolved={resolved}
      />
    ),
    activities: (
      <ItemsSection
        title="Hoạt động ngoại khóa"
        items={activityItems}
        resolved={resolved}
      />
    ),
    links: <LinksSection links={links} resolved={resolved} />,
  };

  const gapClass = compact ? "space-y-5" : resolved.densityGapClass;

  return (
    <div
      className={cn(
        "relative min-h-full",
        resolved.isDark
          ? "bg-[#121212] text-[#FAFAF5]"
          : "bg-[#FAFAF5] text-[#2D2D2D]",
        resolved.fontScaleClass,
        resolved.lineHeightClass,
        compact ? "p-4" : "px-4 py-8 sm:px-6 sm:py-12",
        className,
      )}
      style={{ fontFamily: resolved.bodyFontCss }}
    >
      <PortfolioBackground slot={resolved.background} theme={resolved} />

      <div
        className={cn(
          "relative mx-auto",
          gapClass,
          compact ? "max-w-full" : "max-w-4xl",
        )}
      >
        <PortfolioReveal slot={resolved.reveal}>
          <ProfileSection data={data} resolved={resolved} compact={compact} />
        </PortfolioReveal>

        {useDynamicSections
          ? sections.map((section) => {
              const content = renderDynamicSection(
                section,
                resolved,
                projectItems,
                activityItems,
                links,
              );
              if (!content) return null;

              return (
                <PortfolioReveal key={section.id} slot={resolved.reveal}>
                  {content}
                </PortfolioReveal>
              );
            })
          : sectionOrder
              .filter((sectionId) => sectionId !== "profile")
              .map((sectionId) => (
                <PortfolioReveal key={sectionId} slot={resolved.reveal}>
                  {legacySections[sectionId]}
                </PortfolioReveal>
              ))}
      </div>
    </div>
  );
}
