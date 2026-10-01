"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import type { AdvisoryComposerHandle } from "@/components/advisory-chat/advisory-composer";
import { useAdvisoryDiscussion, type DiscussionTargetFilter, type UseAdvisoryDiscussionResult } from "@/hooks/use-advisory-discussion";
import { useAdvisoryWorkspace } from "@/hooks/use-advisory-workspace";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDiscussionPins, type UseDiscussionPinsResult } from "@/hooks/use-discussion-pins";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMentionIndex } from "@/hooks/use-mention-index";
import type { MaterialActivityOption } from "@/lib/advisory/material-activity-options";
import {
  buildMentionQuery,
  curriculumAnchorFor,
  mentionToNavigation,
} from "@/lib/advisory/mention-navigation";
import type { MentionToken } from "@/lib/advisory/mention-token";
import { isAdvisoryStaffRole, PIN_ACTION_LABELS } from "@/lib/advisory/pin-actions";
import {
  performDiscussionPinAction,
  pinDiscussionMessage,
  unpinDiscussionMessage,
  type AdvisoryWorkspace,
  type DiscussionMessage,
} from "@/lib/api";
import {
  advisoryCapabilitiesSchema,
  type AdvisoryChatCapabilities,
} from "@/lib/api/advisory-chat/schemas";
import { showAppError, showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { registerAdvisorySyncHandler } from "@/lib/realtime/advisory-sync-bus";
import type { DiscussionPinAction } from "@/lib/validations";

const DESKTOP_QUERY = "(min-width: 1024px)";
const HIDDEN_UNREAD_REFRESH_MS = 800;
const ANCHOR_SCROLL_ATTEMPTS = 10;
const ANCHOR_SCROLL_RETRY_MS = 100;
const NO_CAPABILITIES = advisoryCapabilitiesSchema.parse({});

export type ChatPanelTab = "chat" | "changes";
export type ChangesRange = { fromVersion: number; toVersion: number };

type AdvisoryChatContextValue = {
  programId: string;
  currentUserId: string | null;
  /** Manager/Admin — may mark pins as addressed. */
  isStaff: boolean;
  workspace: AdvisoryWorkspace | null;
  workspaceState: ReturnType<typeof useAdvisoryWorkspace>;
  capabilities: AdvisoryChatCapabilities;
  mentions: ReturnType<typeof useMentionIndex>;
  discussion: UseAdvisoryDiscussionResult;
  /** Messages mentioning `targetFilter`; `null` while no filter is set. */
  filteredDiscussion: UseAdvisoryDiscussionResult | null;
  targetFilter: DiscussionTargetFilter | null;
  setTargetFilter: (filter: DiscussionTargetFilter | null) => void;
  pins: UseDiscussionPinsResult;
  materialActivities: MaterialActivityOption[];
  composerRef: RefObject<AdvisoryComposerHandle | null>;
  /** Mentions inserted while the composer was unmounted; drained on mount. */
  takeQueuedMentions: () => MentionToken[];
  isDesktop: boolean;
  isChatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  activeTab: ChatPanelTab;
  setActiveTab: (tab: ChatPanelTab) => void;
  hasChangesView: boolean;
  changesRange: ChangesRange | null;
  openChanges: (range?: ChangesRange) => void;
  insertMention: (token: MentionToken) => void;
  navigateToMention: (token: MentionToken) => boolean;
  markRead: () => void;
  togglePin: (message: DiscussionMessage) => Promise<void>;
  performPinAction: (message: DiscussionMessage, action: DiscussionPinAction) => Promise<void>;
};

const AdvisoryChatContext = createContext<AdvisoryChatContextValue | null>(null);

type AdvisoryChatProviderProps = {
  programId: string;
  initialWorkspace?: AdvisoryWorkspace | null;
  /** Targets for "Lưu thành tài liệu" (see `buildMaterialActivityOptions`). */
  materialActivities?: MaterialActivityOption[];
  /** Show the "Thay đổi" tab and "Xem thay đổi" links. */
  hasChangesView?: boolean;
  children: ReactNode;
};

/** Program advisory chat state shared by the sidebar, curriculum tree and approval UI. */
export function AdvisoryChatProvider({
  programId,
  initialWorkspace = null,
  materialActivities = [],
  hasChangesView = false,
  children,
}: AdvisoryChatProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useCurrentUser();
  const currentUserId = profile?.id ?? null;

  const workspaceState = useAdvisoryWorkspace(programId, { initialData: initialWorkspace });
  const mentions = useMentionIndex(programId);
  const discussion = useAdvisoryDiscussion(programId);
  const [targetFilter, setTargetFilter] = useState<DiscussionTargetFilter | null>(null);
  const filteredDiscussion = useAdvisoryDiscussion(programId, {
    enabled: targetFilter !== null,
    filter: targetFilter,
  });
  const pins = useDiscussionPins(programId);

  const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
  const [isDesktopOpen, setDesktopOpen] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatPanelTab>("chat");
  const [changesRange, setChangesRange] = useState<ChangesRange | null>(null);

  const composerRef = useRef<AdvisoryComposerHandle | null>(null);
  const queuedMentionsRef = useRef<MentionToken[]>([]);
  const isChatOpenRef = useRef(false);
  const workspaceRef = useRef<AdvisoryWorkspace | null>(null);
  const hiddenRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { workspace, applyWorkspace, refresh: refreshWorkspace } = workspaceState;
  const { applyMessage, markRead: markDiscussionRead } = discussion;
  const { applyMessage: applyFilteredMessage } = filteredDiscussion;
  const { applyPinnedMessage } = pins;
  const { getTarget } = mentions;

  const isChatOpen = isDesktop ? isDesktopOpen : isMobileOpen;
  const capabilities = workspace?.capabilities ?? NO_CAPABILITIES;
  const viewerRole =
    workspace?.participants.find((participant) => participant.userId === currentUserId)?.role ??
    profile?.role ??
    null;

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    workspaceRef.current = workspace;
  }, [isChatOpen, workspace]);

  useEffect(() => {
    const unsubscribe = registerAdvisorySyncHandler(programId, (signal) => {
      if (signal.scope !== "advisory.discussionChanged" || isChatOpenRef.current) return;
      if (hiddenRefreshRef.current) clearTimeout(hiddenRefreshRef.current);
      hiddenRefreshRef.current = setTimeout(() => {
        hiddenRefreshRef.current = null;
        void refreshWorkspace();
      }, HIDDEN_UNREAD_REFRESH_MS);
    });
    return () => {
      unsubscribe();
      if (hiddenRefreshRef.current) {
        clearTimeout(hiddenRefreshRef.current);
        hiddenRefreshRef.current = null;
      }
    };
  }, [programId, refreshWorkspace]);

  const setChatOpen = useCallback(
    (open: boolean) => (isDesktop ? setDesktopOpen(open) : setMobileOpen(open)),
    [isDesktop],
  );

  const takeQueuedMentions = useCallback(() => {
    const queued = queuedMentionsRef.current;
    queuedMentionsRef.current = [];
    return queued;
  }, []);

  const insertMention = useCallback(
    (token: MentionToken) => {
      setTargetFilter(null);
      setActiveTab("chat");
      setChatOpen(true);
      const composer = composerRef.current;
      if (composer) composer.insertMention(token);
      else queuedMentionsRef.current.push(token);
    },
    [setChatOpen],
  );

  const openChanges = useCallback(
    (range?: ChangesRange) => {
      setChangesRange(range ?? null);
      setActiveTab("changes");
      setChatOpen(true);
    },
    [setChatOpen],
  );

  const navigateToMention = useCallback(
    (token: MentionToken) => {
      const target = getTarget(token.targetType, token.targetId);
      const navigation = target ? mentionToNavigation(target) : null;
      if (!target || !navigation) {
        showAppError({
          title: "Không mở được mục này",
          reason: "Mục đã bị xoá hoặc không còn nằm trong chương trình.",
          action: "Kiểm tra lại cây chương trình hoặc hỏi người đã nhắc đến mục này.",
        });
        return false;
      }

      const query = buildMentionQuery(navigation, window.location.search);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      if (!isDesktop) setMobileOpen(false);
      scrollToCurriculumAnchor(curriculumAnchorFor(target), ANCHOR_SCROLL_ATTEMPTS);
      return true;
    },
    [getTarget, isDesktop, pathname, router],
  );

  const markRead = useCallback(() => {
    void markDiscussionRead().then((isAccepted) => {
      const current = workspaceRef.current;
      if (isAccepted && current && current.unreadCount > 0) {
        applyWorkspace({ ...current, unreadCount: 0 });
      }
    });
  }, [applyWorkspace, markDiscussionRead]);

  const applyPinResult = useCallback(
    (message: DiscussionMessage) => {
      applyMessage(message);
      applyFilteredMessage(message);
      applyPinnedMessage(message);
    },
    [applyFilteredMessage, applyMessage, applyPinnedMessage],
  );

  const togglePin = useCallback(
    async (message: DiscussionMessage) => {
      try {
        const next = message.pin
          ? await unpinDiscussionMessage(programId, message.id)
          : await pinDiscussionMessage(programId, message.id);
        applyPinResult(next);
        showAppSuccess({ title: next.pin ? "Đã ghim là cần sửa" : "Đã bỏ ghim" });
      } catch (error) {
        showAppErrorFromUnknown(error, "advisory.pin");
      }
    },
    [applyPinResult, programId],
  );

  const performPinAction = useCallback(
    async (message: DiscussionMessage, action: DiscussionPinAction) => {
      try {
        const next = await performDiscussionPinAction(programId, message.id, { action });
        applyPinResult(next);
        showAppSuccess({ title: PIN_ACTION_LABELS[action] });
      } catch (error) {
        showAppErrorFromUnknown(error, "advisory.pin");
      }
    },
    [applyPinResult, programId],
  );

  const value: AdvisoryChatContextValue = {
    programId,
    currentUserId,
    isStaff: isAdvisoryStaffRole(viewerRole),
    workspace,
    workspaceState,
    capabilities,
    mentions,
    discussion,
    filteredDiscussion: targetFilter ? filteredDiscussion : null,
    targetFilter,
    setTargetFilter,
    pins,
    materialActivities,
    composerRef,
    takeQueuedMentions,
    isDesktop,
    isChatOpen,
    setChatOpen,
    activeTab,
    setActiveTab,
    hasChangesView,
    changesRange,
    openChanges,
    insertMention,
    navigateToMention,
    markRead,
    togglePin,
    performPinAction,
  };

  return <AdvisoryChatContext.Provider value={value}>{children}</AdvisoryChatContext.Provider>;
}

export function useAdvisoryChat(): AdvisoryChatContextValue {
  const context = useContext(AdvisoryChatContext);
  if (!context) throw new Error("useAdvisoryChat must be used within AdvisoryChatProvider");
  return context;
}

/** Same as `useAdvisoryChat`, but `null` outside a provider (shared curriculum UI). */
export function useOptionalAdvisoryChat(): AdvisoryChatContextValue | null {
  return useContext(AdvisoryChatContext);
}

function scrollToCurriculumAnchor(anchor: string, attemptsLeft: number): void {
  const element = document.querySelector<HTMLElement>(
    `[data-curriculum-anchor="${CSS.escape(anchor)}"]`,
  );
  if (element) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    return;
  }
  if (attemptsLeft > 0) {
    window.setTimeout(
      () => scrollToCurriculumAnchor(anchor, attemptsLeft - 1),
      ANCHOR_SCROLL_RETRY_MS,
    );
  }
}
