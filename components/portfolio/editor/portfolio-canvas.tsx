"use client";

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

import { InlineText, InlineTextarea } from "@/components/portfolio/editor/inline-text";
import { Button } from "@/components/ui/button";
import type {
  Portfolio,
  PortfolioItem,
  PortfolioTheme,
} from "@/lib/api/entities/portfolio";
import {
  getPortfolioFontCss,
  getPortfolioLayoutStyleId,
  getPortfolioTemplateId,
  normalizeSectionOrder,
  PORTFOLIO_ITEM_TYPE_LABELS,
  PORTFOLIO_SECTIONS,
  type PortfolioSectionId,
} from "@/lib/portfolio/constants";
import { cn } from "@/lib/utils";

const PROJECT_TYPES = new Set([
  "CapstoneProject",
  "InternalCertificate",
  "ExternalCert",
  "Project",
  "HighlightReel",
]);

const ACTIVITY_TYPES = new Set(["Hobby", "Extracurricular"]);

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
};

/** Floating pill of controls shown when hovering a card/section. */
function HoverChrome({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-full border border-[#E5E5E0] bg-white/95 px-1 py-0.5 shadow-sm backdrop-blur transition-opacity",
        "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
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
  children,
}: {
  label: string;
  onClick?: () => void;
  onPointerDown?: (event: React.PointerEvent) => void;
  destructive?: boolean;
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
        "flex size-7 items-center justify-center rounded-full text-[#6B6B6B] transition-colors hover:bg-[#F5F5F0] hover:text-[#2D2D2D] focus-visible:ring-2 focus-visible:ring-[#4FC3F7] outline-none",
        destructive && "text-[#E94B3C] hover:text-[#E94B3C]",
        grabbable && "cursor-grab touch-none active:cursor-grabbing",
      )}
    >
      {children}
    </button>
  );
}

type ItemCardEditableProps = {
  item: PortfolioItem;
  accent: string;
  reduceMotion: boolean;
  onPatchItemText: PortfolioCanvasProps["onPatchItemText"];
  onCommitReorder: () => void;
  onToggleVisibility: (item: PortfolioItem, visible: boolean) => void;
  onDelete: (item: PortfolioItem) => void;
  onEdit: (item: PortfolioItem) => void;
};

function ItemCardEditable({
  item,
  accent,
  reduceMotion,
  onPatchItemText,
  onCommitReorder,
  onToggleVisibility,
  onDelete,
  onEdit,
}: ItemCardEditableProps) {
  const controls = useDragControls();
  const isAuto = item.source === "AutoImported";

  return (
    <Reorder.Item
      value={item.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onCommitReorder}
      layout="position"
      transition={reduceMotion ? { duration: 0 } : undefined}
      className={cn(
        "group relative rounded-2xl border border-[#E5E5E0] bg-white p-5 shadow-[0_8px_24px_rgba(45,45,45,0.04)]",
        !item.isVisible && "opacity-55",
      )}
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <HoverChrome>
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
          onClick={() => onToggleVisibility(item, !item.isVisible)}
        >
          {item.isVisible ? (
            <EyeOff className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
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

      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6B6B6B]">
          {PORTFOLIO_ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
        </p>
        {!item.isVisible ? (
          <span className="rounded-full bg-[#F5F5F0] px-2 py-0.5 text-[10px] font-medium text-[#6B6B6B]">
            Đang ẩn
          </span>
        ) : null}
      </div>

      <div className="mt-2 text-lg font-semibold tracking-tight text-[#2D2D2D]">
        {isAuto ? (
          <p>{item.title ?? "Không có tiêu đề"}</p>
        ) : (
          <InlineText
            value={item.title ?? ""}
            onChange={(next) => onPatchItemText(item.id, { title: next })}
            ariaLabel="Tiêu đề mục"
            placeholder="Tiêu đề mục…"
            maxLength={255}
          />
        )}
      </div>

      {isAuto ? (
        item.subtitle || item.organization ? (
          <p className="mt-1 text-sm text-[#6B6B6B]">
            {[item.subtitle, item.organization].filter(Boolean).join(" · ")}
          </p>
        ) : null
      ) : (
        <div className="mt-1 flex flex-col gap-1 text-sm text-[#6B6B6B] sm:flex-row sm:gap-2">
          <InlineText
            value={item.subtitle ?? ""}
            onChange={(next) => onPatchItemText(item.id, { subtitle: next })}
            ariaLabel="Phụ đề"
            placeholder="Phụ đề…"
            maxLength={255}
            className="sm:flex-1"
          />
          <InlineText
            value={item.organization ?? ""}
            onChange={(next) => onPatchItemText(item.id, { organization: next })}
            ariaLabel="Tổ chức"
            placeholder="Tổ chức…"
            maxLength={255}
            className="sm:flex-1"
          />
        </div>
      )}

      {isAuto && item.description ? (
        <p className="mt-3 text-sm leading-relaxed text-[#6B6B6B]">
          {item.description}
        </p>
      ) : null}

      <div className="mt-3 text-sm leading-relaxed text-[#2D2D2D]/90">
        <InlineTextarea
          value={item.studentEditedBody ?? ""}
          onChange={(next) =>
            onPatchItemText(item.id, { studentEditedBody: next })
          }
          ariaLabel="Nội dung tường thuật"
          placeholder="Kể câu chuyện của bạn: đã học được gì, tạo ra điều gì…"
        />
      </div>

      {item.mentorEndorsement ? (
        <blockquote className="mt-3 border-l-2 border-[#4FC3F7] pl-3 text-sm italic text-[#6B6B6B]">
          {item.mentorEndorsement}
        </blockquote>
      ) : null}

      {item.externalUrl ? (
        <p className="mt-3 text-sm font-medium text-[#4FC3F7]">
          {item.externalUrl}
        </p>
      ) : null}
    </Reorder.Item>
  );
}

type ItemsGroupEditableProps = {
  title: string;
  items: PortfolioItem[];
  accent: string;
  layoutStyle: string;
  emptyHint: string;
  showSyncInEmptyState?: boolean;
  reduceMotion: boolean;
  toGlobalOrder: (groupIds: string[]) => string[];
  canvasProps: PortfolioCanvasProps;
};

function ItemsGroupEditable({
  title,
  items,
  accent,
  layoutStyle,
  emptyHint,
  showSyncInEmptyState = false,
  reduceMotion,
  toGlobalOrder,
  canvasProps,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">
          {title}
        </h2>
        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1 rounded-full border border-dashed border-[#C9C9C2] px-3 py-1 text-xs font-medium text-[#6B6B6B] opacity-0 transition-opacity hover:border-[#4FC3F7] hover:text-[#2D2D2D] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#4FC3F7] outline-none group-hover/section:opacity-100"
        >
          <Plus className="size-3.5" />
          Thêm mục
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#C9C9C2] bg-white/60 px-4 py-8 text-center">
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
          className={cn(
            layoutStyle === "bento" && "grid gap-4 sm:grid-cols-2",
            layoutStyle === "timeline" &&
              "relative space-y-4 border-l-2 pl-5",
            layoutStyle === "stacked" && "space-y-4",
          )}
          style={
            layoutStyle === "timeline" ? { borderLeftColor: accent } : undefined
          }
        >
          {items.map((item) => (
            <ItemCardEditable
              key={item.id}
              item={item}
              accent={accent}
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
  primary,
  secondary,
  templateId,
  onPatchDraft,
}: {
  draft: Portfolio;
  primary: string;
  secondary: string;
  templateId: string;
  onPatchDraft: PortfolioCanvasProps["onPatchDraft"];
}) {
  const isDarkHero = templateId === "aurora";
  const tone = isDarkHero ? ("dark" as const) : ("light" as const);
  const name =
    draft.displayName || draft.studentName || "Học viên OboxSTEAM";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] p-6 sm:p-8",
        isDarkHero && "text-white",
        templateId === "editorial" && "bg-white text-[#2D2D2D]",
        templateId === "minimal" && "bg-[#FAFAF5] text-[#2D2D2D]",
      )}
      style={
        isDarkHero
          ? {
              background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 55%, #2D2D2D 100%)`,
            }
          : templateId === "editorial"
            ? { borderBottom: `4px solid ${primary}` }
            : { border: "1px solid #E5E5E0" }
      }
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl flex-1">
          <p
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.18em]",
              isDarkHero ? "text-white/70" : "text-[#6B6B6B]",
            )}
          >
            Portfolio STEAM
          </p>
          <div className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
            <InlineText
              value={draft.displayName ?? ""}
              onChange={(next) => onPatchDraft({ displayName: next })}
              ariaLabel="Tên hiển thị"
              placeholder={draft.studentName ?? "Tên của bạn…"}
              tone={tone}
              maxLength={255}
            />
          </div>
          <div className="mt-3 text-lg font-semibold">
            <InlineText
              value={draft.headline ?? ""}
              onChange={(next) => onPatchDraft({ headline: next })}
              ariaLabel="Tiêu đề"
              placeholder="VD: Học viên STEAM · Robotics"
              tone={tone}
              maxLength={255}
            />
          </div>
          <div
            className={cn(
              "mt-2 text-sm leading-relaxed",
              isDarkHero ? "text-white/85" : "text-[#6B6B6B]",
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
              "mt-4 max-w-xl text-sm leading-relaxed",
              isDarkHero ? "text-white/80" : "text-[#2D2D2D]/85",
            )}
          >
            <InlineTextarea
              value={draft.summary ?? ""}
              onChange={(next) => onPatchDraft({ summary: next })}
              ariaLabel="Tóm tắt"
              placeholder="Giới thiệu bản thân, mục tiêu học tập, định hướng…"
              tone={tone}
            />
          </div>
        </div>
        {draft.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote avatar URLs
          <img
            src={draft.avatarUrl}
            alt={name}
            className="h-28 w-28 rounded-2xl object-cover shadow-lg ring-2 ring-white/40 sm:h-32 sm:w-32"
          />
        ) : (
          <div
            className={cn(
              "flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold sm:h-32 sm:w-32",
              !isDarkHero && "bg-[#F5F5F0] text-[#2D2D2D]",
            )}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

function LinksSectionEditable({
  draft,
  primary,
  onOpenLinksPanel,
}: {
  draft: Portfolio;
  primary: string;
  onOpenLinksPanel: () => void;
}) {
  const links = (draft.links ?? []).filter((link) => Boolean(link.url));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">
          Liên kết
        </h2>
        <button
          type="button"
          onClick={onOpenLinksPanel}
          className="flex items-center gap-1 rounded-full border border-dashed border-[#C9C9C2] px-3 py-1 text-xs font-medium text-[#6B6B6B] opacity-0 transition-opacity hover:border-[#4FC3F7] hover:text-[#2D2D2D] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#4FC3F7] outline-none group-hover/section:opacity-100"
        >
          <Pencil className="size-3" />
          Chỉnh liên kết
        </button>
      </div>
      {links.length === 0 ? (
        <button
          type="button"
          onClick={onOpenLinksPanel}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#C9C9C2] bg-white/60 px-4 py-6 text-sm text-[#6B6B6B] transition-colors hover:border-[#4FC3F7] hover:text-[#2D2D2D] focus-visible:ring-2 focus-visible:ring-[#4FC3F7] outline-none"
        >
          <Plus className="size-4" />
          Thêm GitHub, Behance, LinkedIn…
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {links.map((link, index) => (
            <span
              key={`${link.url}-${index}`}
              className="rounded-full px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: primary }}
            >
              {link.label || link.url}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Draggable wrapper around a document section with a hover drag handle. */
function SectionShell({
  sectionId,
  reduceMotion,
  children,
}: {
  sectionId: PortfolioSectionId;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const controls = useDragControls();
  const label =
    PORTFOLIO_SECTIONS.find((section) => section.id === sectionId)?.label ??
    sectionId;

  return (
    <Reorder.Item
      value={sectionId}
      dragListener={false}
      dragControls={controls}
      layout="position"
      transition={reduceMotion ? { duration: 0 } : undefined}
      className="group/section relative"
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
      {children}
    </Reorder.Item>
  );
}

export function PortfolioCanvas(props: PortfolioCanvasProps) {
  const { draft, onPatchDraft, onPatchTheme, onOpenLinksPanel } = props;
  const reduceMotion = useReducedMotion() ?? false;

  const theme = draft.theme;
  const templateId = getPortfolioTemplateId(theme.templateId);
  const layoutStyle = getPortfolioLayoutStyleId(theme.layoutStyle);
  const fontFamily = getPortfolioFontCss(theme.fontFamily);
  const primary = theme.primaryColor || "#E94B3C";
  const secondary = theme.secondaryColor || "#4FC3F7";
  const sectionOrder = useMemo(
    () => normalizeSectionOrder(theme.sectionOrder),
    [theme.sectionOrder],
  );

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

  const sections: Record<PortfolioSectionId, ReactNode> = {
    profile: (
      <SectionShell key="profile" sectionId="profile" reduceMotion={reduceMotion}>
        <ProfileSectionEditable
          draft={draft}
          primary={primary}
          secondary={secondary}
          templateId={templateId}
          onPatchDraft={onPatchDraft}
        />
      </SectionShell>
    ),
    projects: (
      <SectionShell key="projects" sectionId="projects" reduceMotion={reduceMotion}>
        <ItemsGroupEditable
          title="Dự án & chứng chỉ"
          items={projectItems}
          accent={primary}
          layoutStyle={layoutStyle}
          emptyHint="Chưa có dự án hay chứng chỉ. Đồng bộ để nhập tự động, hoặc thêm thủ công."
          showSyncInEmptyState
          reduceMotion={reduceMotion}
          toGlobalOrder={toGlobalOrder}
          canvasProps={props}
        />
      </SectionShell>
    ),
    activities: (
      <SectionShell
        key="activities"
        sectionId="activities"
        reduceMotion={reduceMotion}
      >
        <ItemsGroupEditable
          title="Hoạt động ngoại khóa"
          items={activityItems}
          accent={secondary}
          layoutStyle={layoutStyle}
          emptyHint="Chưa có hoạt động. Thêm sở thích hoặc hoạt động ngoại khóa của bạn."
          reduceMotion={reduceMotion}
          toGlobalOrder={toGlobalOrder}
          canvasProps={props}
        />
      </SectionShell>
    ),
    links: (
      <SectionShell key="links" sectionId="links" reduceMotion={reduceMotion}>
        <LinksSectionEditable
          draft={draft}
          primary={primary}
          onOpenLinksPanel={onOpenLinksPanel}
        />
      </SectionShell>
    ),
  };

  return (
    <div
      className="mx-auto w-full max-w-[880px] overflow-hidden rounded-[1.5rem] bg-[#FAFAF5] text-[#2D2D2D] shadow-[0_24px_60px_rgba(45,45,45,0.10)] ring-1 ring-[#E5E5E0]"
      style={{ fontFamily }}
    >
      <div className="px-4 py-8 sm:px-8 sm:py-12">
        <Reorder.Group
          as="div"
          axis="y"
          values={sectionOrder}
          onReorder={(next: PortfolioSectionId[]) =>
            onPatchTheme({ ...theme, sectionOrder: next })
          }
          className="space-y-10"
        >
          {sectionOrder.map((sectionId) => sections[sectionId])}
        </Reorder.Group>
      </div>
    </div>
  );
}
