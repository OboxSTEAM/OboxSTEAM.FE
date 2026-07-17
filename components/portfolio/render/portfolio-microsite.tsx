import type { ReactNode } from "react";

import type {
  Portfolio,
  PortfolioItem,
  PortfolioLink,
  PortfolioTheme,
  PublicPortfolio,
} from "@/lib/api/entities/portfolio";
import {
  getPortfolioFontCss,
  getPortfolioLayoutStyleId,
  getPortfolioTemplateId,
  normalizeSectionOrder,
  PORTFOLIO_ITEM_TYPE_LABELS,
  type PortfolioSectionId,
} from "@/lib/portfolio/constants";
import { cn } from "@/lib/utils";

export type PortfolioMicrositeData = {
  displayName: string | null;
  headline: string | null;
  tagline: string | null;
  summary: string | null;
  studentName: string | null;
  avatarUrl: string | null;
  theme: PortfolioTheme;
  links: PortfolioLink[] | null;
  items: PortfolioItem[] | null;
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
    theme: portfolio.theme,
    links: portfolio.links,
    items: portfolio.items,
  };
}

type PortfolioMicrositeProps = {
  data: PortfolioMicrositeData;
  className?: string;
  /** Compact mode for the editor preview frame. */
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

function ItemCard({ item, accent }: { item: PortfolioItem; accent: string }) {
  return (
    <article
      className="rounded-2xl border border-[#E5E5E0] bg-white p-5 shadow-[0_8px_24px_rgba(45,45,45,0.04)]"
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6B6B6B]">
        {PORTFOLIO_ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
      </p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#2D2D2D]">
        {item.title ?? "Không có tiêu đề"}
      </h3>
      {item.subtitle || item.organization ? (
        <p className="mt-1 text-sm text-[#6B6B6B]">
          {[item.subtitle, item.organization].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {item.studentEditedBody || item.description ? (
        <p className="mt-3 text-sm leading-relaxed text-[#2D2D2D]/90">
          {item.studentEditedBody ?? item.description}
        </p>
      ) : null}
      {item.mentorEndorsement ? (
        <blockquote className="mt-3 border-l-2 border-[#4FC3F7] pl-3 text-sm italic text-[#6B6B6B]">
          {item.mentorEndorsement}
        </blockquote>
      ) : null}
      {item.externalUrl ? (
        <a
          href={item.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-medium text-[#4FC3F7] underline-offset-4 hover:underline"
        >
          Xem liên kết
        </a>
      ) : null}
    </article>
  );
}

function ProfileSection({
  data,
  primary,
  secondary,
  templateId,
  compact,
}: {
  data: PortfolioMicrositeData;
  primary: string;
  secondary: string;
  templateId: string;
  compact?: boolean;
}) {
  const name = data.displayName ?? data.studentName ?? "Học viên OboxSTEAM";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] p-6 sm:p-8",
        templateId === "aurora" && "text-white",
        templateId === "editorial" && "bg-white text-[#2D2D2D]",
        templateId === "minimal" && "bg-[#FAFAF5] text-[#2D2D2D]",
        compact ? "p-5" : null,
      )}
      style={
        templateId === "aurora"
          ? {
              background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 55%, #2D2D2D 100%)`,
            }
          : templateId === "editorial"
            ? { borderBottom: `4px solid ${primary}` }
            : { border: `1px solid #E5E5E0` }
      }
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.18em]",
              templateId === "aurora" ? "text-white/70" : "text-[#6B6B6B]",
            )}
          >
            Portfolio STEAM
          </p>
          <h1
            className={cn(
              "mt-2 text-balance font-extrabold tracking-tight",
              compact ? "text-2xl" : "text-3xl sm:text-5xl",
            )}
          >
            {name}
          </h1>
          {data.headline ? (
            <p
              className={cn(
                "mt-3 text-lg font-semibold",
                compact && "text-base",
              )}
            >
              {data.headline}
            </p>
          ) : null}
          {data.tagline ? (
            <p
              className={cn(
                "mt-2 text-sm leading-relaxed",
                templateId === "aurora" ? "text-white/85" : "text-[#6B6B6B]",
              )}
            >
              {data.tagline}
            </p>
          ) : null}
          {data.summary ? (
            <p
              className={cn(
                "mt-4 max-w-xl text-sm leading-relaxed",
                templateId === "aurora" ? "text-white/80" : "text-[#2D2D2D]/85",
              )}
            >
              {data.summary}
            </p>
          ) : null}
        </div>
        {data.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote avatar URLs
          <img
            src={data.avatarUrl}
            alt={name}
            className={cn(
              "rounded-2xl object-cover shadow-lg ring-2 ring-white/40",
              compact ? "h-20 w-20" : "h-28 w-28 sm:h-32 sm:w-32",
            )}
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl bg-white/15 font-bold",
              compact ? "h-20 w-20 text-xl" : "h-28 w-28 text-3xl sm:h-32 sm:w-32",
              templateId !== "aurora" && "bg-[#F5F5F0] text-[#2D2D2D]",
            )}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
    </section>
  );
}

function LinksSection({
  links,
  primary,
}: {
  links: PortfolioLink[];
  primary: string;
}) {
  if (links.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">Liên kết</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link, index) =>
          link.url ? (
            <a
              key={`${link.url}-${index}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
              style={{ backgroundColor: primary }}
            >
              {link.label || link.url}
            </a>
          ) : null,
        )}
      </div>
    </section>
  );
}

function ItemsSection({
  title,
  items,
  accent,
  layoutStyle,
}: {
  title: string;
  items: PortfolioItem[];
  accent: string;
  layoutStyle: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">{title}</h2>
      <div
        className={cn(
          layoutStyle === "bento" && "grid gap-4 sm:grid-cols-2",
          layoutStyle === "timeline" && "relative space-y-4 border-l-2 border-[#E5E5E0] pl-5",
          layoutStyle === "stacked" && "space-y-4",
        )}
        style={
          layoutStyle === "timeline"
            ? { borderLeftColor: accent }
            : undefined
        }
      >
        {items.map((item) => (
          <ItemCard key={item.id} item={item} accent={accent} />
        ))}
      </div>
    </section>
  );
}

export function PortfolioMicrosite({
  data,
  className,
  compact = false,
}: PortfolioMicrositeProps) {
  const templateId = getPortfolioTemplateId(data.theme.templateId);
  const layoutStyle = getPortfolioLayoutStyleId(data.theme.layoutStyle);
  const fontFamily = getPortfolioFontCss(data.theme.fontFamily);
  const primary = data.theme.primaryColor || "#E94B3C";
  const secondary = data.theme.secondaryColor || "#4FC3F7";
  const sectionOrder = normalizeSectionOrder(data.theme.sectionOrder);
  const items = visibleItems(data.items);
  const projectItems = items.filter((item) => PROJECT_TYPES.has(item.itemType));
  const activityItems = items.filter((item) => ACTIVITY_TYPES.has(item.itemType));
  const links = (data.links ?? []).filter((link) => Boolean(link.url));

  const sections: Record<PortfolioSectionId, ReactNode> = {
    profile: (
      <ProfileSection
        key="profile"
        data={data}
        primary={primary}
        secondary={secondary}
        templateId={templateId}
        compact={compact}
      />
    ),
    projects: (
      <ItemsSection
        key="projects"
        title="Dự án & chứng chỉ"
        items={projectItems}
        accent={primary}
        layoutStyle={layoutStyle}
      />
    ),
    activities: (
      <ItemsSection
        key="activities"
        title="Hoạt động ngoại khóa"
        items={activityItems}
        accent={secondary}
        layoutStyle={layoutStyle}
      />
    ),
    links: <LinksSection key="links" links={links} primary={primary} />,
  };

  return (
    <div
      className={cn(
        "min-h-full bg-[#FAFAF5] text-[#2D2D2D]",
        compact ? "p-4" : "px-4 py-8 sm:px-6 sm:py-12",
        className,
      )}
      style={{ fontFamily }}
    >
      <div
        className={cn(
          "mx-auto space-y-8",
          compact ? "max-w-full space-y-5" : "max-w-4xl space-y-10",
        )}
      >
        {sectionOrder.map((sectionId) => sections[sectionId])}
      </div>
    </div>
  );
}
