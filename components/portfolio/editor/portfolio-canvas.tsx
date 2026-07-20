"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Reorder, useDragControls, useReducedMotion } from "motion/react";
import {
  Calendar,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { EditableSection } from "@/components/portfolio/editor/editable-frame";
import { MediaUploader } from "@/components/portfolio/editor/media-uploader";
import { RichTextEditor } from "@/components/portfolio/editor/rich-text-editor";
import {
  HeroAvatarFrame,
  PortfolioHeroCover,
  PortfolioHeroShell,
} from "@/components/portfolio/hero/portfolio-hero-shell";
import { PortfolioLinkTiles } from "@/components/portfolio/links/portfolio-link-tiles";
import {
  itemSpanClass,
  itemsLayoutClass,
  isTimelineLayout,
  TimelineEntry,
  TimelineList,
} from "@/components/portfolio/render/items-layout";
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
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  Portfolio,
  PortfolioItem,
  PortfolioItemType,
  PortfolioMediaAsset,
  PortfolioSection,
  PortfolioSectionKind,
  PortfolioTheme,
} from "@/lib/api/entities/portfolio";
import {
  parseSectionSettingsJson,
  serializeSectionSettingsJson,
} from "@/lib/api/entities/portfolio";
import { getReadableTextColor, relativeLuminance } from "@/lib/portfolio/color-utils";
import { editorChrome } from "@/lib/portfolio/editor-chrome";
import {
  fromDateInputValue,
  formatPortfolioItemDateRange,
  toDateInputValue,
} from "@/lib/portfolio/item-dates";
import {
  normalizeSectionOrder,
  PORTFOLIO_ITEM_TYPE_LABELS,
  PORTFOLIO_SECTION_KIND_LABELS,
  PORTFOLIO_SECTIONS,
  type PortfolioSectionId,
} from "@/lib/portfolio/constants";
import { getHeroStyle } from "@/lib/portfolio/hero-styles";
import { hasPortfolioHtmlTags } from "@/lib/portfolio/sanitize-html";
import {
  GALLERY_SLOT_OPTIONS,
  HERO_TEXT_SLOT_OPTIONS,
  getPresetPersonality,
  resolvePortfolioTheme,
  type GallerySlotId,
  type ResolvedPortfolioTheme,
} from "@/lib/portfolio/theme-presets";
import { cn } from "@/lib/utils";

const EditorChromeContext = createContext(editorChrome(false));

function useChrome() {
  return useContext(EditorChromeContext);
}

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

/** Drag-only tween — no layout projection (avoids TipTap remeasure thrash). */
const EDITOR_DRAG_TRANSITION = {
  type: "tween" as const,
  duration: 0.14,
  ease: "easeOut" as const,
};

/** Smoother spring for item cards (bento/grid siblings move on layout). */
const EDITOR_ITEM_LAYOUT_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 36,
  mass: 0.55,
};

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
  /** Create a placeholder item of the given type and append it for inline editing. */
  onAddItem: (itemType: PortfolioItemType) => void;
  onSyncItems: () => void;
  isSyncing: boolean;
  isAddingItem?: boolean;
  /** When set, focus the title field of this newly created item. */
  focusItemId?: string | null;
  onFocusItemHandled?: () => void;
  onOpenLinksPanel: () => void;
  onAddSection?: (kind: PortfolioSectionKind) => void;
  onUpdateSection?: (sectionId: string, patch: Partial<PortfolioSection>) => void;
  onDeleteSection?: (sectionId: string) => void;
  /** Draft-only section reorder while dragging. */
  onReorderSections?: (orderedIds: string[]) => void;
  /** Persist section order after a drop. */
  onCommitReorderSections?: () => void;
  onToggleSectionVisibility?: (section: PortfolioSection, visible: boolean) => void;
};

function hasHtmlTags(value: string): boolean {
  return hasPortfolioHtmlTags(value);
}

function stripHtmlText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compact TipTap for titles / one-line fields. */
function CompactRichField({
  value,
  onChange,
  ariaLabel,
  placeholder,
  isDark,
  className,
  maxLength = 200,
  autoFocus = false,
  onAutoFocusHandled,
  /** Keep one line (item cards). Hero name should pass false so large type isn't clipped. */
  singleLine = true,
}: {
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  placeholder?: string;
  isDark?: boolean;
  className?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onAutoFocusHandled?: () => void;
  singleLine?: boolean;
}) {
  return (
    <RichTextEditor
      mode="compact"
      variant="inline"
      singleLine={singleLine}
      isDark={isDark}
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      maxLength={maxLength}
      autoFocus={autoFocus}
      onAutoFocusHandled={onAutoFocusHandled}
      className={cn("min-w-0 max-w-full", className)}
    />
  );
}

/** Section title chrome — primary pill so theme color reads across the page. */
function EditableSectionTitle({
  value,
  onChange,
  placeholder,
  primaryColor,
  headingFontCss,
  monoLabels = false,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  /** Kept for call-site compatibility; pill contrast drives field tone. */
  isDark: boolean;
  primaryColor: string;
  headingFontCss: string;
  monoLabels?: boolean;
}) {
  const onPrimary = getReadableTextColor(primaryColor);
  /** Light text means the pill bg is dark — TipTap placeholders need dark-tone. */
  const fieldIsDark = relativeLuminance(onPrimary) > 0.5;
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center rounded-full px-4 py-1.5",
        monoLabels && "font-mono text-sm uppercase tracking-[0.12em]",
      )}
      style={{
        backgroundColor: primaryColor,
        fontFamily: monoLabels ? undefined : headingFontCss,
        color: onPrimary,
      }}
    >
      <CompactRichField
        value={value}
        onChange={onChange}
        ariaLabel="Tiêu đề phần"
        placeholder={placeholder}
        isDark={fieldIsDark}
        maxLength={200}
        className="min-w-0 max-w-full text-base font-bold tracking-tight [&_*]:text-inherit"
      />
    </div>
  );
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

/** Mini preview tiles — mirrors design-panel SelectBox pattern. */
function GalleryStylePreview({
  id,
  isDark = false,
}: {
  id: GallerySlotId;
  isDark?: boolean;
}) {
  const well = isDark ? "bg-[#2a2a2a]" : "bg-[#F5F5F0]";
  if (id === "DomeGallery") {
    return (
      <div
        className={cn(
          "relative flex h-10 items-end justify-center overflow-hidden rounded-lg",
          isDark ? "bg-[#2a2a2a]" : "bg-[#F0F0EA]",
        )}
      >
        <span className="absolute inset-x-2 bottom-0 h-7 rounded-t-full bg-gradient-to-t from-[#0f7cad]/45 to-[#4FC3F7]/15" />
        <span className="absolute bottom-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-[#0f7cad]" />
      </div>
    );
  }
  if (id === "Accordion") {
    return (
      <div className={cn("flex h-10 gap-0.5 overflow-hidden rounded-lg p-1", well)}>
        <span className="w-2 flex-none rounded-sm bg-[#7CB342]/35" />
        <span className="flex-1 rounded-sm bg-[#7CB342]/55" />
        <span className="w-2 flex-none rounded-sm bg-[#7CB342]/25" />
        <span className="w-2 flex-none rounded-sm bg-[#7CB342]/20" />
      </div>
    );
  }
  if (id === "Carousel") {
    return (
      <div className={cn("flex h-10 items-center gap-1 overflow-hidden rounded-lg px-1", well)}>
        <span className="h-6 w-8 shrink-0 rounded-sm bg-[#4FC3F7]/25" />
        <span className="h-7 w-10 shrink-0 rounded-sm bg-[#4FC3F7]/55" />
        <span className="h-6 w-8 shrink-0 rounded-sm bg-[#4FC3F7]/25" />
      </div>
    );
  }
  return (
    <div className={cn("grid h-10 grid-cols-3 gap-0.5 overflow-hidden rounded-lg p-1", well)}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="rounded-sm bg-[#4FC3F7]/30" />
      ))}
    </div>
  );
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
  const chrome = useChrome();
  return (
    <div
      className={cn(
        "absolute top-2 right-2 z-20 flex items-center gap-0.5 rounded-full border px-1 py-0.5 transition-opacity duration-100",
        chrome.hoverBar,
        alwaysVisible
          ? "opacity-100"
          : // Touch / coarse pointers: always show. Fine pointer: reveal on hover/focus.
            "opacity-100 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100",
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
  const chrome = useChrome();
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
          ? chrome.iconBtnEmphasized
          : destructive
            ? chrome.iconBtnDestructive
            : chrome.iconBtn,
        grabbable && "cursor-grab touch-none active:cursor-grabbing",
      )}
    >
      {children}
    </button>
  );
}

/** Compact badge when an item/section is hidden in the editor. */
function HiddenBadge({ label = "Đang ẩn" }: { label?: string }) {
  const chrome = useChrome();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        chrome.iconBtnEmphasized,
      )}
    >
      {label}
    </span>
  );
}

function ItemMediaRow({
  assets,
  isDark,
  onRemove,
}: {
  assets: PortfolioMediaAsset[];
  isDark: boolean;
  onRemove?: (assetId: string) => void;
}) {
  const sorted = [...assets].sort((a, b) => a.displayOrder - b.displayOrder);
  if (sorted.length === 0) return null;

  return (
    <div className="mt-2 flex max-h-14 flex-wrap gap-1.5 overflow-hidden">
      {sorted.map((asset, index) => (
        <div key={asset.id ?? `${asset.url}-${index}`} className="group/thumb relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary remote media URLs */}
          <img
            src={asset.url!}
            alt={asset.caption ?? ""}
            className={cn(
              "size-14 rounded-lg object-cover ring-1",
              isDark ? "ring-[#FAFAF5]/15" : "ring-[#E5E5E0]",
            )}
          />
          {onRemove && asset.id ? (
            <button
              type="button"
              aria-label="Gỡ ảnh"
              className={cn(
                "absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover/thumb:opacity-100",
                isDark
                  ? "bg-[#FAFAF5] text-[#1a1a1a]"
                  : "bg-[#2D2D2D] text-white",
              )}
              onClick={() => onRemove(asset.id)}
            >
              <X className="size-3" strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
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
  autoFocusTitle?: boolean;
  onAutoFocusHandled?: () => void;
};

function ItemCardEditable({
  item,
  resolved,
  reduceMotion,
  onPatchItemText,
  onCommitReorder,
  onToggleVisibility,
  onDelete,
  autoFocusTitle = false,
  onAutoFocusHandled,
}: ItemCardEditableProps) {
  const controls = useDragControls();
  const isAuto = item.source === "AutoImported";
  const cardSurface = resolved.cardSurfaceClass;
  const attachedMedia = (item.mediaAssets ?? []).filter((asset) =>
    Boolean(asset.url),
  );
  const media =
    attachedMedia.length > 0 ? attachedMedia : itemMediaSources(item);
  const dateRangeLabel = formatPortfolioItemDateRange(item.startDate, item.endDate);

  const isHidden = !item.isVisible;
  const titlePlain =
    stripHtmlText(item.title) || item.title || "Không có tiêu đề";
  /** Free 2D drag in grid layouts — Reorder still sorts on the group axis (y). */
  const isGridLayout =
    resolved.layoutStyle === "bento" || resolved.layoutStyle === "masonry";
  const timeline = isTimelineLayout(resolved.layoutStyle);

  const fieldInputClass = cn(
    "h-8 rounded-lg border-dashed px-2 text-xs shadow-none",
    resolved.isDark
      ? "border-[#FAFAF5]/20 bg-white/5 text-[#FAFAF5] placeholder:text-[#FAFAF5]/40"
      : "border-[#D0D0C8] bg-white/70 text-[#2D2D2D] placeholder:text-[#6B6B6B]/70",
  );

  const dateInputClass = cn(
    fieldInputClass,
    "w-full pr-8",
    // Hide native indicator — Lucide icon below is theme-aware and always visible.
    "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
    resolved.isDark && "[color-scheme:dark]",
  );

  const setMediaAssets = (next: PortfolioMediaAsset[]) => {
    onPatchItemText(item.id, {
      mediaAssets: next.map((asset, index) => ({
        ...asset,
        displayOrder: index,
      })),
      mediaUrl: next[0]?.url ?? null,
    });
  };

  return (
    <Reorder.Item
      as="div"
      value={item.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onCommitReorder}
      {...(isGridLayout ? { drag: true as const } : {})}
      layout={reduceMotion ? undefined : "position"}
      transition={
        reduceMotion
          ? { duration: 0 }
          : isGridLayout
            ? EDITOR_ITEM_LAYOUT_TRANSITION
            : EDITOR_DRAG_TRANSITION
      }
      className={cn(
        "group relative list-none",
        isHidden ? "h-auto" : "h-full",
        itemSpanClass(item.span, resolved.layoutStyle),
      )}
      style={isGridLayout ? { touchAction: "none" } : undefined}
    >
      <TimelineEntry
        enabled={timeline}
        primaryColor={resolved.primaryColor}
        isDark={resolved.isDark}
        dateLabel={timeline && !isHidden ? dateRangeLabel : null}
      >
        <PortfolioCardShell
          slot={resolved.card}
          surfaceClass={cardSurface}
          isDark={resolved.isDark}
          accentColor={resolved.primaryColor}
          effectsEnabled={false}
          radiusClass={getPresetPersonality(resolved.templateId).cardRadiusClass}
          className={cn("h-full", isHidden && "py-2.5")}
        >
        <HoverChrome alwaysVisible={isHidden}>
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
            label={isHidden ? "Hiện mục" : "Ẩn mục"}
            emphasized={isHidden}
            onClick={() => onToggleVisibility(item, !item.isVisible)}
          >
            {isHidden ? (
              <Eye className="size-3.5" strokeWidth={2.25} />
            ) : (
              <EyeOff className="size-3.5" strokeWidth={2.25} />
            )}
          </ChromeButton>
          {!isAuto ? (
            <ChromeButton label="Xóa mục" destructive onClick={() => onDelete(item)}>
              <Trash2 className="size-3.5" />
            </ChromeButton>
          ) : null}
        </HoverChrome>

        {isHidden ? (
          <div className="flex min-w-0 items-center gap-2 pr-24">
            <p
              className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{ color: resolved.primaryColor }}
            >
              {PORTFOLIO_ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
            </p>
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-sm font-semibold tracking-tight",
                resolved.isDark ? "text-[#FAFAF5]/80" : "text-[#2D2D2D]/80",
              )}
              style={{ fontFamily: resolved.headingFontCss }}
            >
              {titlePlain}
            </p>
            <HiddenBadge />
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-col gap-2">
            <div className="flex shrink-0 flex-wrap items-start justify-between gap-2">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.16em]"
                style={{ color: resolved.primaryColor }}
              >
                {PORTFOLIO_ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
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
            </div>

            <div
              className={cn(
                "min-w-0 shrink-0 text-base font-semibold tracking-tight",
                resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
              )}
              style={{ fontFamily: resolved.headingFontCss }}
            >
              {isAuto ? (
                hasHtmlTags(item.title ?? "") ? (
                  <RichText
                    html={item.title}
                    className="line-clamp-2 prose-p:my-0 text-base font-semibold"
                  />
                ) : (
                  <p className="line-clamp-2">{item.title ?? "Không có tiêu đề"}</p>
                )
              ) : (
                <CompactRichField
                  value={item.title ?? ""}
                  onChange={(next) => onPatchItemText(item.id, { title: next })}
                  ariaLabel="Tiêu đề mục"
                  placeholder="Tiêu đề mục…"
                  isDark={resolved.isDark}
                  maxLength={200}
                  autoFocus={autoFocusTitle}
                  onAutoFocusHandled={onAutoFocusHandled}
                />
              )}
            </div>

            {isAuto ? (
              item.subtitle || item.organization ? (
                <div
                  className={cn(
                    "flex min-w-0 shrink-0 items-center gap-x-1.5 overflow-hidden text-sm",
                    resolved.isDark ? "text-[#FAFAF5]/70" : "text-[#6B6B6B]",
                  )}
                >
                  {[item.subtitle, item.organization]
                    .filter(Boolean)
                    .map((part, index) => (
                      <span
                        key={`${item.id}-meta-${index}`}
                        className="inline-flex min-w-0 max-w-[48%] items-center truncate"
                      >
                        {index > 0 ? (
                          <span className="mr-1.5 shrink-0 opacity-50" aria-hidden>
                            ·
                          </span>
                        ) : null}
                        {part && hasHtmlTags(part) ? (
                          <RichText
                            html={part}
                            inline
                            className="min-w-0 truncate text-inherit"
                          />
                        ) : (
                          <span className="min-w-0 truncate">{part}</span>
                        )}
                      </span>
                    ))}
                </div>
              ) : null
            ) : (
              <div
                className={cn(
                  "grid min-w-0 shrink-0 grid-cols-1 items-stretch gap-1.5 text-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center",
                  resolved.isDark ? "text-[#FAFAF5]/70" : "text-[#6B6B6B]",
                )}
              >
                <CompactRichField
                  value={item.subtitle ?? ""}
                  onChange={(next) => onPatchItemText(item.id, { subtitle: next })}
                  ariaLabel="Phụ đề"
                  placeholder="Phụ đề…"
                  isDark={resolved.isDark}
                  maxLength={200}
                  className="min-w-0"
                />
                <span className="hidden shrink-0 opacity-40 sm:inline" aria-hidden>
                  ·
                </span>
                <CompactRichField
                  value={item.organization ?? ""}
                  onChange={(next) =>
                    onPatchItemText(item.id, { organization: next })
                  }
                  ariaLabel="Tổ chức"
                  placeholder="Tổ chức…"
                  isDark={resolved.isDark}
                  maxLength={200}
                  className="min-w-0"
                />
              </div>
            )}

            {!isAuto ? (
              <div className="grid shrink-0 grid-cols-1 gap-2 min-[420px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] min-[420px]:items-center">
                <div className="relative min-w-0">
                  <label className="sr-only" htmlFor={`${item.id}-start`}>
                    Ngày bắt đầu
                  </label>
                  <Input
                    id={`${item.id}-start`}
                    type="date"
                    value={toDateInputValue(item.startDate)}
                    onChange={(event) =>
                      onPatchItemText(item.id, {
                        startDate: fromDateInputValue(event.target.value),
                      })
                    }
                    className={dateInputClass}
                    aria-label="Ngày bắt đầu"
                  />
                  <Calendar
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2",
                      resolved.isDark ? "text-[#FAFAF5]" : "text-[#6B6B6B]",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "hidden text-center text-xs opacity-40 min-[420px]:block",
                    resolved.isDark ? "text-[#FAFAF5]" : "text-[#6B6B6B]",
                  )}
                  aria-hidden
                >
                  –
                </span>
                <div className="relative min-w-0">
                  <label className="sr-only" htmlFor={`${item.id}-end`}>
                    Ngày kết thúc
                  </label>
                  <Input
                    id={`${item.id}-end`}
                    type="date"
                    value={toDateInputValue(item.endDate)}
                    onChange={(event) =>
                      onPatchItemText(item.id, {
                        endDate: fromDateInputValue(event.target.value),
                      })
                    }
                    className={dateInputClass}
                    aria-label="Ngày kết thúc"
                  />
                  <Calendar
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2",
                      resolved.isDark ? "text-[#FAFAF5]" : "text-[#6B6B6B]",
                    )}
                  />
                </div>
              </div>
            ) : dateRangeLabel && !timeline ? (
              <p
                className={cn(
                  "shrink-0 truncate text-xs",
                  resolved.isDark ? "text-[#FAFAF5]/55" : "text-[#6B6B6B]",
                )}
              >
                {dateRangeLabel}
              </p>
            ) : null}

            {isAuto && item.description ? (
              hasHtmlTags(item.description) ? (
                <RichText
                  html={item.description}
                  className="line-clamp-3 shrink-0 text-sm"
                />
              ) : (
                <p
                  className={cn(
                    "line-clamp-3 shrink-0 text-sm leading-relaxed",
                    resolved.isDark ? "text-[#FAFAF5]/85" : "text-[#6B6B6B]",
                  )}
                >
                  {item.description}
                </p>
              )
            ) : null}

            <div className="min-w-0 shrink-0">
              <RichTextEditor
                mode="full"
                variant="inline"
                isDark={resolved.isDark}
                value={item.studentEditedBody ?? ""}
                onChange={(next) =>
                  onPatchItemText(item.id, { studentEditedBody: next })
                }
                ariaLabel="Nội dung tường thuật"
                placeholder="Kể câu chuyện của bạn: đã học được gì, tạo ra điều gì…"
                maxHeightClass="h-[5.25rem] max-h-[5.25rem]"
                className={cn(
                  resolved.isDark ? "text-[#FAFAF5]/90" : "text-[#2D2D2D]/90",
                )}
              />
            </div>

            <div className="mt-0.5 shrink-0 space-y-2">
              <div className="flex min-w-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center">
                <MediaUploader
                  compact
                  hideAttachedList
                  isDark={resolved.isDark}
                  assets={attachedMedia}
                  onChange={setMediaAssets}
                  label="ảnh"
                  className="shrink-0"
                />
                {!isAuto ? (
                  <Input
                    type="url"
                    value={item.externalUrl ?? ""}
                    onChange={(event) =>
                      onPatchItemText(item.id, {
                        externalUrl: event.target.value || null,
                      })
                    }
                    placeholder="https:// — liên kết ngoài"
                    className={cn(
                      fieldInputClass,
                      "min-w-0 flex-1 truncate",
                    )}
                    aria-label="URL ngoài"
                  />
                ) : item.externalUrl ? (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-xs font-medium underline-offset-2 hover:underline"
                    style={{ color: resolved.primaryColor }}
                  >
                    {item.externalUrl}
                  </a>
                ) : null}
              </div>
              <ItemMediaRow
                assets={media}
                isDark={resolved.isDark}
                onRemove={(assetId) => {
                  if (attachedMedia.length === 0) {
                    onPatchItemText(item.id, {
                      mediaUrl: null,
                      mediaAssets: [],
                    });
                    return;
                  }
                  setMediaAssets(
                    attachedMedia.filter((asset) => asset.id !== assetId),
                  );
                }}
              />
            </div>

            {item.mentorEndorsement ? (
              <blockquote
                className={cn(
                  "line-clamp-3 shrink-0 border-l-2 pl-3 text-sm italic",
                  resolved.isDark
                    ? "border-[#4FC3F7] text-[#FAFAF5]/75"
                    : "border-[#4FC3F7] text-[#6B6B6B]",
                )}
              >
                {item.mentorEndorsement}
              </blockquote>
            ) : null}
          </div>
        )}
      </PortfolioCardShell>
      </TimelineEntry>
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
  /** Item type created when pressing Thêm mục in this section. */
  defaultItemType: PortfolioItemType;
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
  defaultItemType,
  onTitleChange,
  dimmed = false,
}: ItemsGroupEditableProps) {
  const {
    onPreviewReorder,
    onCommitReorder,
    onPatchItemText,
    onToggleItemVisibility,
    onDeleteItem,
    onAddItem,
    onSyncItems,
    isSyncing,
    isAddingItem = false,
    focusItemId,
    onFocusItemHandled,
  } = canvasProps;

  const groupIds = items.map((item) => item.id);
  const layoutClass = itemsLayoutClass(resolved.layoutStyle, "editor");
  const timeline = isTimelineLayout(resolved.layoutStyle);
  const chrome = useChrome();

  return (
    <div className="relative space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {onTitleChange ? (
          <EditableSectionTitle
            value={title}
            onChange={onTitleChange}
            placeholder="Tiêu đề phần…"
            isDark={resolved.isDark}
            primaryColor={resolved.primaryColor}
            headingFontCss={resolved.headingFontCss}
            monoLabels={getPresetPersonality(resolved.templateId).monoLabels}
          />
        ) : (
          <h2
            className={cn(
              "inline-flex max-w-full items-center rounded-full px-4 py-1.5 text-base font-bold tracking-tight",
              getPresetPersonality(resolved.templateId).monoLabels &&
                "font-mono text-sm uppercase tracking-[0.12em]",
            )}
            style={{
              fontFamily: getPresetPersonality(resolved.templateId).monoLabels
                ? undefined
                : resolved.headingFontCss,
              backgroundColor: resolved.primaryColor,
              color: getReadableTextColor(resolved.primaryColor),
            }}
          >
            {hasHtmlTags(title) ? (
              <RichText html={title} className="prose-p:my-0 text-inherit" />
            ) : (
              title
            )}
          </h2>
        )}
        {dimmed ? <HiddenBadge label="Phần đang ẩn" /> : null}
      </div>

      {dimmed ? null : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <div
              className={cn(
                "flex flex-col items-center gap-3 px-4 py-6 text-center",
                chrome.panel,
              )}
            >
              <p className={cn("text-sm", chrome.muted)}>{emptyHint}</p>
              {showSyncInEmptyState ? (
                <Button
                  type="button"
                  variant="outline"
                  className={cn("h-9 rounded-xl", chrome.outlineBtn)}
                  disabled={isSyncing}
                  onClick={onSyncItems}
                >
                  <RefreshCw
                    className={cn("size-4", isSyncing && "animate-spin")}
                  />
                  Đồng bộ
                </Button>
              ) : null}
            </div>
          ) : (
            (() => {
              const list = (
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
                      autoFocusTitle={focusItemId === item.id}
                      onAutoFocusHandled={onFocusItemHandled}
                    />
                  ))}
                </Reorder.Group>
              );

              return timeline ? (
                <TimelineList
                  primaryColor={resolved.primaryColor}
                  isDark={resolved.isDark}
                >
                  {list}
                </TimelineList>
              ) : (
                list
              );
            })()
          )}

          <button
            type="button"
            disabled={isAddingItem}
            onClick={() => onAddItem(defaultItemType)}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#4FC3F7] outline-none disabled:pointer-events-none disabled:opacity-50",
              chrome.dashedCta,
            )}
            style={
              resolved.isDark
                ? undefined
                : {
                    borderColor: `${resolved.primaryColor}66`,
                    color: resolved.primaryColor,
                  }
            }
          >
            <Plus className="size-3.5" />
            {isAddingItem ? "Đang thêm…" : "Thêm mục"}
          </button>
        </div>
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
    stripHtmlText(draft.displayName) ||
    draft.studentName ||
    "Học viên OboxSTEAM";

  const heroHint =
    HERO_TEXT_SLOT_OPTIONS.find((option) => option.id === resolved.heroText)
      ?.label ?? resolved.heroText;
  const heroStyle = getHeroStyle(resolved.heroText);
  const onAccent = getReadableTextColor(resolved.accentColor);
  const onPrimary = getReadableTextColor(resolved.primaryColor);

  const nameClass = cn(
    heroStyle.nameClass,
    resolved.heroText === "Decrypted" && "font-mono",
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
    <PortfolioHeroShell
      slot={resolved.heroText}
      isDark={resolved.isDark}
      primaryColor={resolved.primaryColor}
      secondaryColor={resolved.secondaryColor}
      accentColor={resolved.accentColor}
      cover={
        <PortfolioHeroCover
          slot={resolved.heroText}
          coverImageUrl={draft.coverImageUrl}
          isDark={resolved.isDark}
          primaryColor={resolved.primaryColor}
          secondaryColor={resolved.secondaryColor}
          accentColor={resolved.accentColor}
          overlay={
            <div className="rounded-xl bg-white p-2 text-[#2D2D2D] shadow-sm ring-1 ring-[#E5E5E0]">
              <MediaUploader
                label="ảnh bìa"
                isDark={false}
                onUploadedUrl={(url) => onPatchDraft({ coverImageUrl: url })}
                crop={{
                  aspect: 2.5,
                  cropShape: "rect",
                  title: "Cắt ảnh bìa",
                  description:
                    "Kéo và thu phóng để chọn vùng hiển thị trên portfolio.",
                  outputWidth: 1600,
                  outputHeight: 640,
                }}
              />
            </div>
          }
        />
      }
      eyebrowExtra={
        resolved.heroText !== "Plain" ? (
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: resolved.accentColor,
              color: onAccent,
            }}
          >
            Hero: {heroHint}
          </span>
        ) : null
      }
      avatar={
        <div className="flex shrink-0 flex-col items-center gap-2">
          <HeroAvatarFrame
            style={heroStyle}
            primaryColor={resolved.primaryColor}
            accentColor={resolved.accentColor}
            name={name}
            avatarUrl={draft.avatarUrl}
            textColor={onPrimary}
          />
          <MediaUploader
            label="avatar"
            isDark={resolved.isDark}
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
      }
    >
      <div className="mt-3 space-y-2">
        <div className={nameClass} style={nameStyle}>
          <CompactRichField
            value={draft.displayName ?? ""}
            onChange={(next) => onPatchDraft({ displayName: next })}
            ariaLabel="Tên hiển thị"
            placeholder={draft.studentName ?? "Tên của bạn…"}
            singleLine={false}
            isDark={
              resolved.heroText === "SplitGradient" ? false : tone === "dark"
            }
          />
        </div>

        <div
          className={cn(
            heroStyle.headlineClass,
            resolved.heroText === "Decrypted" && "font-mono",
            resolved.isDark ? "text-[#FAFAF5]/90" : "text-[#2D2D2D]",
          )}
          style={{ fontFamily: resolved.headingFontCss }}
        >
          <CompactRichField
            value={draft.headline ?? ""}
            onChange={(next) => onPatchDraft({ headline: next })}
            ariaLabel="Tiêu đề"
            placeholder="VD: Học viên STEAM · Robotics"
            isDark={resolved.isDark}
          />
        </div>
      </div>

      <div
        className={cn(
          heroStyle.taglineClass,
          resolved.isDark ? "text-[#FAFAF5]/75" : "text-[#5C5C5C]",
        )}
      >
        <CompactRichField
          value={draft.tagline ?? ""}
          onChange={(next) => onPatchDraft({ tagline: next })}
          ariaLabel="Tagline"
          placeholder="Một câu ngắn về hành trình của bạn…"
          isDark={resolved.isDark}
        />
      </div>

      <div
        className={cn(
          "mt-3 max-w-xl",
          resolved.isDark ? "text-[#FAFAF5]/90" : "text-[#2D2D2D]",
        )}
      >
        <RichTextEditor
          mode="full"
          variant="inline"
          isDark={resolved.isDark}
          value={draft.summary ?? ""}
          onChange={(next) => onPatchDraft({ summary: next })}
          ariaLabel="Tóm tắt"
          placeholder="Giới thiệu bản thân, mục tiêu học tập, định hướng…"
        />
      </div>
    </PortfolioHeroShell>
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
  const chrome = useChrome();
  const links = (draft.links ?? []).filter((link) => Boolean(link.url));

  return (
    <div className="relative space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {onTitleChange ? (
          <EditableSectionTitle
            value={title}
            onChange={onTitleChange}
            placeholder="Liên kết"
            isDark={resolved.isDark}
            primaryColor={resolved.primaryColor}
            headingFontCss={resolved.headingFontCss}
            monoLabels={getPresetPersonality(resolved.templateId).monoLabels}
          />
        ) : (
          <h2
            className={cn(
              "inline-flex max-w-full items-center rounded-full px-4 py-1.5 text-base font-bold tracking-tight",
              getPresetPersonality(resolved.templateId).monoLabels &&
                "font-mono text-sm uppercase tracking-[0.12em]",
            )}
            style={{
              fontFamily: getPresetPersonality(resolved.templateId).monoLabels
                ? undefined
                : resolved.headingFontCss,
              backgroundColor: resolved.primaryColor,
              color: getReadableTextColor(resolved.primaryColor),
            }}
          >
            {title}
          </h2>
        )}
        {dimmed ? <HiddenBadge label="Phần đang ẩn" /> : null}
        {dimmed ? null : (
          <button
            type="button"
            onClick={onOpenLinksPanel}
            className="ml-auto flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold opacity-0 transition-opacity duration-100 group-hover/section:opacity-100 focus-visible:opacity-100"
            style={{
              backgroundColor: resolved.primaryColor,
              color: getReadableTextColor(resolved.primaryColor),
            }}
          >
            <Pencil className="size-3" />
            Chỉnh liên kết
          </button>
        )}
      </div>

      {dimmed ? null : links.length === 0 ? (
        <button
          type="button"
          onClick={onOpenLinksPanel}
          className={cn(
            "flex w-full items-center justify-center gap-2 border-2 px-4 py-5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]",
            chrome.dashedCta,
          )}
          style={
            resolved.isDark
              ? undefined
              : {
                  borderColor: `${resolved.primaryColor}66`,
                  color: resolved.primaryColor,
                  backgroundColor: `${resolved.primaryColor}0d`,
                }
          }
        >
          <Plus className="size-4" />
          Thêm GitHub, Behance, LinkedIn…
        </button>
      ) : (
        <PortfolioLinkTiles
          links={links}
          isDark={resolved.isDark}
          interactive={false}
        />
      )}
    </div>
  );
}

function CustomSectionEditable({
  section,
  resolved,
  onUpdateSection,
}: {
  section: PortfolioSection;
  resolved: ResolvedPortfolioTheme;
  onUpdateSection?: PortfolioCanvasProps["onUpdateSection"];
}) {
  const dimmed = !section.isVisible;
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [draftCaption, setDraftCaption] = useState("");

  const patch = (next: Partial<PortfolioSection>) => {
    onUpdateSection?.(section.id, next);
  };

  const sortedAssets = useMemo(
    () =>
      [...(section.mediaAssets ?? [])]
        .filter((asset) => Boolean(asset.url))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [section.mediaAssets],
  );

  const editingAsset =
    editingAssetId == null
      ? null
      : (sortedAssets.find((asset) => asset.id === editingAssetId) ?? null);

  const openCaptionEditor = (index: number) => {
    const asset = sortedAssets[index];
    if (!asset) return;
    setEditingAssetId(asset.id);
    setDraftCaption(asset.caption ?? "");
  };

  const closeCaptionEditor = () => {
    setEditingAssetId(null);
    setDraftCaption("");
  };

  const saveCaption = () => {
    if (!editingAsset) return;
    patch({
      mediaAssets: (section.mediaAssets ?? []).map((asset) =>
        asset.id === editingAsset.id
          ? { ...asset, caption: draftCaption.trim() || null }
          : asset,
      ),
    });
    closeCaptionEditor();
  };

  const removeEditingAsset = () => {
    if (!editingAsset) return;
    patch({
      mediaAssets: (section.mediaAssets ?? []).filter(
        (asset) => asset.id !== editingAsset.id,
      ),
    });
    closeCaptionEditor();
  };

  return (
    <div className="relative space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <EditableSectionTitle
          value={section.title ?? ""}
          onChange={(next) => patch({ title: next })}
          placeholder={
            PORTFOLIO_SECTION_KIND_LABELS[section.kind] ?? "Tiêu đề phần…"
          }
          isDark={resolved.isDark}
          primaryColor={resolved.primaryColor}
          headingFontCss={resolved.headingFontCss}
          monoLabels={getPresetPersonality(resolved.templateId).monoLabels}
        />
        {dimmed ? <HiddenBadge label="Phần đang ẩn" /> : null}
      </div>

      {dimmed ? null : (
        <>
          {section.kind === "RichText" ? (
            <RichTextEditor
              mode="full"
              variant="inline"
              isDark={resolved.isDark}
              value={section.contentHtml ?? ""}
              onChange={(next) => patch({ contentHtml: next })}
              ariaLabel="Nội dung văn bản"
              placeholder="Viết nội dung cho phần này…"
            />
          ) : null}

          {section.kind === "Gallery" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.14em]",
                    resolved.isDark ? "text-[#FAFAF5]/55" : "text-[#6B6B6B]",
                  )}
                >
                  Kiểu thư viện
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {GALLERY_SLOT_OPTIONS.map((option) => {
                    const selected =
                      resolveGalleryVariant(section, resolved) === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={selected}
                        aria-label={option.label}
                        onClick={() => {
                          const current =
                            parseSectionSettingsJson(section.settingsJson) ??
                            {};
                          patch({
                            settingsJson: serializeSectionSettingsJson({
                              ...current,
                              variant: option.id,
                            }),
                          });
                        }}
                        className={cn(
                          "rounded-2xl border p-2 text-left transition-colors outline-none",
                          "focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
                          "active:scale-[0.98]",
                          selected
                            ? resolved.isDark
                              ? "border-[#4FC3F7] bg-[rgba(79,195,247,0.14)]"
                              : "border-[#4FC3F7] bg-[rgba(79,195,247,0.08)]"
                            : resolved.isDark
                              ? "border-[#FAFAF5]/12 bg-[#1a1a1a]/80 hover:border-[#FAFAF5]/22 hover:bg-[#222]"
                              : "border-[#E5E5E0] bg-white hover:border-[#C9C9C2] hover:bg-[#FAFAF5]",
                        )}
                      >
                        <GalleryStylePreview
                          id={option.id}
                          isDark={resolved.isDark}
                        />
                        <p
                          className={cn(
                            "mt-1.5 truncate text-[11px] font-semibold tracking-tight",
                            resolved.isDark
                              ? "text-[#FAFAF5]/90"
                              : "text-[#2D2D2D]",
                          )}
                        >
                          {option.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <MediaUploader
                assets={section.mediaAssets}
                onChange={(assets) => patch({ mediaAssets: assets })}
                label="Ảnh thư viện"
                isDark={resolved.isDark}
                hideAttachedList
              />

              {sortedAssets.length > 0 ? (
                <p
                  className={cn(
                    "text-[11px]",
                    resolved.isDark ? "text-[#FAFAF5]/45" : "text-[#8A8A84]",
                  )}
                >
                  Nhấp vào ảnh để sửa chú thích hoặc gỡ ảnh
                </p>
              ) : null}

              <PortfolioGallery
                slot={resolveGalleryVariant(section, resolved)}
                images={sectionMediaToGalleryImages(section.mediaAssets)}
                onImageActivate={openCaptionEditor}
                isDark={resolved.isDark}
                primaryColor={resolved.primaryColor}
                backgroundStyle={resolved.backgroundStyle}
              />

              <Dialog
                open={editingAsset != null}
                onOpenChange={(open) => {
                  if (!open) closeCaptionEditor();
                }}
              >
                <DialogPopup className="max-w-sm">
                  <DialogClose />
                  <DialogHeader>
                    <DialogTitle>Chỉnh ảnh</DialogTitle>
                    <DialogDescription>
                      Cập nhật chú thích hiển thị trên thư viện, hoặc gỡ ảnh
                      khỏi phần này.
                    </DialogDescription>
                  </DialogHeader>

                  {editingAsset?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editingAsset.url}
                      alt=""
                      className="mt-1 aspect-video w-full rounded-xl object-cover"
                    />
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="gallery-caption">Chú thích</Label>
                    <Input
                      id="gallery-caption"
                      value={draftCaption}
                      onChange={(event) => setDraftCaption(event.target.value)}
                      placeholder="Mô tả ngắn cho ảnh…"
                      className="rounded-xl"
                      autoFocus
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          saveCaption();
                        }
                      }}
                    />
                  </div>

                  <DialogFooter className="gap-2 sm:justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl text-[#E94B3C] hover:bg-[#E94B3C]/10 hover:text-[#E94B3C]"
                      onClick={removeEditingAsset}
                    >
                      <Trash2 className="size-3.5" />
                      Gỡ ảnh
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={closeCaptionEditor}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="button"
                        className="rounded-xl"
                        onClick={saveCaption}
                      >
                        Lưu
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogPopup>
              </Dialog>
            </div>
          ) : null}

          {section.kind === "Embed" ? (
            <div className="space-y-3">
              <RichTextEditor
                mode="full"
                variant="inline"
                isDark={resolved.isDark}
                value={section.contentHtml ?? ""}
                onChange={(next) => patch({ contentHtml: next })}
                ariaLabel="URL hoặc mã nhúng"
                placeholder="Dán URL (YouTube, Figma…) hoặc HTML nhúng…"
              />
              {section.contentHtml?.trim() &&
              looksLikeUrl(section.contentHtml) ? (
                <iframe
                  src={normalizeEmbedUrl(section.contentHtml)}
                  title={section.title ?? "Nhúng nội dung"}
                  className={cn(
                    "h-56 w-full rounded-xl border",
                    resolved.isDark
                      ? "border-[#FAFAF5]/15"
                      : "border-[#E5E5E0]",
                  )}
                />
              ) : section.contentHtml?.trim() ? (
                <RichText html={section.contentHtml} />
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Draggable wrapper around a legacy document section with a hover drag handle. */
function LegacySectionShell({
  sectionId,
  reduceMotion,
  isDark,
  reveal,
  onCommitReorder,
  children,
}: {
  sectionId: PortfolioSectionId;
  reduceMotion: boolean;
  isDark: boolean;
  reveal: ResolvedPortfolioTheme["reveal"];
  onCommitReorder?: () => void;
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
      transition={reduceMotion ? { duration: 0 } : EDITOR_DRAG_TRANSITION}
      onDragEnd={onCommitReorder}
      className="group/section relative list-none"
      data-portfolio-section={sectionId}
    >
      <div
        className={cn(
          "absolute -top-3 right-2 z-20 flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full border border-[#E5E5E0] bg-white px-2 py-1 shadow-sm transition-opacity duration-100 sm:right-3",
          "opacity-100 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover/section:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:focus-within:opacity-100",
        )}
      >
        <span className="max-w-[6rem] truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[#6B6B6B] sm:max-w-none">
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

/** Shared section toolbar — always light chrome so icons stay readable on dark themes. */
function SectionToolbarButton({
  label,
  onClick,
  onPointerDown,
  destructive = false,
  emphasized = false,
  grabbable = false,
  children,
}: {
  label: string;
  onClick?: () => void;
  onPointerDown?: (event: React.PointerEvent) => void;
  destructive?: boolean;
  emphasized?: boolean;
  grabbable?: boolean;
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
        "flex size-7 items-center justify-center rounded-full transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/50",
        emphasized
          ? "bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]"
          : destructive
            ? "text-[#E94B3C] hover:bg-[#E94B3C]/12 hover:text-[#c53e32]"
            : "text-[#2D2D2D] hover:bg-[#F0F0EA]",
        grabbable && "cursor-grab touch-none active:cursor-grabbing",
      )}
    >
      {children}
    </button>
  );
}

function DynamicSectionShell({
  section,
  reduceMotion,
  isDark,
  reveal,
  onToggleSectionVisibility,
  onDeleteSection,
  onCommitReorder,
  children,
}: {
  section: PortfolioSection;
  reduceMotion: boolean;
  isDark: boolean;
  reveal: ResolvedPortfolioTheme["reveal"];
  onToggleSectionVisibility?: PortfolioCanvasProps["onToggleSectionVisibility"];
  onDeleteSection?: PortfolioCanvasProps["onDeleteSection"];
  onCommitReorder?: () => void;
  children: ReactNode;
}) {
  const controls = useDragControls();
  const label =
    section.title ||
    PORTFOLIO_SECTION_KIND_LABELS[section.kind] ||
    section.kind;
  const isHidden = !section.isVisible;

  return (
    <Reorder.Item
      as="div"
      value={section.id}
      dragListener={false}
      dragControls={controls}
      transition={reduceMotion ? { duration: 0 } : EDITOR_DRAG_TRANSITION}
      onDragEnd={onCommitReorder}
      className="group/section relative list-none"
      data-portfolio-section={section.id}
    >
      <div
        className={cn(
          "absolute -top-3 right-2 z-20 flex max-w-[calc(100%-1rem)] items-center gap-0.5 rounded-full border border-[#E5E5E0] bg-white px-1.5 py-0.5 shadow-sm transition-opacity duration-100 sm:right-3",
          isHidden
            ? "opacity-100"
            : "opacity-100 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover/section:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:focus-within:opacity-100",
        )}
      >
        <span className="max-w-[6rem] truncate px-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2D2D2D] sm:max-w-[10rem] sm:px-1.5">
          {label}
        </span>
        {onToggleSectionVisibility ? (
          <SectionToolbarButton
            label={section.isVisible ? "Ẩn phần" : "Hiện phần"}
            emphasized={isHidden}
            onClick={() =>
              onToggleSectionVisibility(section, !section.isVisible)
            }
          >
            {section.isVisible ? (
              <EyeOff className="size-3.5" strokeWidth={2.25} />
            ) : (
              <Eye className="size-3.5" strokeWidth={2.25} />
            )}
          </SectionToolbarButton>
        ) : null}
        {onDeleteSection ? (
          <SectionToolbarButton
            label="Xóa phần"
            destructive
            onClick={() => onDeleteSection(section.id)}
          >
            <Trash2 className="size-3.5" strokeWidth={2.25} />
          </SectionToolbarButton>
        ) : null}
        <SectionToolbarButton
          label={`Kéo để sắp xếp phần ${label}`}
          grabbable
          onPointerDown={(event) => {
            event.preventDefault();
            controls.start(event);
          }}
        >
          <GripVertical className="size-3.5" strokeWidth={2.25} />
        </SectionToolbarButton>
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
  const chrome = useChrome();
  if (!onAddSection) return null;

  const kinds: PortfolioSectionKind[] = ["RichText", "Gallery", "Embed"];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 px-4 py-3",
        chrome.panel,
      )}
    >
      <span className={cn("text-xs font-medium", chrome.muted)}>Thêm phần:</span>
      {kinds.map((kind) => (
        <Button
          key={kind}
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-8 rounded-lg text-xs", chrome.outlineBtn)}
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
    onCommitReorderSections,
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
            defaultItemType="Project"
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
            defaultItemType="Hobby"
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
          defaultItemType="Project"
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
          defaultItemType="Hobby"
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
  const personality = getPresetPersonality(resolved.templateId);
  const chrome = useMemo(
    () => editorChrome(resolved.isDark),
    [resolved.isDark],
  );

  return (
    <EditorChromeContext.Provider value={chrome}>
    <div
      className={cn(
        "relative mx-auto w-full max-w-[880px] overflow-x-clip overflow-y-visible rounded-2xl sm:rounded-[1.5rem]",
        resolved.isDark ? "text-[#FAFAF5]" : "text-[#2D2D2D]",
        personality.paperWash && !resolved.isDark && "bg-[#FDFBF7]/50",
        "shadow-[0_24px_60px_rgba(45,45,45,0.10)] ring-1",
        resolved.isDark ? "ring-[#FAFAF5]/10" : "ring-[#E5E5E0]",
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
          "relative z-10 px-3 py-6 sm:px-8 sm:py-10",
          personality.sectionPadClass,
        )}
      >
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
                  onCommitReorder={onCommitReorderSections}
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
    </EditorChromeContext.Provider>
  );
}
