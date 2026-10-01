"use client";

import { useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronDown,
  Loader2,
  MessageSquareText,
  Pin,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { focusDiscussionMessage } from "@/components/advisory-chat/focus-message";
import { MessageText } from "@/components/advisory-chat/message-text";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAvailablePinActions,
  PIN_ACTION_LABELS,
  PIN_STATUS_BADGE_CLASSES,
  PIN_STATUS_LABELS,
} from "@/lib/advisory/pin-actions";
import type { DiscussionMessage } from "@/lib/api";
import { formatRelativeTime } from "@/lib/classes/session-helpers";
import { showAppError } from "@/lib/errors";
import type { DiscussionPinAction } from "@/lib/validations/advisory-chat";
import { cn } from "@/lib/utils";

/** "Cần sửa" — pinned messages with their fix status, above the chat timeline. */
export function AdvisoryPinPanel() {
  const { pins } = useAdvisoryChat();
  const [isOpen, setIsOpen] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const activePins = pins.pins.filter((message) => message.pin?.status !== "Resolved");
  const resolvedCount = pins.pins.length - activePins.length;
  const visiblePins = showResolved ? pins.pins : activePins;

  if (!pins.isLoading && pins.pins.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-border dark:border-white/8">
      <CollapsibleTrigger
        className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm font-semibold text-foreground hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset dark:hover:bg-white/5"
      >
        <Pin className="size-4 text-primary" aria-hidden />
        <span>Cần sửa</span>
        {pins.isLoading ? (
          <Skeleton className="h-4 w-6 rounded" />
        ) : (
          <span className="rounded-full bg-primary/10 px-1.5 text-xs text-primary tabular-nums dark:bg-primary/18">
            {activePins.length}
          </span>
        )}
        <ChevronDown
          className={cn(
            "ml-auto size-4 text-muted-foreground transition-transform motion-reduce:transition-none",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="max-h-72 overflow-y-auto overscroll-contain px-3 pb-3">
          {visiblePins.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">
              Tất cả mục cần sửa đã được giải quyết.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visiblePins.map((message) => (
                <PinRow key={message.id} message={message} />
              ))}
            </ul>
          )}
          {resolvedCount > 0 ? (
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={() => setShowResolved((value) => !value)}
              className="mt-1 px-0"
            >
              {showResolved ? "Ẩn mục đã giải quyết" : `Hiện ${resolvedCount} mục đã giải quyết`}
            </Button>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function PinRow({ message }: { message: DiscussionMessage }) {
  const { capabilities, isStaff, performPinAction, setTargetFilter, setActiveTab } =
    useAdvisoryChat();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const pin = message.pin;
  if (!pin) return null;

  const actions = getAvailablePinActions(pin.status, {
    isStaff,
    canResolvePin: capabilities.canResolvePin,
  });

  function handleFocus() {
    setTargetFilter(null);
    setActiveTab("chat");
    window.requestAnimationFrame(() => {
      if (focusDiscussionMessage(message.id)) return;
      showAppError({
        title: "Tin nhắn nằm ở đoạn cũ hơn",
        reason: "Tin nhắn này chưa được tải trong khung trò chuyện.",
        action: "Bấm “Tải tin nhắn cũ hơn” ở đầu cuộc trò chuyện để xem.",
      });
    });
  }

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(45,45,45,0.04)] dark:border-white/8 dark:bg-white/4 dark:shadow-none">
      <div className="px-3 pt-2.5 pb-2">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
              PIN_STATUS_BADGE_CLASSES[pin.status],
            )}
          >
            <Pin className="size-3" aria-hidden />
            {PIN_STATUS_LABELS[pin.status]}
          </span>
          <span className="min-w-0 truncate text-[11px] text-muted-foreground">
            {message.authorName ?? "Người dùng"}
            {message.createdAt ? ` · ${formatRelativeTime(message.createdAt)}` : null}
          </span>
        </div>
        {message.isDeleted ? (
          <p className="mt-1.5 text-sm text-muted-foreground italic">Tin nhắn đã bị xoá</p>
        ) : (
          <MessageText
            text={message.text || "(Tệp đính kèm)"}
            references={message.references}
            className="mt-1.5 line-clamp-3 text-foreground"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-border bg-muted/40 px-2 py-1.5 dark:border-white/6 dark:bg-white/3">
        <button
          type="button"
          onClick={handleFocus}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:h-8"
        >
          <MessageSquareText className="size-3.5" aria-hidden />
          Xem trong trò chuyện
        </button>
        {actions.length > 0 ? (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
            {actions.map((action) => {
              const { icon: Icon, className } = PIN_ACTION_STYLES[action];
              const isBusy = busyAction === action;
              return (
                <Button
                  key={action}
                  type="button"
                  variant={action === "Reopen" ? "outline" : "default"}
                  disabled={busyAction !== null}
                  onClick={() => {
                    setBusyAction(action);
                    void performPinAction(message, action).finally(() => setBusyAction(null));
                  }}
                  className={cn(
                    "h-9 gap-1.5 rounded-lg px-3 text-xs font-semibold active:scale-[0.98] lg:h-8",
                    className,
                  )}
                >
                  {isBusy ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Icon className="size-3.5" aria-hidden />
                  )}
                  {PIN_ACTION_LABELS[action]}
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>
    </li>
  );
}

const PIN_ACTION_STYLES: Record<DiscussionPinAction, { icon: LucideIcon; className: string }> = {
  MarkAddressed: {
    icon: Check,
    className: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  Resolve: {
    icon: CheckCheck,
    className:
      "bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-500/90",
  },
  Reopen: {
    icon: RotateCcw,
    className: "text-foreground",
  },
};
