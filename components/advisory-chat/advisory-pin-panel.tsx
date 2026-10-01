"use client";

import { useState } from "react";
import { ChevronDown, Pin } from "lucide-react";

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
import { showAppError } from "@/lib/errors";
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-border">
      <CollapsibleTrigger
        className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm font-semibold text-foreground hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
      >
        <Pin className="size-4 text-primary" aria-hidden />
        <span>Cần sửa</span>
        {pins.isLoading ? (
          <Skeleton className="h-4 w-6 rounded" />
        ) : (
          <span className="rounded-full bg-primary/10 px-1.5 text-xs text-primary tabular-nums">
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
    <li className="rounded-xl border border-border bg-card p-2.5">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
            PIN_STATUS_BADGE_CLASSES[pin.status],
          )}
        >
          {PIN_STATUS_LABELS[pin.status]}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">
          {message.authorName ?? "Người dùng"}
        </span>
      </div>
      {message.isDeleted ? (
        <p className="mt-1 text-sm text-muted-foreground italic">Tin nhắn đã bị xoá</p>
      ) : (
        <MessageText
          text={message.text || "(Tệp đính kèm)"}
          references={message.references}
          className="mt-1 line-clamp-3 text-foreground"
        />
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Button type="button" variant="ghost" size="xs" onClick={handleFocus}>
          Xem trong trò chuyện
        </Button>
        {actions.map((action) => (
          <Button
            key={action}
            type="button"
            variant={action === "Reopen" ? "outline" : "secondary"}
            size="xs"
            disabled={busyAction !== null}
            onClick={() => {
              setBusyAction(action);
              void performPinAction(message, action).finally(() => setBusyAction(null));
            }}
          >
            {PIN_ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
    </li>
  );
}
