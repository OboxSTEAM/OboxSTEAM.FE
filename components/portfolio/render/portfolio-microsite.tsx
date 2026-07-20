import type { ReactNode } from "react";

import {
  HeroAvatarFrame,
  PortfolioHeroCover,
  PortfolioHeroShell,
} from "@/components/portfolio/hero/portfolio-hero-shell";
import {
  PortfolioBackground,
  PortfolioCardShell,
  PortfolioGallery,
  PortfolioHeroText,
  PortfolioReveal,
  type GalleryImage,
} from "@/components/portfolio/reactbits/slots";
import { PortfolioLinkTiles } from "@/components/portfolio/links/portfolio-link-tiles";
import {
  itemSpanClass,
  itemsLayoutClass,
  isTimelineLayout,
  TimelineEntry,
  TimelineList,
} from "@/components/portfolio/render/items-layout";
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
import { getReadableTextColor } from "@/lib/portfolio/color-utils";
import {
  normalizeSectionOrder,
  PORTFOLIO_ITEM_TYPE_LABELS,
  type PortfolioSectionId,
} from "@/lib/portfolio/constants";
import { getHeroStyle } from "@/lib/portfolio/hero-styles";
import { formatPortfolioItemDateRange } from "@/lib/portfolio/item-dates";
import {
  GALLERY_SLOT_OPTIONS,
  getPresetPersonality,
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
  const dateRange = formatPortfolioItemDateRange(item.startDate, item.endDate);

  const card = (
    <div className={cn("h-full", itemSpanClass(item.span, layoutStyle))}>
      <PortfolioCardShell
        slot={resolved.card}
        surfaceClass={cardSurface}
        isDark={resolved.isDark}
        accentColor={resolved.primaryColor}
        radiusClass={getPresetPersonality(resolved.templateId).cardRadiusClass}
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
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: resolved.primaryColor,
              color: getReadableTextColor(resolved.primaryColor),
            }}
          >
            Nổi bật
          </span>
        ) : null}
      </div>

      <h3
        className={cn(
          "mt-2 break-words text-lg font-semibold tracking-tight",
          resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
        )}
        style={{ fontFamily: resolved.headingFontCss }}
      >
        {item.title && /<[^>]+>/.test(item.title) ? (
          <RichText
            html={item.title}
            className="prose-p:my-0 text-inherit"
          />
        ) : (
          (item.title ?? "Không có tiêu đề")
        )}
      </h3>

      {item.subtitle || item.organization ? (
        <div
          className={cn(
            "mt-1 flex flex-wrap items-baseline gap-x-1.5 text-sm",
            resolved.isDark ? "text-[#FAFAF5]/70" : "text-[#6B6B6B]",
          )}
        >
          {[item.subtitle, item.organization].filter(Boolean).map((part, index) => (
            <span
              key={`${item.id}-meta-${index}`}
              className="inline-flex min-w-0 max-w-full items-baseline"
            >
              {index > 0 ? (
                <span className="mr-1.5 shrink-0 opacity-50" aria-hidden>
                  ·
                </span>
              ) : null}
              {part && hasHtmlTags(part) ? (
                <RichText html={part} inline className="text-inherit" />
              ) : (
                <span className="min-w-0 truncate">{part}</span>
              )}
            </span>
          ))}
        </div>
      ) : null}

      {dateRange && !isTimelineLayout(layoutStyle) ? (
        <p
          className={cn(
            "mt-1 text-xs",
            resolved.isDark ? "text-[#FAFAF5]/55" : "text-[#6B6B6B]",
          )}
        >
          {dateRange}
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

  if (!isTimelineLayout(layoutStyle)) return card;

  return (
    <TimelineEntry
      primaryColor={resolved.primaryColor}
      isDark={resolved.isDark}
      dateLabel={dateRange}
    >
      {card}
    </TimelineEntry>
  );
}

function SectionHeading({
  title,
  resolved,
}: {
  title: string;
  resolved: ResolvedPortfolioTheme;
}) {
  const personality = getPresetPersonality(resolved.templateId);
  const onPrimary = getReadableTextColor(resolved.primaryColor);
  return (
    <h2
      className={cn(
        "inline-flex max-w-full items-center px-4 py-1.5 text-base font-bold tracking-tight @min-[640px]/pf:text-lg",
        personality.monoLabels ? "font-mono text-sm uppercase tracking-[0.12em]" : "",
        personality.playfulChrome ? "rounded-full" : "rounded-full",
      )}
      style={{
        fontFamily: resolved.headingFontCss,
        backgroundColor: resolved.primaryColor,
        color: onPrimary,
      }}
    >
      {/<[^>]+>/.test(title) ? (
        <RichText
          html={title}
          className="prose-p:my-0 text-inherit [&_*]:text-inherit"
        />
      ) : (
        title
      )}
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
  const timeline = isTimelineLayout(resolved.layoutStyle);

  const list = (
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
  );

  return (
    <section className="space-y-4">
      <SectionHeading title={title} resolved={resolved} />
      {timeline ? (
        <TimelineList
          primaryColor={resolved.primaryColor}
          isDark={resolved.isDark}
        >
          {list}
        </TimelineList>
      ) : (
        list
      )}
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
      <PortfolioLinkTiles links={visible} isDark={resolved.isDark} />
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
  const name =
    (data.displayName
      ? data.displayName.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim()
      : "") ||
    data.studentName ||
    "Học viên OboxSTEAM";
  const summaryIsHtml = data.summary ? hasHtmlTags(data.summary) : false;
  const heroStyle = getHeroStyle(resolved.heroText);
  const onFill = getReadableTextColor(resolved.primaryColor);

  return (
    <PortfolioHeroShell
      slot={resolved.heroText}
      isDark={resolved.isDark}
      primaryColor={resolved.primaryColor}
      secondaryColor={resolved.secondaryColor}
      accentColor={resolved.accentColor}
      compact={compact}
      cover={
        <PortfolioHeroCover
          slot={resolved.heroText}
          coverImageUrl={data.coverImageUrl}
          isDark={resolved.isDark}
          primaryColor={resolved.primaryColor}
          secondaryColor={resolved.secondaryColor}
          accentColor={resolved.accentColor}
        />
      }
      avatar={
        <HeroAvatarFrame
          style={heroStyle}
          primaryColor={resolved.primaryColor}
          accentColor={resolved.accentColor}
          name={name}
          avatarUrl={data.avatarUrl}
          textColor={onFill}
          compact={compact}
        />
      }
    >
      <div className={cn(compact && "scale-[0.95] origin-top-left")}>
        <PortfolioHeroText
          slot={resolved.heroText}
          name={name}
          headline={
            data.headline && hasHtmlTags(data.headline) ? null : data.headline
          }
          colors={[
            resolved.primaryColor,
            resolved.accentColor,
            resolved.secondaryColor,
          ]}
        />
        {data.headline && hasHtmlTags(data.headline) ? (
          <RichText
            html={data.headline}
            className={cn(
              heroStyle.headlineClass,
              resolved.isDark ? "text-[#FAFAF5]/90" : "text-[#2D2D2D]",
            )}
          />
        ) : null}
      </div>

      {data.tagline ? (
        /<[^>]+>/.test(data.tagline) ? (
          <RichText
            html={data.tagline}
            className={cn(
              heroStyle.taglineClass,
              resolved.isDark ? "text-[#FAFAF5]/75" : "text-[#6B6B6B]",
            )}
          />
        ) : (
          <p
            className={cn(
              heroStyle.taglineClass,
              resolved.isDark ? "text-[#FAFAF5]/75" : "text-[#6B6B6B]",
            )}
          >
            {data.tagline}
          </p>
        )
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
    </PortfolioHeroShell>
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
        isDark={resolved.isDark}
        primaryColor={resolved.primaryColor}
        backgroundStyle={resolved.backgroundStyle}
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
  /** Prefer dynamic section model whenever any sections exist — even if all are hidden. */
  const hasDynamicSections = (data.sections?.length ?? 0) > 0;
  const sections = visibleSections(data.sections);

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
  const personality = getPresetPersonality(resolved.templateId);

  return (
    <div
      className={cn(
        "relative min-h-full",
        resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
        personality.paperWash && !resolved.isDark && "bg-[#FDFBF7]/40",
        compact ? "p-4" : "px-3 py-6 @min-[640px]/pf:px-6 @min-[640px]/pf:py-12",
        "@container/pf",
        personality.sectionPadClass,
        className,
      )}
      style={{
        fontFamily: resolved.bodyFontCss,
        fontSize: `${resolved.fontScaleEm}em`,
        lineHeight: resolved.lineHeightEm,
        ["--pf-primary" as string]: resolved.primaryColor,
        ["--pf-secondary" as string]: resolved.secondaryColor,
        ["--pf-accent" as string]: resolved.accentColor,
      }}
    >
      <PortfolioBackground slot={resolved.background} theme={resolved} />
      {personality.grainOverlay ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.03]"
          aria-hidden
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      ) : null}

      <div
        className={cn(
          "relative z-10 mx-auto",
          gapClass,
          compact ? "max-w-full" : "max-w-4xl",
        )}
      >
        <PortfolioReveal slot={resolved.reveal}>
          <ProfileSection data={data} resolved={resolved} compact={compact} />
        </PortfolioReveal>

        {hasDynamicSections
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
