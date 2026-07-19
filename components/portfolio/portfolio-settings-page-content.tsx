"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Sparkles } from "lucide-react";

import { PortfolioCanvas } from "@/components/portfolio/editor/portfolio-canvas";
import {
  PortfolioPanelHost,
  PortfolioRail,
  type PortfolioPanelId,
} from "@/components/portfolio/editor/portfolio-rail";
import { SectionOutlinePanel } from "@/components/portfolio/editor/section-outline-panel";
import { PortfolioToolbar } from "@/components/portfolio/editor/portfolio-toolbar";
import { DesignPanel } from "@/components/portfolio/editor/panels/design-panel";
import { ItemsPanel } from "@/components/portfolio/editor/panels/items-panel";
import { LinksPanel } from "@/components/portfolio/editor/panels/links-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ApiRequestError } from "@/lib/api/errors";
import type {
  Portfolio,
  PortfolioItem,
  PortfolioItemType,
  PortfolioLink,
  PortfolioMediaAsset,
  PortfolioSection,
  PortfolioSectionKind,
  PortfolioTheme,
} from "@/lib/api/entities/portfolio";
import {
  createPortfolio,
  createPortfolioItem,
  createPortfolioSection,
  deletePortfolioItem,
  deletePortfolioSection,
  getMyPortfolio,
  reorderPortfolioItems,
  reorderPortfolioSections,
  syncPortfolioItems,
  updateMyPortfolio,
  updatePortfolioItem,
  updatePortfolioSection,
} from "@/lib/api/portfolios";
import type { UpdatePortfolioItemInput } from "@/lib/validations/portfolios";
import { isParentRole, isStudentRole } from "@/lib/auth/roles";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  getPortfolioLayoutStyleId,
  getPortfolioTemplateId,
  normalizeSectionOrder,
  PORTFOLIO_FONTS,
  PORTFOLIO_SECTION_KIND_LABELS,
  PORTFOLIO_SECTIONS,
} from "@/lib/portfolio/constants";
import { nullIfEmptyHtml, preferAlignedHtml } from "@/lib/portfolio/sanitize-html";

const PANEL_TITLES: Record<PortfolioPanelId, string> = {
  design: "Thiết kế & Font",
  items: "Mục portfolio",
  links: "Liên kết ngoài",
};

type PendingDelete =
  | { kind: "item"; item: PortfolioItem }
  | { kind: "section"; sectionId: string; label: string };

/** Inline-editable fields that the global Save persists per item. */
const ITEM_TEXT_FIELDS = [
  "title",
  "subtitle",
  "organization",
  "studentEditedBody",
  "externalUrl",
  "startDate",
  "endDate",
] as const;

function textValue(value: string | null | undefined): string {
  return value ?? "";
}

function mediaAssetsSignature(
  assets: PortfolioMediaAsset[] | null | undefined,
): string {
  return (assets ?? [])
    .map(
      (asset) =>
        `${asset.id ?? ""}:${asset.caption ?? ""}:${asset.displayOrder ?? 0}`,
    )
    .join("|");
}

function isItemTextDirty(draftItem: PortfolioItem, baseItem: PortfolioItem): boolean {
  const textDirty = ITEM_TEXT_FIELDS.some(
    (field) => textValue(draftItem[field]) !== textValue(baseItem[field]),
  );
  if (textDirty) return true;
  return (
    mediaAssetsSignature(draftItem.mediaAssets) !==
    mediaAssetsSignature(baseItem.mediaAssets)
  );
}

function toMediaAssetRefs(item: PortfolioItem) {
  return (item.mediaAssets ?? []).map((asset, index) => ({
    id: asset.id,
    caption: asset.caption,
    displayOrder: asset.displayOrder ?? index,
  }));
}

function isProfileDirty(draft: Portfolio, baseline: Portfolio): boolean {
  return (
    textValue(draft.displayName) !== textValue(baseline.displayName) ||
    textValue(draft.headline) !== textValue(baseline.headline) ||
    textValue(draft.tagline) !== textValue(baseline.tagline) ||
    textValue(draft.summary) !== textValue(baseline.summary) ||
    textValue(draft.avatarUrl) !== textValue(baseline.avatarUrl) ||
    textValue(draft.coverImageUrl) !== textValue(baseline.coverImageUrl)
  );
}

function isThemeDirty(draft: Portfolio, baseline: Portfolio): boolean {
  return JSON.stringify(draft.theme) !== JSON.stringify(baseline.theme);
}

function isLinksDirty(draft: Portfolio, baseline: Portfolio): boolean {
  return (
    JSON.stringify(draft.links ?? []) !== JSON.stringify(baseline.links ?? [])
  );
}

/**
 * Adopt a fresh server portfolio as baseline while keeping the draft's
 * unsaved text edits (profile, theme, links, item text) on top of it.
 */
function mergeServerStructural(server: Portfolio, draft: Portfolio): Portfolio {
  return {
    ...server,
    displayName: draft.displayName,
    headline: draft.headline,
    tagline: draft.tagline,
    summary: draft.summary,
    avatarUrl: draft.avatarUrl,
    coverImageUrl: draft.coverImageUrl,
    theme: draft.theme,
    links: draft.links,
    items: (server.items ?? []).map((serverItem) => {
      const draftItem = draft.items?.find((item) => item.id === serverItem.id);
      if (!draftItem) return serverItem;
      return {
        ...serverItem,
        title: draftItem.title,
        subtitle: draftItem.subtitle,
        organization: draftItem.organization,
        studentEditedBody: draftItem.studentEditedBody,
      };
    }),
  };
}

function replaceOrAddItem(
  portfolio: Portfolio,
  nextItem: PortfolioItem,
): Portfolio {
  const items = portfolio.items ?? [];
  const exists = items.some((item) => item.id === nextItem.id);
  return {
    ...portfolio,
    items: exists
      ? items.map((item) => (item.id === nextItem.id ? nextItem : item))
      : [...items, nextItem],
  };
}

function removeItemById(portfolio: Portfolio, itemId: string): Portfolio {
  return {
    ...portfolio,
    items: (portfolio.items ?? []).filter((item) => item.id !== itemId),
  };
}

function normalizeThemeForSave(theme: PortfolioTheme): PortfolioTheme {
  return {
    templateId: getPortfolioTemplateId(theme.templateId),
    primaryColor: theme.primaryColor || "#E94B3C",
    secondaryColor: theme.secondaryColor || "#4FC3F7",
    fontFamily: theme.fontFamily || PORTFOLIO_FONTS[0].id,
    headingFontFamily: theme.headingFontFamily,
    fontScale: theme.fontScale,
    lineHeight: theme.lineHeight,
    density: theme.density,
    accentColor: theme.accentColor,
    backgroundStyle: theme.backgroundStyle,
    backgroundImageUrl: theme.backgroundImageUrl,
    cardStyle: theme.cardStyle,
    layoutStyle: getPortfolioLayoutStyleId(theme.layoutStyle),
    settingsJson: theme.settingsJson,
    sectionOrder: normalizeSectionOrder(theme.sectionOrder),
  };
}

function cleanLinksForSave(links: PortfolioLink[] | null): PortfolioLink[] {
  return (links ?? [])
    .map((link) => ({
      label: link.label?.trim() || null,
      url: link.url?.trim() || null,
    }))
    .filter((link) => link.url);
}

function PortfolioBuilderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-[#E5E5E0] bg-white">
        <div className="mx-auto flex h-14 max-w-[110rem] items-center justify-between px-4 sm:px-6">
          <div className="h-6 w-44 rounded-lg bg-[#E5E5E0]" />
          <div className="flex gap-2">
            <div className="h-10 w-24 rounded-xl bg-[#E5E5E0]" />
            <div className="h-10 w-20 rounded-xl bg-[#E5E5E0]" />
            <div className="h-10 w-28 rounded-xl bg-[#E5E5E0]" />
          </div>
        </div>
      </div>
      <div className="flex">
        <div className="hidden w-[4.5rem] shrink-0 border-r border-[#E5E5E0] bg-white lg:block" />
        <div className="flex-1 bg-[#F5F5F0] px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-[880px] space-y-6 rounded-[1.5rem] bg-white p-8 shadow-sm">
            <div className="h-40 rounded-2xl bg-[#E5E5E0]" />
            <div className="h-56 rounded-2xl bg-[#E5E5E0]" />
            <div className="h-32 rounded-2xl bg-[#E5E5E0]" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function loadMyPortfolioOrNull(): Promise<Portfolio | null> {
  try {
    const result = await getMyPortfolio();
    return result.data;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function PortfolioSettingsPageContent() {
  const router = useRouter();
  const {
    profile,
    isAuthenticated,
    isHydrated,
    isLoading: isUserLoading,
  } = useCurrentUser();

  const [baseline, setBaseline] = useState<Portfolio | null>(null);
  const [draft, setDraft] = useState<Portfolio | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [activePanel, setActivePanel] = useState<PortfolioPanelId | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const draftRef = useRef<Portfolio | null>(null);
  const baselineRef = useRef<Portfolio | null>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  useEffect(() => {
    if (!isHydrated || isUserLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?returnUrl=%2Fportfolio");
    }
  }, [isAuthenticated, isHydrated, isUserLoading, router]);

  const canFetch =
    isHydrated &&
    !isUserLoading &&
    isAuthenticated &&
    profile != null &&
    isStudentRole(profile.role);

  const { data, isLoading, hasError, retry } = useClientFetch({
    enabled: canFetch,
    fetcher: loadMyPortfolioOrNull,
    deps: [reloadToken, canFetch],
    onError: (error) => showAppErrorFromUnknown(error, "portfolio.load"),
  });

  useEffect(() => {
    if (data) {
      setBaseline(data);
      setDraft(data);
    }
  }, [data]);

  const isDirty = useMemo(() => {
    if (!draft || !baseline) return false;
    if (isProfileDirty(draft, baseline)) return true;
    if (isThemeDirty(draft, baseline)) return true;
    if (isLinksDirty(draft, baseline)) return true;

    const baseById = new Map(
      (baseline.items ?? []).map((item) => [item.id, item]),
    );
    for (const item of draft.items ?? []) {
      const base = baseById.get(item.id);
      if (base && isItemTextDirty(item, base)) return true;
    }
    return false;
  }, [draft, baseline]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  /* ---------- draft-only patches ---------- */

  const patchDraft = useCallback((patch: Partial<Portfolio>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const patchTheme = useCallback((theme: PortfolioTheme) => {
    setDraft((current) => (current ? { ...current, theme } : current));
  }, []);

  const patchLinks = useCallback((links: PortfolioLink[]) => {
    setDraft((current) => (current ? { ...current, links } : current));
  }, []);

  const patchItemText = useCallback(
    (itemId: string, patch: Partial<PortfolioItem>) => {
      setDraft((current) => {
        if (!current) return current;
        return {
          ...current,
          items: (current.items ?? []).map((item) =>
            item.id === itemId ? { ...item, ...patch } : item,
          ),
        };
      });
    },
    [],
  );

  /* ---------- server merges ---------- */

  /** Adopt a full server portfolio (structural ops), keeping unsaved text. */
  const applyServerPortfolio = useCallback((server: Portfolio) => {
    setBaseline(server);
    setDraft((current) =>
      current ? mergeServerStructural(server, current) : server,
    );
  }, []);

  /** Adopt a server item into baseline + draft. */
  const applyServerItem = useCallback(
    (serverItem: PortfolioItem, { commitText = false } = {}) => {
      setBaseline((current) =>
        current ? replaceOrAddItem(current, serverItem) : current,
      );
      setDraft((current) => {
        if (!current) return current;
        const existing = (current.items ?? []).find(
          (item) => item.id === serverItem.id,
        );
        const merged =
          existing && !commitText
            ? {
                ...serverItem,
                title: existing.title,
                subtitle: existing.subtitle,
                organization: existing.organization,
                studentEditedBody: existing.studentEditedBody,
                externalUrl: existing.externalUrl,
                startDate: existing.startDate,
                endDate: existing.endDate,
                mediaAssets: existing.mediaAssets,
                mediaUrl: existing.mediaUrl,
              }
            : serverItem;
        return replaceOrAddItem(current, merged);
      });
    },
    [],
  );

  /* ---------- global save ---------- */

  const handleSaveAll = useCallback(async () => {
    const currentDraft = draftRef.current;
    const currentBaseline = baselineRef.current;
    if (!currentDraft || !currentBaseline || isSaving) return;

    setIsSaving(true);
    try {
      let base = currentBaseline;

      const portfolioDirty =
        isProfileDirty(currentDraft, currentBaseline) ||
        isThemeDirty(currentDraft, currentBaseline) ||
        isLinksDirty(currentDraft, currentBaseline);

      if (portfolioDirty) {
        const result = await updateMyPortfolio({
          displayName: currentDraft.displayName?.trim() || null,
          headline: currentDraft.headline?.trim() || null,
          tagline: currentDraft.tagline?.trim() || null,
          summary: nullIfEmptyHtml(currentDraft.summary),
          avatarUrl: currentDraft.avatarUrl?.trim() || null,
          coverImageUrl: currentDraft.coverImageUrl?.trim() || null,
          theme: normalizeThemeForSave(currentDraft.theme),
          links: cleanLinksForSave(currentDraft.links),
        });
        base = result.data;
      }

      const baseById = new Map(
        (currentBaseline.items ?? []).map((item) => [item.id, item]),
      );
      const updatedItems: PortfolioItem[] = [];
      for (const item of currentDraft.items ?? []) {
        const original = baseById.get(item.id);
        if (!original || !isItemTextDirty(item, original)) continue;

        const isAuto = item.source === "AutoImported";
        const body = nullIfEmptyHtml(item.studentEditedBody);
        const mediaAssets = toMediaAssetRefs(item);
        const patch: UpdatePortfolioItemInput = isAuto
          ? {
              studentEditedBody: body,
              mediaAssets,
            }
          : {
              title: item.title || null,
              subtitle: item.subtitle || null,
              organization: item.organization || null,
              studentEditedBody: body,
              externalUrl: item.externalUrl?.trim() || null,
              startDate: item.startDate || null,
              endDate: item.endDate || null,
              mediaAssets,
              mediaUrl: item.mediaUrl || null,
            };
        const result = await updatePortfolioItem(item.id, patch);
        const saved = result.data;
        updatedItems.push({
          ...saved,
          studentEditedBody: preferAlignedHtml(
            body,
            saved.studentEditedBody,
          ),
          mediaAssets: item.mediaAssets ?? saved.mediaAssets,
          ...(isAuto
            ? {}
            : {
                title: preferAlignedHtml(item.title, saved.title) ?? saved.title,
                subtitle:
                  preferAlignedHtml(item.subtitle, saved.subtitle) ??
                  saved.subtitle,
                organization:
                  preferAlignedHtml(item.organization, saved.organization) ??
                  saved.organization,
                externalUrl: item.externalUrl,
                startDate: item.startDate,
                endDate: item.endDate,
              }),
        });
      }

      const updatedById = new Map(updatedItems.map((item) => [item.id, item]));
      const final: Portfolio = {
        ...base,
        items: (base.items ?? []).map(
          (item) => updatedById.get(item.id) ?? item,
        ),
      };

      setBaseline(final);
      setDraft(final);
      showAppSuccess({ title: "Đã lưu portfolio" });
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.update");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  /* ---------- immediate item actions ---------- */

  const handleToggleVisibility = useCallback(
    async (item: PortfolioItem, isVisible: boolean) => {
      patchItemText(item.id, { isVisible });
      try {
        const result = await updatePortfolioItem(item.id, { isVisible });
        applyServerItem(result.data);
      } catch (error) {
        patchItemText(item.id, { isVisible: item.isVisible });
        showAppErrorFromUnknown(error, "portfolio.item");
      }
    },
    [applyServerItem, patchItemText],
  );

  /** Draft-only reorder while dragging. */
  const handlePreviewReorder = useCallback((orderedIds: string[]) => {
    setDraft((current) => {
      if (!current) return current;
      const orderIndex = new Map(orderedIds.map((id, index) => [id, index]));
      return {
        ...current,
        items: (current.items ?? []).map((item) => ({
          ...item,
          displayOrder: orderIndex.get(item.id) ?? item.displayOrder,
        })),
      };
    });
  }, []);

  /** Persist the current draft order after a drop. */
  const handleCommitReorder = useCallback(async () => {
    const currentDraft = draftRef.current;
    const currentBaseline = baselineRef.current;
    if (!currentDraft || !currentBaseline) return;

    const sortIds = (portfolio: Portfolio) =>
      [...(portfolio.items ?? [])]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((item) => item.id);

    const draftOrder = sortIds(currentDraft);
    if (draftOrder.join("|") === sortIds(currentBaseline).join("|")) return;

    try {
      const result = await reorderPortfolioItems({
        items: draftOrder.map((id, index) => ({ id, displayOrder: index })),
      });
      applyServerPortfolio(result.data);
    } catch (error) {
      // Revert draft order to baseline.
      setDraft((current) => {
        if (!current || !baselineRef.current) return current;
        const baseOrder = new Map(
          (baselineRef.current.items ?? []).map((item) => [
            item.id,
            item.displayOrder,
          ]),
        );
        return {
          ...current,
          items: (current.items ?? []).map((item) => ({
            ...item,
            displayOrder: baseOrder.get(item.id) ?? item.displayOrder,
          })),
        };
      });
      showAppErrorFromUnknown(error, "portfolio.reorder");
    }
  }, [applyServerPortfolio]);

  const requestDeleteItem = useCallback((item: PortfolioItem) => {
    if (item.source === "AutoImported") return;
    setPendingDelete({ kind: "item", item });
  }, []);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncPortfolioItems();
      applyServerPortfolio(result.data);
      showAppSuccess({
        title: "Đã đồng bộ mục tự động",
        description: result.message,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.sync");
    } finally {
      setIsSyncing(false);
    }
  }, [applyServerPortfolio]);

  const handleAddItem = useCallback(
    async (itemType: PortfolioItemType) => {
      if (isAddingItem) return;
      setIsAddingItem(true);
      try {
        const maxOrder = Math.max(
          0,
          ...(draftRef.current?.items ?? []).map((item) => item.displayOrder),
        );
        const result = await createPortfolioItem({
          itemType,
          title: "Mục mới",
          isVisible: true,
          displayOrder: maxOrder + 1,
        });
        // Baseline keeps the API title; draft clears text so the card shows placeholders.
        setBaseline((current) =>
          current ? replaceOrAddItem(current, result.data) : current,
        );
        setDraft((current) =>
          current
            ? replaceOrAddItem(current, {
                ...result.data,
                title: "",
                subtitle: null,
                organization: null,
                studentEditedBody: null,
              })
            : current,
        );
        setFocusItemId(result.data.id);
      } catch (error) {
        showAppErrorFromUnknown(error, "portfolio.item");
      } finally {
        setIsAddingItem(false);
      }
    },
    [isAddingItem],
  );

  const handleAddSection = useCallback(
    async (kind: PortfolioSectionKind) => {
      try {
        const result = await createPortfolioSection({
          kind,
          title: null,
          isVisible: true,
        });
        const section = result.data;
        setBaseline((current) =>
          current
            ? { ...current, sections: [...(current.sections ?? []), section] }
            : current,
        );
        setDraft((current) =>
          current
            ? { ...current, sections: [...(current.sections ?? []), section] }
            : current,
        );
        showAppSuccess({ title: "Đã thêm section" });
      } catch (error) {
        showAppErrorFromUnknown(error, "portfolio.section");
      }
    },
    [],
  );

  const handleUpdateSection = useCallback(
    async (sectionId: string, patch: Partial<PortfolioSection>) => {
      setDraft((current) => {
        if (!current) return current;
        return {
          ...current,
          sections: (current.sections ?? []).map((section) =>
            section.id === sectionId ? { ...section, ...patch } : section,
          ),
        };
      });

      try {
        const mediaAssets = patch.mediaAssets?.map((asset: PortfolioMediaAsset, index) => ({
          id: asset.id,
          caption: asset.caption,
          displayOrder: asset.displayOrder ?? index,
        }));
        const result = await updatePortfolioSection(sectionId, {
          title: patch.title,
          isVisible: patch.isVisible,
          contentHtml:
            patch.contentHtml !== undefined
              ? nullIfEmptyHtml(patch.contentHtml)
              : undefined,
          settingsJson: patch.settingsJson,
          mediaAssets,
        });
        const saved = {
          ...result.data,
          isVisible: patch.isVisible ?? result.data.isVisible,
          contentHtml:
            patch.contentHtml !== undefined
              ? preferAlignedHtml(patch.contentHtml, result.data.contentHtml)
              : result.data.contentHtml,
          title:
            patch.title !== undefined
              ? (preferAlignedHtml(patch.title, result.data.title) ??
                result.data.title)
              : result.data.title,
        };
        setBaseline((current) => {
          if (!current) return current;
          return {
            ...current,
            sections: (current.sections ?? []).map((section) =>
              section.id === sectionId ? saved : section,
            ),
          };
        });
        setDraft((current) => {
          if (!current) return current;
          return {
            ...current,
            sections: (current.sections ?? []).map((section) =>
              section.id === sectionId ? saved : section,
            ),
          };
        });
      } catch (error) {
        showAppErrorFromUnknown(error, "portfolio.section");
      }
    },
    [],
  );

  const requestDeleteSection = useCallback((sectionId: string) => {
    const section = draftRef.current?.sections?.find(
      (entry) => entry.id === sectionId,
    );
    const label =
      section?.title ||
      (section
        ? PORTFOLIO_SECTION_KIND_LABELS[section.kind] || section.kind
        : "section này");
    setPendingDelete({ kind: "section", sectionId, label });
  }, []);

  const confirmPendingDelete = useCallback(async () => {
    if (!pendingDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      if (pendingDelete.kind === "item") {
        const { item } = pendingDelete;
        await deletePortfolioItem(item.id);
        setBaseline((current) =>
          current ? removeItemById(current, item.id) : current,
        );
        setDraft((current) =>
          current ? removeItemById(current, item.id) : current,
        );
        showAppSuccess({ title: "Đã xóa mục" });
      } else {
        const { sectionId } = pendingDelete;
        await deletePortfolioSection(sectionId);
        setBaseline((current) =>
          current
            ? {
                ...current,
                sections: (current.sections ?? []).filter(
                  (section) => section.id !== sectionId,
                ),
              }
            : current,
        );
        setDraft((current) =>
          current
            ? {
                ...current,
                sections: (current.sections ?? []).filter(
                  (section) => section.id !== sectionId,
                ),
              }
            : current,
        );
        showAppSuccess({ title: "Đã xóa section" });
      }
      setPendingDelete(null);
    } catch (error) {
      showAppErrorFromUnknown(
        error,
        pendingDelete.kind === "item" ? "portfolio.item" : "portfolio.section",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, pendingDelete]);

  /** Draft-only section reorder while dragging on the canvas. */
  const handlePreviewReorderSections = useCallback((orderedIds: string[]) => {
    setDraft((current) => {
      if (!current) return current;
      const orderIndex = new Map(orderedIds.map((id, index) => [id, index]));
      return {
        ...current,
        sections: (current.sections ?? []).map((section) => ({
          ...section,
          displayOrder: orderIndex.get(section.id) ?? section.displayOrder,
        })),
      };
    });
  }, []);

  /** Persist section order after drop (outline or canvas). */
  const handleCommitReorderSections = useCallback(
    async (orderedIds?: string[]) => {
      const currentBaseline = baselineRef.current;
      if (!currentBaseline?.sections?.length) return;

      const sortIds = (sections: Portfolio["sections"]) =>
        [...(sections ?? [])]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((section) => section.id);

      const draftOrder =
        orderedIds ?? sortIds(draftRef.current?.sections ?? null);
      if (draftOrder.length === 0) return;
      if (draftOrder.join("|") === sortIds(currentBaseline.sections).join("|")) {
        return;
      }

      if (orderedIds) {
        handlePreviewReorderSections(orderedIds);
      }

      try {
        const result = await reorderPortfolioSections({
          sections: draftOrder.map((id, index) => ({
            id,
            displayOrder: index,
          })),
        });
        applyServerPortfolio(result.data);
      } catch (error) {
        setDraft((current) => {
          if (!current || !baselineRef.current) return current;
          const baseOrder = new Map(
            (baselineRef.current.sections ?? []).map((section) => [
              section.id,
              section.displayOrder,
            ]),
          );
          return {
            ...current,
            sections: (current.sections ?? []).map((section) => ({
              ...section,
              displayOrder: baseOrder.get(section.id) ?? section.displayOrder,
            })),
          };
        });
        showAppErrorFromUnknown(error, "portfolio.section");
      }
    },
    [applyServerPortfolio, handlePreviewReorderSections],
  );

  const handleToggleSectionVisibility = useCallback(
    (section: PortfolioSection, visible: boolean) => {
      void handleUpdateSection(section.id, { isVisible: visible });
    },
    [handleUpdateSection],
  );

  const outlineEntries = useMemo(() => {
    if (!draft) return [];

    const dynamic = [...(draft.sections ?? [])].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );

    if (dynamic.length > 0) {
      return [
        {
          id: "profile",
          label: "Hồ sơ",
          isVisible: true,
          pinned: true,
        },
        ...dynamic.map((section) => ({
          id: section.id,
          label:
            section.title ||
            PORTFOLIO_SECTION_KIND_LABELS[section.kind] ||
            section.kind,
          isVisible: section.isVisible,
        })),
      ];
    }

    return normalizeSectionOrder(draft.theme.sectionOrder).map((sectionId) => ({
      id: sectionId,
      label:
        PORTFOLIO_SECTIONS.find((section) => section.id === sectionId)?.label ??
        sectionId,
      isVisible: true,
      pinned: sectionId === "profile",
    }));
  }, [draft]);

  /* ---------- create flow ---------- */

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const result = await createPortfolio();
      setBaseline(result.data);
      setDraft(result.data);
      setReloadToken((token) => token + 1);
      showAppSuccess({
        title: "Đã tạo portfolio",
        description: result.message,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.create");
    } finally {
      setIsCreating(false);
    }
  };

  /* ---------- gates & fallbacks ---------- */

  if (!isHydrated || isUserLoading) {
    return <PortfolioBuilderSkeleton />;
  }

  if (!isAuthenticated) {
    return <PortfolioBuilderSkeleton />;
  }

  if (profile && isParentRole(profile.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-[#2D2D2D]">
          Trang dành cho học viên
        </p>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Phụ huynh có thể theo dõi con tại mục Thông tin con.
        </p>
        <Button
          type="button"
          className="mt-6"
          onClick={() => router.push("/parent/children")}
        >
          Đi tới Thông tin con
        </Button>
      </div>
    );
  }

  if (profile && !isStudentRole(profile.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-[#2D2D2D]">
          Không có quyền truy cập
        </p>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Chỉ học viên mới thiết lập được portfolio microsite.
        </p>
      </div>
    );
  }

  if (isLoading && !draft) {
    return <PortfolioBuilderSkeleton />;
  }

  if (hasError && !draft) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="border-[#E5E5E0] bg-white">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-lg text-[#2D2D2D]">
              Không tải được portfolio
            </CardTitle>
            <CardDescription className="text-[#6B6B6B]">
              Vui lòng thử lại sau vài giây.
            </CardDescription>
            <Button type="button" className="mx-auto mt-4 w-fit" onClick={retry}>
              Thử lại
            </Button>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="overflow-hidden rounded-[2rem] border border-[#E5E5E0] bg-white shadow-[0_24px_60px_rgba(45,45,45,0.08)]">
          <div
            className="px-8 py-10 text-white sm:px-10"
            style={{
              background:
                "linear-gradient(135deg, #E94B3C 0%, #7E57C2 45%, #2D2D2D 100%)",
            }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
              Portfolio STEAM
            </p>
            <h1 className="mt-3 max-w-lg text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Xây dựng microsite học tập của bạn
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
              Gom chứng chỉ, dự án capstone và thành tích vào một trang công
              khai — sẵn sàng chia sẻ với trường đại học.
            </p>
          </div>
          <div className="space-y-5 px-8 py-8 sm:px-10">
            <ul className="space-y-3 text-sm text-[#6B6B6B]">
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-[#E94B3C]" />
                Đồng bộ tự động chứng chỉ & dự án đã chấm
              </li>
              <li className="flex gap-2">
                <LayoutDashboard className="mt-0.5 size-4 shrink-0 text-[#4FC3F7]" />
                Chỉnh trực tiếp trên trang, kéo thả bố cục và xuất bản
              </li>
            </ul>
            <Button
              type="button"
              disabled={isCreating}
              onClick={() => void handleCreate()}
              className="h-12 w-full rounded-xl bg-[#E94B3C] text-white hover:bg-[#E94B3C]/90 sm:w-auto sm:min-w-48"
            >
              {isCreating ? "Đang tạo…" : "Tạo portfolio"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- editor workspace ---------- */

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col sm:min-h-[calc(100vh-5rem)]">
      <PortfolioToolbar
        draft={draft}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={() => void handleSaveAll()}
        onServerUpdate={applyServerPortfolio}
      />

      <div className="mx-auto flex w-full max-w-[110rem] flex-1 items-stretch">
        <PortfolioRail active={activePanel} onSelect={setActivePanel} />

        <SectionOutlinePanel
          entries={outlineEntries}
          onReorder={(orderedIds) => {
            if ((draft.sections ?? []).length > 0) {
              void handleCommitReorderSections(orderedIds);
              return;
            }
            patchTheme({
              ...draft.theme,
              sectionOrder: normalizeSectionOrder(["profile", ...orderedIds]),
            });
          }}
          onToggleVisibility={(id, visible) => {
            const section = draft.sections?.find((item) => item.id === id);
            if (section) handleToggleSectionVisibility(section, visible);
          }}
        />

        {activePanel ? (
          <PortfolioPanelHost
            title={PANEL_TITLES[activePanel]}
            onClose={() => setActivePanel(null)}
          >
            {activePanel === "design" ? (
              <DesignPanel theme={draft.theme} onThemeChange={patchTheme} />
            ) : null}
            {activePanel === "links" ? (
              <LinksPanel links={draft.links ?? []} onLinksChange={patchLinks} />
            ) : null}
            {activePanel === "items" ? (
              <ItemsPanel
                items={draft.items ?? []}
                isSyncing={isSyncing}
                isAdding={isAddingItem}
                onSync={() => void handleSync()}
                onAdd={() => void handleAddItem("Project")}
                onDelete={requestDeleteItem}
                onToggleVisibility={(item, visible) =>
                  void handleToggleVisibility(item, visible)
                }
              />
            ) : null}
          </PortfolioPanelHost>
        ) : null}

        <main className="min-w-0 flex-1 bg-[#F5F5F0] px-3 py-6 pb-24 sm:px-8 sm:py-10 lg:pb-10">
          <PortfolioCanvas
            draft={draft}
            onPatchDraft={patchDraft}
            onPatchTheme={patchTheme}
            onPatchItemText={patchItemText}
            onPreviewReorder={handlePreviewReorder}
            onCommitReorder={() => void handleCommitReorder()}
            onToggleItemVisibility={(item, visible) =>
              void handleToggleVisibility(item, visible)
            }
            onDeleteItem={requestDeleteItem}
            onAddItem={(itemType) => void handleAddItem(itemType)}
            onSyncItems={() => void handleSync()}
            isSyncing={isSyncing}
            isAddingItem={isAddingItem}
            focusItemId={focusItemId}
            onFocusItemHandled={() => setFocusItemId(null)}
            onOpenLinksPanel={() => setActivePanel("links")}
            onAddSection={(kind) => void handleAddSection(kind)}
            onUpdateSection={(sectionId, patch) =>
              void handleUpdateSection(sectionId, patch)
            }
            onDeleteSection={requestDeleteSection}
            onReorderSections={handlePreviewReorderSections}
            onCommitReorderSections={() => void handleCommitReorderSections()}
            onToggleSectionVisibility={handleToggleSectionVisibility}
          />
        </main>
      </div>

      <Dialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
      >
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingDelete?.kind === "item" ? "Xóa mục?" : "Xóa section?"}
            </DialogTitle>
            <DialogDescription>
              {pendingDelete?.kind === "item"
                ? `Bạn sắp xóa “${pendingDelete.item.title?.trim() || "không tiêu đề"}”. Thao tác này không thể hoàn tác.`
                : `Bạn sắp xóa “${pendingDelete?.label ?? "section này"}”. Thao tác này không thể hoàn tác.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] rounded-xl"
              disabled={isDeleting}
              onClick={() => setPendingDelete(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-[44px] rounded-xl"
              disabled={isDeleting}
              onClick={() => void confirmPendingDelete()}
            >
              {isDeleting ? "Đang xóa…" : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
