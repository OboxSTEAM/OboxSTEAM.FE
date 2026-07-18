"use client";

import Image from "next/image";
import { useMemo, type ReactNode } from "react";
import { Reorder, useDragControls, useReducedMotion } from "motion/react";
import {
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { InlineText } from "@/components/portfolio/editor/inline-text";
import { EditableSection } from "@/components/portfolio/editor/editable-frame";
import { MediaUploader } from "@/components/portfolio/editor/media-uploader";
import { RichTextEditor } from "@/components/portfolio/editor/rich-text-editor";
import {
  PortfolioBackground,
  PortfolioCardShell,
  PortfolioGallery,
  PortfolioReveal,
  type GalleryImage,
} from "@/components/portfolio/reactbits/slots";
import { RichText } from "@/components/portfolio/render/rich-text";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Portfolio,
  PortfolioItem,
  PortfolioMediaAsset,
  PortfolioSection,
  PortfolioSectionKind,
  PortfolioTheme,
} from "@/lib/api/entities/portfolio";
import {
  parseSectionSettingsJson,
  serializeSectionSettingsJson,
} from "@/lib/api/entities/portfolio";
import {
  normalizeSectionOrder,
  PORTFOLIO_ITEM_TYPE_LABELS,
  PORTFOLIO_SECTION_KIND_LABELS,
  PORTFOLIO_SECTIONS,
  type PortfolioSectionId,
} from "@/lib/portfolio/constants";
import {
  GALLERY_SLOT_OPTIONS,
  HERO_TEXT_SLOT_OPTIONS,
  resolvePortfolioTheme,
  type GallerySlotId,
  type ResolvedPortfolioTheme,
} from "@/lib/portfolio/theme-presets";
import {
  LIGHT_SELECT_CONTENT_PANEL,
  LIGHT_SELECT_ITEM_PANEL,
  LIGHT_SELECT_TRIGGER_FULL,
} from "@/lib/ui/select-styles";
import { cn } from "@/lib/utils";

const PROJECT_TYPES = new Set([
  "CapstoneProject",
  "InternalCertificate",
  "ExternalCert",
  "Project",
  "HighlightReel",
]);

const ACTIVITY_TYPES = new Set(["Hobby", "Extracurricular"]);

const CUSTOM_SECTION_KINDS = new Set<PortfolioSectionKind>([
  "RichText",
  "Gallery",
  "Embed",
]);

const STEAM_CHIPS = [
  { label: "Science", colorKey: "primary" as const },
  { label: "Tech", colorKey: "secondary" as const },
  { label: "Engineering", colorKey: "accent" as const },
  { label: "Arts", colorKey: "secondary" as const },
  { label: "Math", colorKey: "primary" as const },
];

export type PortfolioCanvasProps = {
  draft: Portfolio;
  onPatchDraft: (patch: Partial<Portfolio>) => void;
  onPatchTheme: (theme: PortfolioTheme) => void;
  onPatchItemText: (itemId: string, patch: Partial<PortfolioItem>) => void;
  /** Draft-only reorder while dragging (updates displayOrder locally). */
  onPreviewReorder: (orderedIds: string[]) => void;
  /** Persist the current draft order after a drop. */
  onCommitReorder: () => void;
  onToggleItemVisibility: (item: PortfolioItem, visible: boolean) => void;
  onDeleteItem: (item: PortfolioItem) => void;
  onEditItem: (item: PortfolioItem) => void;
  onAddItem: () => void;
  onSyncItems: () => void;
  isSyncing: boolean;
  onOpenLinksPanel: () => void;
  onAddSection?: (kind: PortfolioSectionKind) => void;
  onUpdateSection?: (sectionId: string, patch: Partial<PortfolioSection>) => void;
  onDeleteSection?: (sectionId: string) => void;
  onReorderSections?: (orderedIds: string[]) => void;
  onToggleSectionVisibility?: (section: PortfolioSection, visible: boolean) => void;
};

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
      return "grid auto-rows-auto gap-3 sm:grid-cols-2";
    case "timeline":
      return "relative space-y-3";
    case "masonry":
      return "columns-1 gap-3 sm:columns-2 [&>*]:mb-3 [&>*]:break-inside-avoid";
    default:
      return "space-y-3";
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

function sortedSections(sections: PortfolioSection[] | null | undefined): PortfolioSection[] {
  return [...(sections ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Floating pill of controls shown when hovering a card/section. */
function HoverChrome({
  children,
  className,
  alwaysVisible = false,
}: {
  children: ReactNode;
  className?: string;
  /** Keep chrome visible (e.g. while item/section is hidden). */
  alwaysVisible?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute top-2 right-2 z-20 flex items-center gap-0.5 rounded-full border border-[#E5E5E0] bg-white px-1 py-0.5 shadow-sm transition-opacity",
        alwaysVisible
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ChromeButton({
  label,
  onClick,
  onPointerDown,
  destructive = false,
  grabbable = false,
  emphasized = false,
  children,
}: {
  label: string;
  onClick?: () => void;
  onPointerDown?: (event: React.PointerEvent) => void;
  destructive?: boolean;
  grabbable?: boolean;
  /** High-contrast state (e.g. "currently hidden — click to show"). */
  emphasized?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={cn(
        "flex size-7 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]",
        emphasized
          ? "bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]"
          : "text-[#2D2D2D] hover:bg-[#F0F0EA]",
        destructive && !emphasized && "text-[#E94B3C] hover:bg-[#E94B3C]/10 hover:text-[#E94B3C]",
        grabbable && "cursor-grab touch-none active:cursor-grabbing",
      )}
    >
      {children}
    </button>
  );
}

/** Diagonal X hatch + badge when an item/section is hidden in the editor. */
function HiddenOverlay({ label = "Đang ẩn" }: { label?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[8] overflow-hidden rounded-[inherit]"
    >
      <div className="absolute inset-0 bg-[#FAFAF5]/55" />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 44%, #2D2D2D 44%, #2D2D2D 56%, transparent 56%),
            linear-gradient(-45deg, transparent 44%, #2D2D2D 44%, #2D2D2D 56%, transparent 56%)
          `,
          backgroundSize: "22px 22px",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-lg bg-[#2D2D2D] px-3 py-1.5 text-xs font-semibold tracking-wide text-white shadow-md">
          {label}
        </span>
      </div>
    </div>
  );
}

function ItemMediaRow({
  assets,
  isDark,
}: {
  assets: PortfolioMediaAsset[];
  isDark: boolean;
}) {
  const sorted = [...assets].sort((a, b) => a.displayOrder - b.displayOrder);
  if (sorted.length === 0) return null;

  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {sorted.map((asset, index) => (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote media URLs
        <img
          key={asset.id ?? `${asset.url}-${index}`}
          src={asset.url!}
          alt={asset.caption ?? ""}
          className={cn(
            "h-14 w-14 rounded-lg object-cover ring-1",
            isDark ? "ring-[#FAFAF5]/15" : "ring-[#E5E5E0]",
          )}
        />
      ))}
    </div>
  );
}

type ItemCardEditableProps = {
  item: PortfolioItem;
  resolved: ResolvedPortfolioTheme;
  reduceMotion: boolean;
  onPatchItemText: PortfolioCanvasProps["onPatchItemText"];
  onCommitReorder: () => void;
  onToggleVisibility: (item: PortfolioItem, visible: boolean) => void;
  onDelete: (item: PortfolioItem) => void;
  onEdit: (item: PortfolioItem) => void;
};

function ItemCardEditable({
  item,
  resolved,
  reduceMotion,
  onPatchItemText,
  onCommitReorder,
  onToggleVisibility,
  onDelete,
  onEdit,
}: ItemCardEditableProps) {
  const controls = useDragControls();
  const isAuto = item.source === "AutoImported";
  const cardSurface = resolved.cardSurfaceClass;
  const media = itemMediaSources(item);

  return (
    <Reorder.Item
      as="div"
      value={item.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onCommitReorder}
      layout="position"
      transition={reduceMotion ? { duration: 0 } : undefined}
      className={cn(
        "group relative h-full list-none",
        itemSpanClass(item.span, resolved.layoutStyle),
      )}
    >
      <PortfolioCardShell
        slot={resolved.card}
        surfaceClass={cardSurface}
        isDark={resolved.isDark}
        accentColor={resolved.primaryColor}
        className="h-full"
      >
        {!item.isVisible ? <HiddenOverlay /> : null}
        <HoverChrome alwaysVisible={!item.isVisible}>
          <ChromeButton
            label="Kéo để sắp xếp"
            grabbable
            onPointerDown={(event) => {
              event.preventDefault();
              controls.start(event);
            }}
          >
            <GripVertical className="size-3.5" />
          </ChromeButton>
          <ChromeButton
            label={item.isVisible ? "Ẩn mục" : "Hiện mục"}
            emphasized={!item.isVisible}
            onClick={() => onToggleVisibility(item, !item.isVisible)}
          >
            {item.isVisible ? (
              <EyeOff className="size-3.5" strokeWidth={2.25} />
            ) : (
              <Eye className="size-3.5" strokeWidth={2.25} />
            )}
          </ChromeButton>
          <ChromeButton label="Chỉnh sửa chi tiết" onClick={() => onEdit(item)}>
            <Pencil className="size-3.5" />
          </ChromeButton>
          {!isAuto ? (
            <ChromeButton label="Xóa mục" destructive onClick={() => onDelete(item)}>
              <Trash2 className="size-3.5" />
            </ChromeButton>
          ) : null}
        </HoverChrome>

        <div className="flex flex-wrap items-start justify-between gap-2">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.16em]"
            style={{ color: resolved.primaryColor }}
          >
            {PORTFOLIO_ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {item.isFeatured ? (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: resolved.primaryColor }}
              >
                Nổi bật
              </span>
            ) : null}
            {!item.isVisible ? (
              <span className="rounded-full bg-[#2D2D2D] px-2 py-0.5 text-[10px] font-semibold text-white">
                Đang ẩn
              </span>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "mt-1.5 text-base font-semibold tracking-tight",
            resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
          )}
          style={{ fontFamily: resolved.headingFontCss }}
        >
          {isAuto ? (
            <p>{item.title ?? "Không có tiêu đề"}</p>
          ) : (
            <InlineText
              value={item.title ?? ""}
              onChange={(next) => onPatchItemText(item.id, { title: next })}
              ariaLabel="Tiêu đề mục"
              placeholder="Tiêu đề mục…"
              tone={resolved.isDark ? "dark" : "light"}
              maxLength={255}
            />
          )}
        </div>

        {isAuto ? (
          item.subtitle || item.organization ? (
            <p
              className={cn(
                "mt-1 text-sm",
                resolved.isDark ? "text-[#FAFAF5]/70" : "text-[#6B6B6B]",
              )}
            >
              {[item.subtitle, item.organization].filter(Boolean).join(" · ")}
            </p>
          ) : null
        ) : (
          <div className="mt-1 flex flex-col gap-1 text-sm sm:flex-row sm:gap-2">
            <InlineText
              value={item.subtitle ?? ""}
              onChange={(next) => onPatchItemText(item.id, { subtitle: next })}
              ariaLabel="Phụ đề"
              placeholder="Phụ đề…"
              tone={resolved.isDark ? "dark" : "light"}
              maxLength={255}
              className={cn(
                "sm:flex-1",
                resolved.isDark ? "text-[#FAFAF5]/70" : "text-[#6B6B6B]",
              )}
            />
            <InlineText
              value={item.organization ?? ""}
              onChange={(next) => onPatchItemText(item.id, { organization: next })}
              ariaLabel="Tổ chức"
              placeholder="Tổ chức…"
              tone={resolved.isDark ? "dark" : "light"}
              maxLength={255}
              className={cn(
                "sm:flex-1",
                resolved.isDark ? "text-[#FAFAF5]/70" : "text-[#6B6B6B]",
              )}
            />
          </div>
        )}

        {isAuto && item.description ? (
          hasHtmlTags(item.description) ? (
            <RichText html={item.description} className="mt-2 text-sm" />
          ) : (
            <p
              className={cn(
                "mt-2 text-sm leading-relaxed",
                resolved.isDark ? "text-[#FAFAF5]/85" : "text-[#6B6B6B]",
              )}
            >
              {item.description}
            </p>
          )
        ) : null}

        <div className="mt-2">
          <RichTextEditor
            variant="inline"
            isDark={resolved.isDark}
            value={item.studentEditedBody ?? ""}
            onChange={(next) => onPatchItemText(item.id, { studentEditedBody: next })}
            ariaLabel="Nội dung tường thuật"
            placeholder="Kể câu chuyện của bạn: đã học được gì, tạo ra điều gì…"
            className={cn(
              resolved.isDark ? "text-[#FAFAF5]/90" : "text-[#2D2D2D]/90",
            )}
          />
        </div>

        <ItemMediaRow assets={media} isDark={resolved.isDark} />

        {item.mentorEndorsement ? (
          <blockquote
            className={cn(
              "mt-2.5 border-l-2 pl-3 text-sm italic",
              resolved.isDark
                ? "border-[#4FC3F7] text-[#FAFAF5]/75"
                : "border-[#4FC3F7] text-[#6B6B6B]",
            )}
          >
            {item.mentorEndorsement}
          </blockquote>
        ) : null}

        {item.externalUrl ? (
          <p
            className="mt-2.5 text-sm font-semibold"
            style={{ color: resolved.primaryColor }}
          >
            {item.externalUrl}
          </p>
        ) : null}
      </PortfolioCardShell>
    </Reorder.Item>
  );
}

type ItemsGroupEditableProps = {
  title: string;
  items: PortfolioItem[];
  resolved: ResolvedPortfolioTheme;
  emptyHint: string;
  showSyncInEmptyState?: boolean;
  reduceMotion: boolean;
  toGlobalOrder: (groupIds: string[]) => string[];
  canvasProps: PortfolioCanvasProps;
  onTitleChange?: (next: string) => void;
  dimmed?: boolean;
};

function ItemsGroupEditable({
  title,
  items,
  resolved,
  emptyHint,
  showSyncInEmptyState = false,
  reduceMotion,
  toGlobalOrder,
  canvasProps,
  onTitleChange,
  dimmed = false,
}: ItemsGroupEditableProps) {
  const {
    onPreviewReorder,
    onCommitReorder,
    onPatchItemText,
    onToggleItemVisibility,
    onDeleteItem,
    onEditItem,
    onAddItem,
    onSyncItems,
    isSyncing,
  } = canvasProps;

  const groupIds = items.map((item) => item.id);
  const layoutClass = itemsLayoutClass(resolved.layoutStyle);

  return (
    <div className="relative space-y-3">
      {dimmed ? <HiddenOverlay label="Phần đang ẩn" /> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {onTitleChange ? (
          <h2
            className={cn(
              "text-lg font-bold tracking-tight",
              resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
            )}
            style={{ fontFamily: resolved.headingFontCss }}
          >
            <InlineText
              value={title}
              onChange={onTitleChange}
              ariaLabel="Tiêu đề phần"
              placeholder="Tiêu đề phần…"
              tone={resolved.isDark ? "dark" : "light"}
              maxLength={255}
            />
          </h2>
        ) : (
          <h2
            className={cn(
              "text-lg font-bold tracking-tight",
              resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
            )}
            style={{ fontFamily: resolved.headingFontCss }}
          >
            {title}
          </h2>
        )}
        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-xs font-medium opacity-0 transition-opacity hover:border-[var(--pf-primary)] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#4FC3F7] outline-none group-hover/section:opacity-100"
          style={{
            borderColor: `${resolved.primaryColor}66`,
            color: resolved.primaryColor,
          }}
        >
          <Plus className="size-3.5" />
          Thêm mục
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#C9C9C2] bg-white/60 px-4 py-6 text-center">
          <p className="text-sm text-[#6B6B6B]">{emptyHint}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {showSyncInEmptyState ? (
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl"
                disabled={isSyncing}
                onClick={onSyncItems}
              >
                <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
                Đồng bộ
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={onAddItem}
            >
              <Plus className="size-4" />
              Thêm mục
            </Button>
          </div>
        </div>
      ) : (
        <Reorder.Group
          as="div"
          axis="y"
          values={groupIds}
          onReorder={(nextIds: string[]) =>
            onPreviewReorder(toGlobalOrder(nextIds))
          }
          className={layoutClass}
        >
          {items.map((item) => (
            <ItemCardEditable
              key={item.id}
              item={item}
              resolved={resolved}
              reduceMotion={reduceMotion}
              onPatchItemText={onPatchItemText}
              onCommitReorder={onCommitReorder}
              onToggleVisibility={onToggleItemVisibility}
              onDelete={onDeleteItem}
              onEdit={onEditItem}
            />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}

function ProfileSectionEditable({
  draft,
  resolved,
  onPatchDraft,
}: {
  draft: Portfolio;
  resolved: ResolvedPortfolioTheme;
  onPatchDraft: PortfolioCanvasProps["onPatchDraft"];
}) {
  const tone = resolved.isDark ? ("dark" as const) : ("light" as const);
  const name =
    draft.displayName || draft.studentName || "Học viên OboxSTEAM";
  const chipColors = {
    primary: resolved.primaryColor,
    secondary: resolved.secondaryColor,
    accent: resolved.accentColor,
  };

  const heroHint =
    HERO_TEXT_SLOT_OPTIONS.find((option) => option.id === resolved.heroText)
      ?.label ?? resolved.heroText;

  const nameClass = cn(
    "text-2xl font-extrabold tracking-tight sm:text-4xl",
    resolved.heroText === "Decrypted" && "font-mono tracking-[0.08em]",
    resolved.heroText === "TrueFocus" && "tracking-tighter underline decoration-2 underline-offset-8",
    resolved.heroText === "BlurShiny" && "italic tracking-wide opacity-95",
    resolved.heroText === "SplitGradient" && "bg-clip-text text-transparent",
  );

  const nameStyle =
    resolved.heroText === "SplitGradient"
      ? {
          fontFamily: resolved.headingFontCss,
          backgroundImage: `linear-gradient(90deg, ${resolved.primaryColor}, ${resolved.accentColor}, ${resolved.secondaryColor})`,
        }
      : resolved.heroText === "TrueFocus"
        ? {
            fontFamily: resolved.headingFontCss,
            textDecorationColor: resolved.primaryColor,
          }
        : { fontFamily: resolved.headingFontCss };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.25rem]",
        resolved.isDark ? "bg-[#1a1a1a]/80" : "bg-white/90",
        "p-5 sm:p-6",
        "ring-2",
      )}
      style={{
        ["--pf-primary" as string]: resolved.primaryColor,
        boxShadow: `inset 0 4px 0 0 ${resolved.primaryColor}`,
        borderColor: `${resolved.primaryColor}33`,
      }}
    >
      <div className="relative -mx-5 -mt-5 mb-4 sm:-mx-6 sm:-mt-6">
        {draft.coverImageUrl ? (
          <div className="relative h-32 overflow-hidden sm:h-40">
            <Image
              src={draft.coverImageUrl}
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
            className="flex h-28 items-center justify-center sm:h-36"
            style={{
              background: `linear-gradient(135deg, ${resolved.primaryColor}55 0%, ${resolved.secondaryColor}40 48%, ${resolved.accentColor}35 100%)`,
            }}
          >
            <p className="rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-[#2D2D2D]">
              Chưa có ảnh bìa
            </p>
          </div>
        )}
        <div className="absolute bottom-2 right-2 rounded-xl bg-white p-2 shadow-sm ring-1 ring-[#E5E5E0]">
          <MediaUploader
            label="ảnh bìa"
            onUploadedUrl={(url) => onPatchDraft({ coverImageUrl: url })}
            crop={{
              aspect: 2.5,
              cropShape: "rect",
              title: "Cắt ảnh bìa",
              description: "Kéo và thu phóng để chọn vùng hiển thị trên portfolio.",
              outputWidth: 1600,
              outputHeight: 640,
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: resolved.primaryColor }}
            >
              Portfolio STEAM
            </p>
            {resolved.heroText !== "Plain" ? (
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: resolved.accentColor }}
              >
                Hero: {heroHint}
              </span>
            ) : null}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {STEAM_CHIPS.map((chip) => (
              <span
                key={chip.label}
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: chipColors[chip.colorKey] }}
              >
                {chip.label}
              </span>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <div className={nameClass} style={nameStyle}>
              <InlineText
                value={draft.displayName ?? ""}
                onChange={(next) => onPatchDraft({ displayName: next })}
                ariaLabel="Tên hiển thị"
                placeholder={draft.studentName ?? "Tên của bạn…"}
                tone={
                  resolved.heroText === "SplitGradient" ? "light" : tone
                }
                maxLength={255}
              />
            </div>

            <div
              className={cn(
                "text-base font-semibold sm:text-lg",
                resolved.heroText === "Decrypted" && "font-mono text-sm sm:text-base",
                resolved.isDark ? "text-[#FAFAF5]/90" : "text-[#2D2D2D]",
              )}
              style={{ fontFamily: resolved.headingFontCss }}
            >
              <InlineText
                value={draft.headline ?? ""}
                onChange={(next) => onPatchDraft({ headline: next })}
                ariaLabel="Tiêu đề"
                placeholder="VD: Học viên STEAM · Robotics"
                tone={tone}
                maxLength={255}
              />
            </div>
          </div>

          <div
            className={cn(
              "mt-2 text-sm leading-relaxed",
              resolved.isDark ? "text-[#FAFAF5]/75" : "text-[#5C5C5C]",
            )}
          >
            <InlineText
              value={draft.tagline ?? ""}
              onChange={(next) => onPatchDraft({ tagline: next })}
              ariaLabel="Tagline"
              placeholder="Một câu ngắn về hành trình của bạn…"
              tone={tone}
              maxLength={255}
            />
          </div>

          <div
            className={cn(
              "mt-3 max-w-xl",
              resolved.isDark ? "text-[#FAFAF5]/90" : "text-[#2D2D2D]",
            )}
          >
            <RichTextEditor
              variant="inline"
              isDark={resolved.isDark}
              value={draft.summary ?? ""}
              onChange={(next) => onPatchDraft({ summary: next })}
              ariaLabel="Tóm tắt"
              placeholder="Giới thiệu bản thân, mục tiêu học tập, định hướng…"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          {draft.avatarUrl ? (
            <div
              className="relative h-24 w-24 overflow-hidden rounded-xl shadow-lg sm:h-28 sm:w-28"
              style={{ boxShadow: `0 0 0 3px ${resolved.primaryColor}` }}
            >
              <Image
                src={draft.avatarUrl}
                alt={name}
                fill
                unoptimized
                className="object-cover"
                sizes="112px"
              />
            </div>
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-xl text-2xl font-bold text-white sm:h-28 sm:w-28"
              style={{
                background: `linear-gradient(145deg, ${resolved.primaryColor}, ${resolved.accentColor})`,
              }}
            >
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <MediaUploader
            label="avatar"
            onUploadedUrl={(url) => onPatchDraft({ avatarUrl: url })}
            crop={{
              aspect: 1,
              cropShape: "round",
              title: "Cắt ảnh đại diện",
              description: "Kéo để căn mặt vào khung. Thu phóng nếu ảnh quá lớn.",
              outputWidth: 512,
              outputHeight: 512,
            }}
          />
        </div>
      </div>
    </section>
  );
}

function LinksSectionEditable({
  draft,
  resolved,
  title = "Liên kết",
  onOpenLinksPanel,
  onTitleChange,
  dimmed = false,
}: {
  draft: Portfolio;
  resolved: ResolvedPortfolioTheme;
  title?: string;
  onOpenLinksPanel: () => void;
  onTitleChange?: (next: string) => void;
  dimmed?: boolean;
}) {
  const links = (draft.links ?? []).filter((link) => Boolean(link.url));
  const linkPalette = [
    resolved.primaryColor,
    resolved.secondaryColor,
    resolved.accentColor,
  ];

  return (
    <div className="relative space-y-3">
      {dimmed ? <HiddenOverlay label="Phần đang ẩn" /> : null}
      <div className="flex items-center justify-between gap-2">
        {onTitleChange ? (
          <h2
            className={cn(
              "text-lg font-bold tracking-tight",
              resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
            )}
            style={{ fontFamily: resolved.headingFontCss }}
          >
            <InlineText
              value={title}
              onChange={onTitleChange}
              ariaLabel="Tiêu đề phần liên kết"
              placeholder="Liên kết"
              tone={resolved.isDark ? "dark" : "light"}
              maxLength={255}
            />
          </h2>
        ) : (
          <h2
            className={cn(
              "text-lg font-bold tracking-tight",
              resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
            )}
            style={{ fontFamily: resolved.headingFontCss }}
          >
            {title}
          </h2>
        )}
        <button
          type="button"
          onClick={onOpenLinksPanel}
          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover/section:opacity-100 focus-visible:opacity-100"
          style={{ backgroundColor: resolved.primaryColor }}
        >
          <Pencil className="size-3" />
          Chỉnh liên kết
        </button>
      </div>

      {links.length === 0 ? (
        <button
          type="button"
          onClick={onOpenLinksPanel}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]"
          style={{
            borderColor: `${resolved.primaryColor}66`,
            color: resolved.primaryColor,
            backgroundColor: `${resolved.primaryColor}0d`,
          }}
        >
          <Plus className="size-4" />
          Thêm GitHub, Behance, LinkedIn…
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {links.map((link, index) => (
            <span
              key={`${link.url}-${index}`}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: linkPalette[index % linkPalette.length] }}
            >
              {link.label || link.url}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomSectionEditable({
  section,
  resolved,
  onUpdateSection,
  onDeleteSection,
  onToggleSectionVisibility,
}: {
  section: PortfolioSection;
  resolved: ResolvedPortfolioTheme;
  onUpdateSection?: PortfolioCanvasProps["onUpdateSection"];
  onDeleteSection?: PortfolioCanvasProps["onDeleteSection"];
  onToggleSectionVisibility?: PortfolioCanvasProps["onToggleSectionVisibility"];
}) {
  const isCustom = CUSTOM_SECTION_KINDS.has(section.kind);
  const dimmed = !section.isVisible;

  const patch = (next: Partial<PortfolioSection>) => {
    onUpdateSection?.(section.id, next);
  };

  return (
    <div className="group relative space-y-3">
      {dimmed ? <HiddenOverlay label="Phần đang ẩn" /> : null}
      {isCustom ? (
        <HoverChrome alwaysVisible={dimmed}>
          <ChromeButton
            label={section.isVisible ? "Ẩn phần" : "Hiện phần"}
            emphasized={dimmed}
            onClick={() =>
              onToggleSectionVisibility?.(section, !section.isVisible)
            }
          >
            {section.isVisible ? (
              <EyeOff className="size-3.5" strokeWidth={2.25} />
            ) : (
              <Eye className="size-3.5" strokeWidth={2.25} />
            )}
          </ChromeButton>
          <ChromeButton
            label="Xóa phần"
            destructive
            onClick={() => onDeleteSection?.(section.id)}
          >
            <Trash2 className="size-3.5" />
          </ChromeButton>
        </HoverChrome>
      ) : null}

      <h2
        className={cn(
          "text-lg font-bold tracking-tight",
          resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
        )}
        style={{ fontFamily: resolved.headingFontCss }}
      >
        <InlineText
          value={section.title ?? ""}
          onChange={(next) => patch({ title: next })}
          ariaLabel="Tiêu đề phần"
          placeholder={
            PORTFOLIO_SECTION_KIND_LABELS[section.kind] ?? "Tiêu đề phần…"
          }
          tone={resolved.isDark ? "dark" : "light"}
          maxLength={255}
        />
      </h2>

      {section.kind === "RichText" ? (
        <RichTextEditor
          variant="inline"
          isDark={resolved.isDark}
          value={section.contentHtml ?? ""}
          onChange={(next) => patch({ contentHtml: next })}
          ariaLabel="Nội dung văn bản"
          placeholder="Viết nội dung cho phần này…"
        />
      ) : null}

      {section.kind === "Gallery" ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p
              className={cn(
                "text-xs font-medium",
                resolved.isDark ? "text-[#FAFAF5]/70" : "text-[#6B6B6B]",
              )}
            >
              Kiểu thư viện
            </p>
            <Select
              value={resolveGalleryVariant(section, resolved)}
              onValueChange={(value) => {
                if (value == null) return;
                const current =
                  parseSectionSettingsJson(section.settingsJson) ?? {};
                patch({
                  settingsJson: serializeSectionSettingsJson({
                    ...current,
                    variant: value,
                  }),
                });
              }}
            >
              <SelectTrigger className={LIGHT_SELECT_TRIGGER_FULL}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={LIGHT_SELECT_CONTENT_PANEL}>
                {GALLERY_SLOT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.id}
                    value={option.id}
                    className={LIGHT_SELECT_ITEM_PANEL}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <MediaUploader
            assets={section.mediaAssets}
            onChange={(assets) => patch({ mediaAssets: assets })}
            label="Ảnh thư viện"
          />
          <PortfolioGallery
            slot={resolveGalleryVariant(section, resolved)}
            images={sectionMediaToGalleryImages(section.mediaAssets)}
          />
        </div>
      ) : null}

      {section.kind === "Embed" ? (
        <div className="space-y-3">
          <RichTextEditor
            variant="inline"
            isDark={resolved.isDark}
            value={section.contentHtml ?? ""}
            onChange={(next) => patch({ contentHtml: next })}
            ariaLabel="URL hoặc mã nhúng"
            placeholder="Dán URL (YouTube, Figma…) hoặc HTML nhúng…"
          />
          {section.contentHtml?.trim() && looksLikeUrl(section.contentHtml) ? (
            <iframe
              src={normalizeEmbedUrl(section.contentHtml)}
              title={section.title ?? "Nhúng nội dung"}
              className={cn(
                "h-56 w-full rounded-xl border",
                resolved.isDark ? "border-[#FAFAF5]/15" : "border-[#E5E5E0]",
              )}
            />
          ) : section.contentHtml?.trim() ? (
            <RichText html={section.contentHtml} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Draggable wrapper around a legacy document section with a hover drag handle. */
function LegacySectionShell({
  sectionId,
  reduceMotion,
  isDark,
  reveal,
  children,
}: {
  sectionId: PortfolioSectionId;
  reduceMotion: boolean;
  isDark: boolean;
  reveal: ResolvedPortfolioTheme["reveal"];
  children: ReactNode;
}) {
  const controls = useDragControls();
  const label =
    PORTFOLIO_SECTIONS.find((section) => section.id === sectionId)?.label ??
    sectionId;

  return (
    <Reorder.Item
      as="div"
      value={sectionId}
      dragListener={false}
      dragControls={controls}
      layout="position"
      transition={reduceMotion ? { duration: 0 } : undefined}
      className="group/section relative list-none"
      data-portfolio-section={sectionId}
    >
      <div
        className={cn(
          "absolute -top-3 right-3 z-20 flex items-center gap-1 rounded-full border border-[#E5E5E0] bg-white px-2 py-1 shadow-sm transition-opacity",
          "opacity-0 group-hover/section:opacity-100 focus-within:opacity-100",
        )}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6B6B6B]">
          {label}
        </span>
        <button
          type="button"
          aria-label={`Kéo để sắp xếp phần ${label}`}
          title="Kéo để sắp xếp"
          onPointerDown={(event) => {
            event.preventDefault();
            controls.start(event);
          }}
          className="flex size-6 cursor-grab touch-none items-center justify-center rounded-full text-[#6B6B6B] transition-colors hover:bg-[#F5F5F0] hover:text-[#2D2D2D] focus-visible:ring-2 focus-visible:ring-[#4FC3F7] outline-none active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>
      </div>
      <EditableSection isDark={isDark}>
        <PortfolioReveal slot="None">{children}</PortfolioReveal>
      </EditableSection>
    </Reorder.Item>
  );
}

function DynamicSectionShell({
  section,
  reduceMotion,
  isDark,
  reveal,
  onToggleSectionVisibility,
  onDeleteSection,
  children,
}: {
  section: PortfolioSection;
  reduceMotion: boolean;
  isDark: boolean;
  reveal: ResolvedPortfolioTheme["reveal"];
  onToggleSectionVisibility?: PortfolioCanvasProps["onToggleSectionVisibility"];
  onDeleteSection?: PortfolioCanvasProps["onDeleteSection"];
  children: ReactNode;
}) {
  const controls = useDragControls();
  const label =
    section.title ||
    PORTFOLIO_SECTION_KIND_LABELS[section.kind] ||
    section.kind;
  const isCustom = CUSTOM_SECTION_KINDS.has(section.kind);

  return (
    <Reorder.Item
      as="div"
      value={section.id}
      dragListener={false}
      dragControls={controls}
      layout="position"
      transition={reduceMotion ? { duration: 0 } : undefined}
      className="group/section relative list-none"
      data-portfolio-section={section.id}
    >
      <div
        className={cn(
          "absolute -top-3 right-3 z-20 flex items-center gap-1 rounded-full border border-[#E5E5E0] bg-white px-2 py-1 shadow-sm transition-opacity",
          !section.isVisible
            ? "opacity-100"
            : "opacity-0 group-hover/section:opacity-100 focus-within:opacity-100",
        )}
      >
        <span className="max-w-[10rem] truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[#6B6B6B]">
          {label}
        </span>
        {!isCustom && onToggleSectionVisibility ? (
          <ChromeButton
            label={section.isVisible ? "Ẩn phần" : "Hiện phần"}
            emphasized={!section.isVisible}
            onClick={() => onToggleSectionVisibility(section, !section.isVisible)}
          >
            {section.isVisible ? (
              <EyeOff className="size-3" strokeWidth={2.25} />
            ) : (
              <Eye className="size-3" strokeWidth={2.25} />
            )}
          </ChromeButton>
        ) : null}
        {!isCustom && onDeleteSection ? (
          <ChromeButton
            label="Xóa phần"
            destructive
            onClick={() => onDeleteSection(section.id)}
          >
            <Trash2 className="size-3" />
          </ChromeButton>
        ) : null}
        <button
          type="button"
          aria-label={`Kéo để sắp xếp phần ${label}`}
          title="Kéo để sắp xếp"
          onPointerDown={(event) => {
            event.preventDefault();
            controls.start(event);
          }}
          className="flex size-6 cursor-grab touch-none items-center justify-center rounded-full text-[#6B6B6B] transition-colors hover:bg-[#F5F5F0] hover:text-[#2D2D2D] focus-visible:ring-2 focus-visible:ring-[#4FC3F7] outline-none active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>
      </div>
      <EditableSection isDark={isDark}>
        <PortfolioReveal slot="None">{children}</PortfolioReveal>
      </EditableSection>
    </Reorder.Item>
  );
}

function AddSectionBar({
  onAddSection,
}: {
  onAddSection?: PortfolioCanvasProps["onAddSection"];
}) {
  if (!onAddSection) return null;

  const kinds: PortfolioSectionKind[] = ["RichText", "Gallery", "Embed"];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-dashed border-[#C9C9C2] bg-white/50 px-4 py-3">
      <span className="text-xs font-medium text-[#6B6B6B]">Thêm phần:</span>
      {kinds.map((kind) => (
        <Button
          key={kind}
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-xs"
          onClick={() => onAddSection(kind)}
        >
          <Plus className="size-3.5" />
          {PORTFOLIO_SECTION_KIND_LABELS[kind]}
        </Button>
      ))}
    </div>
  );
}

export function PortfolioCanvas(props: PortfolioCanvasProps) {
  const {
    draft,
    onPatchDraft,
    onPatchTheme,
    onOpenLinksPanel,
    onUpdateSection,
    onDeleteSection,
    onReorderSections,
    onToggleSectionVisibility,
    onAddSection,
  } = props;

  const reduceMotion = useReducedMotion() ?? false;
  const resolved = resolvePortfolioTheme(draft.theme);
  const theme = draft.theme;

  const sectionOrder = useMemo(
    () => normalizeSectionOrder(theme.sectionOrder),
    [theme.sectionOrder],
  );

  const dynamicSections = useMemo(
    () => sortedSections(draft.sections),
    [draft.sections],
  );
  const useDynamicSections = dynamicSections.length > 0;

  const allSorted = useMemo(
    () =>
      [...(draft.items ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
    [draft.items],
  );

  const projectItems = allSorted.filter((item) =>
    PROJECT_TYPES.has(item.itemType),
  );
  const activityItems = allSorted.filter((item) =>
    ACTIVITY_TYPES.has(item.itemType),
  );

  const toGlobalOrder = (groupIdsNew: string[]): string[] => {
    const groupSet = new Set(groupIdsNew);
    const queue = [...groupIdsNew];
    return allSorted.map((item) =>
      groupSet.has(item.id) ? (queue.shift() as string) : item.id,
    );
  };

  const patchSectionTitle = (sectionId: string, title: string) => {
    onUpdateSection?.(sectionId, { title });
  };

  const renderDynamicSectionBody = (section: PortfolioSection) => {
    const dimmed = !section.isVisible;

    switch (section.kind) {
      case "ProjectsGroup":
        return (
          <ItemsGroupEditable
            title={section.title ?? "Dự án & chứng chỉ"}
            items={projectItems}
            resolved={resolved}
            emptyHint="Chưa có dự án hay chứng chỉ. Đồng bộ để nhập tự động, hoặc thêm thủ công."
            showSyncInEmptyState
            reduceMotion={reduceMotion}
            toGlobalOrder={toGlobalOrder}
            canvasProps={props}
            onTitleChange={(next) => patchSectionTitle(section.id, next)}
            dimmed={dimmed}
          />
        );
      case "ActivitiesGroup":
        return (
          <ItemsGroupEditable
            title={section.title ?? "Hoạt động ngoại khóa"}
            items={activityItems}
            resolved={resolved}
            emptyHint="Chưa có hoạt động. Thêm sở thích hoặc hoạt động ngoại khóa của bạn."
            reduceMotion={reduceMotion}
            toGlobalOrder={toGlobalOrder}
            canvasProps={props}
            onTitleChange={(next) => patchSectionTitle(section.id, next)}
            dimmed={dimmed}
          />
        );
      case "LinksGroup":
        return (
          <LinksSectionEditable
            draft={draft}
            resolved={resolved}
            title={section.title ?? "Liên kết"}
            onOpenLinksPanel={onOpenLinksPanel}
            onTitleChange={(next) => patchSectionTitle(section.id, next)}
            dimmed={dimmed}
          />
        );
      case "RichText":
      case "Gallery":
      case "Embed":
        return (
          <CustomSectionEditable
            section={section}
            resolved={resolved}
            onUpdateSection={onUpdateSection}
            onDeleteSection={onDeleteSection}
            onToggleSectionVisibility={onToggleSectionVisibility}
          />
        );
      default:
        return null;
    }
  };

  const legacySections: Record<PortfolioSectionId, ReactNode> = {
    profile: (
      <LegacySectionShell
        key="profile"
        sectionId="profile"
        reduceMotion={reduceMotion}
        isDark={resolved.isDark}
        reveal={resolved.reveal}
      >
        <ProfileSectionEditable
          draft={draft}
          resolved={resolved}
          onPatchDraft={onPatchDraft}
        />
      </LegacySectionShell>
    ),
    projects: (
      <LegacySectionShell
        key="projects"
        sectionId="projects"
        reduceMotion={reduceMotion}
        isDark={resolved.isDark}
        reveal={resolved.reveal}
      >
        <ItemsGroupEditable
          title="Dự án & chứng chỉ"
          items={projectItems}
          resolved={resolved}
          emptyHint="Chưa có dự án hay chứng chỉ. Đồng bộ để nhập tự động, hoặc thêm thủ công."
          showSyncInEmptyState
          reduceMotion={reduceMotion}
          toGlobalOrder={toGlobalOrder}
          canvasProps={props}
        />
      </LegacySectionShell>
    ),
    activities: (
      <LegacySectionShell
        key="activities"
        sectionId="activities"
        reduceMotion={reduceMotion}
        isDark={resolved.isDark}
        reveal={resolved.reveal}
      >
        <ItemsGroupEditable
          title="Hoạt động ngoại khóa"
          items={activityItems}
          resolved={resolved}
          emptyHint="Chưa có hoạt động. Thêm sở thích hoặc hoạt động ngoại khóa của bạn."
          reduceMotion={reduceMotion}
          toGlobalOrder={toGlobalOrder}
          canvasProps={props}
        />
      </LegacySectionShell>
    ),
    links: (
      <LegacySectionShell
        key="links"
        sectionId="links"
        reduceMotion={reduceMotion}
        isDark={resolved.isDark}
        reveal={resolved.reveal}
      >
        <LinksSectionEditable
          draft={draft}
          resolved={resolved}
          onOpenLinksPanel={onOpenLinksPanel}
        />
      </LegacySectionShell>
    ),
  };

  const dynamicSectionIds = dynamicSections.map((section) => section.id);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[880px] overflow-hidden rounded-[1.5rem]",
        resolved.isDark
          ? "bg-[#121212] text-[#FAFAF5]"
          : "bg-[#FAFAF5] text-[#2D2D2D]",
        resolved.fontScaleClass,
        resolved.lineHeightClass,
        "shadow-[0_24px_60px_rgba(45,45,45,0.10)] ring-1",
        resolved.isDark ? "ring-[#FAFAF5]/10" : "ring-[#E5E5E0]",
      )}
      style={{
        fontFamily: resolved.bodyFontCss,
        ["--pf-primary" as string]: resolved.primaryColor,
        ["--pf-secondary" as string]: resolved.secondaryColor,
        ["--pf-accent" as string]: resolved.accentColor,
      }}
    >
      <PortfolioBackground slot={resolved.background} theme={resolved} />

      <div className="relative px-4 py-8 sm:px-8 sm:py-10">
        {useDynamicSections ? (
          <div className={resolved.densityGapClass}>
            <div data-portfolio-section="profile" className="scroll-mt-28">
              <EditableSection isDark={resolved.isDark}>
                <PortfolioReveal slot="None">
                  <ProfileSectionEditable
                    draft={draft}
                    resolved={resolved}
                    onPatchDraft={onPatchDraft}
                  />
                </PortfolioReveal>
              </EditableSection>
            </div>

            <Reorder.Group
              as="div"
              axis="y"
              values={dynamicSectionIds}
              onReorder={(nextIds: string[]) => onReorderSections?.(nextIds)}
              className={resolved.densityGapClass}
            >
              {dynamicSections.map((section) => (
                <DynamicSectionShell
                  key={section.id}
                  section={section}
                  reduceMotion={reduceMotion}
                  isDark={resolved.isDark}
                  reveal={resolved.reveal}
                  onToggleSectionVisibility={onToggleSectionVisibility}
                  onDeleteSection={onDeleteSection}
                >
                  {renderDynamicSectionBody(section)}
                </DynamicSectionShell>
              ))}
            </Reorder.Group>

            <AddSectionBar onAddSection={onAddSection} />
          </div>
        ) : (
          <Reorder.Group
            as="div"
            axis="y"
            values={sectionOrder}
            onReorder={(next: PortfolioSectionId[]) =>
              onPatchTheme({ ...theme, sectionOrder: next })
            }
            className={resolved.densityGapClass}
          >
            {sectionOrder.map((sectionId) => legacySections[sectionId])}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}
