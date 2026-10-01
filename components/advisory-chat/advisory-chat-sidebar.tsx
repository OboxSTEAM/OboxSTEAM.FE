"use client";

import type { ReactNode } from "react";
import { MessagesSquare, PanelRightClose, X } from "lucide-react";

import { AdvisoryComposer } from "@/components/advisory-chat/advisory-composer";
import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { AdvisoryMessageList } from "@/components/advisory-chat/advisory-message-list";
import { AdvisoryPinPanel } from "@/components/advisory-chat/advisory-pin-panel";
import { CurriculumChangesPanel } from "@/components/advisory-chat/changes/curriculum-changes-panel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetPopup, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdvisoryComposerPayload } from "@/components/advisory-chat/advisory-composer";
import { MENTION_TARGET_TYPE_LABELS } from "@/lib/advisory/mention-token";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

type AdvisoryChatSidebarProps = {
  /** Rendered under the composer (approval bar). */
  footer?: ReactNode;
  /** Overrides the "Thay đổi" tab content (defaults to `CurriculumChangesPanel` when `hasChangesView`). */
  changesPanel?: ReactNode;
  className?: string;
};

/**
 * Program chat panel — a collapsible column on desktop (`lg+`), a right sheet
 * opened from a floating button below that.
 */
export function AdvisoryChatSidebar({ footer, changesPanel, className }: AdvisoryChatSidebarProps) {
  const { isDesktop, isChatOpen, setChatOpen, workspace } = useAdvisoryChat();
  const unreadCount = workspace?.unreadCount ?? 0;

  if (isDesktop) {
    if (!isChatOpen) {
      return (
        <div className={cn("flex shrink-0 flex-col items-center border-l border-border bg-card py-3", className)}>
          <ChatLauncherButton unreadCount={unreadCount} onClick={() => setChatOpen(true)} />
        </div>
      );
    }
    return (
      <aside
        aria-label="Trao đổi về chương trình"
        className={cn(
          "flex w-[min(24rem,34vw)] shrink-0 flex-col border-l border-border bg-card",
          className,
        )}
      >
        <ChatPanel footer={footer} changesPanel={changesPanel} />
      </aside>
    );
  }

  return (
    <>
      <div className="fixed right-4 bottom-4 z-40">
        <ChatLauncherButton
          unreadCount={unreadCount}
          onClick={() => setChatOpen(true)}
          className="size-14 rounded-full shadow-lg"
        />
      </div>
      <Sheet open={isChatOpen} onOpenChange={setChatOpen}>
        <SheetPopup side="right" className="w-[min(26rem,100vw)]">
          <ChatPanel footer={footer} changesPanel={changesPanel} isSheet />
        </SheetPopup>
      </Sheet>
    </>
  );
}

function ChatPanel({
  footer,
  changesPanel,
  isSheet = false,
}: {
  footer?: ReactNode;
  changesPanel?: ReactNode;
  isSheet?: boolean;
}) {
  const {
    workspace,
    capabilities,
    discussion,
    filteredDiscussion,
    targetFilter,
    setTargetFilter,
    mentions,
    composerRef,
    setChatOpen,
    activeTab,
    setActiveTab,
    hasChangesView,
  } = useAdvisoryChat();

  const showTabs = hasChangesView;
  const isChangesTab = showTabs && activeTab === "changes";
  const unseenChanges = workspace?.unseenChangeCount ?? 0;
  const filterTarget = targetFilter
    ? mentions.getTarget(targetFilter.targetType, targetFilter.targetId)
    : undefined;

  async function handleSend(payload: AdvisoryComposerPayload) {
    try {
      await discussion.send(payload);
    } catch (error) {
      showAppErrorFromUnknown(error, "advisory.message.send");
    }
  }

  const titleClassName = "font-heading text-base font-semibold text-foreground";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-start gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          {isSheet ? (
            <SheetTitle className={titleClassName}>Trao đổi về chương trình</SheetTitle>
          ) : (
            <h2 className={titleClassName}>Trao đổi về chương trình</h2>
          )}
          <p className="truncate text-xs text-muted-foreground">
            {workspace?.advisorName
              ? `Chuyên gia tư vấn: ${workspace.advisorName}`
              : "Chưa có chuyên gia tư vấn"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setChatOpen(false)}
          aria-label={isSheet ? "Đóng trò chuyện" : "Thu gọn trò chuyện"}
          className="size-9 shrink-0"
        >
          {isSheet ? <X className="size-4" /> : <PanelRightClose className="size-4" />}
        </Button>
      </header>

      {showTabs ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value === "changes" ? "changes" : "chat")}
          className="border-b border-border px-3 py-2"
        >
          <TabsList className="w-full">
            <TabsTrigger value="chat">Trò chuyện</TabsTrigger>
            <TabsTrigger value="changes">
              Thay đổi
              {unseenChanges > 0 ? (
                <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground tabular-nums">
                  {unseenChanges}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      {isChangesTab ? (
        <div className="min-h-0 flex-1 overflow-y-auto">{changesPanel ?? <CurriculumChangesPanel />}</div>
      ) : filteredDiscussion && targetFilter ? (
        <>
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs">
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              Thảo luận về {MENTION_TARGET_TYPE_LABELS[targetFilter.targetType].toLowerCase()}{" "}
              <span className="font-semibold text-foreground">
                {filterTarget?.label ?? "đã chọn"}
              </span>
            </span>
            <Button type="button" variant="ghost" size="xs" onClick={() => setTargetFilter(null)}>
              Xem tất cả
            </Button>
          </div>
          <AdvisoryMessageList
            thread={filteredDiscussion}
            isLive={false}
            emptyText="Chưa có tin nhắn nào nhắc đến mục này."
          />
        </>
      ) : (
        <>
          <AdvisoryPinPanel />
          <AdvisoryMessageList thread={discussion} />
          <div className="border-t border-border p-3">
            <AdvisoryComposer
              ref={composerRef}
              disabled={!capabilities.canPost}
              disabledReason="Bạn chỉ có quyền xem cuộc trò chuyện này."
              onSubmit={handleSend}
            />
          </div>
        </>
      )}

      {footer ? <div className="border-t border-border">{footer}</div> : null}
    </div>
  );
}

function ChatLauncherButton({
  unreadCount,
  onClick,
  className,
}: {
  unreadCount: number;
  onClick: () => void;
  className?: string;
}) {
  const label =
    unreadCount > 0 ? `Mở trò chuyện (${unreadCount} tin nhắn chưa đọc)` : "Mở trò chuyện";
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("relative size-11", className)}
    >
      <MessagesSquare className="size-5" />
      {unreadCount > 0 ? (
        <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-primary px-1 text-[11px] leading-5 font-semibold text-primary-foreground tabular-nums">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Button>
  );
}
