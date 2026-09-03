"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Maximize2, Minimize2, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildJaasConfigOverwrite,
  buildJaasInterfaceConfigOverwrite,
} from "@/lib/jaas/meeting-config";
import { cn } from "@/lib/utils";

const JaaSMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JaaSMeeting),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[min(480px,56dvh)] w-full rounded-2xl" />
    ),
  },
);

const DEFAULT_MEETING_HEIGHT = "min(56dvh, 520px)";
const EXPANDED_IFRAME_HEIGHT = "100%";

export type LiveJaasMeetingProps = {
  appId: string;
  roomName: string;
  jwt: string;
  displayName: string;
  email?: string;
  isModerator?: boolean;
  className?: string;
  meetingHeight?: string;
  onReadyToClose?: () => void;
};

function applyIframeLayout(
  node: HTMLDivElement,
  isExpanded: boolean,
  compactHeight: string,
) {
  node.style.width = "100%";
  node.style.border = "0";
  node.style.display = "block";
  if (isExpanded) {
    node.style.height = EXPANDED_IFRAME_HEIGHT;
    node.style.minHeight = "0";
    node.style.flex = "1 1 auto";
  } else {
    node.style.height = compactHeight;
    node.style.minHeight = "";
    node.style.flex = "";
  }
}

export function LiveJaasMeeting({
  appId,
  roomName,
  jwt,
  displayName,
  email,
  isModerator = false,
  className,
  meetingHeight,
  onReadyToClose,
}: LiveJaasMeetingProps) {
  const leaveNotifiedRef = useRef(false);
  const iframeRef = useRef<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedRef = useRef(isExpanded);
  const frameId = useId();
  const compactHeight = meetingHeight ?? DEFAULT_MEETING_HEIGHT;
  const compactHeightRef = useRef(compactHeight);

  isExpandedRef.current = isExpanded;
  compactHeightRef.current = compactHeight;

  const handleReadyToClose = useCallback(() => {
    if (leaveNotifiedRef.current) return;
    leaveNotifiedRef.current = true;
    setIsExpanded(false);
    onReadyToClose?.();
  }, [onReadyToClose]);

  useEffect(() => {
    const node = iframeRef.current;
    if (!node) return;
    applyIframeLayout(node, isExpanded, compactHeight);
  }, [compactHeight, isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isExpanded]);

  return (
    <>
      {isExpanded ? (
        <div
          aria-hidden
          className="w-full"
          style={{ height: compactHeight }}
        />
      ) : null}

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-black/95 transition-[box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
          isExpanded &&
            "fixed inset-3 z-50 flex flex-col shadow-2xl sm:inset-4 md:inset-5",
          className,
        )}
        role={isExpanded ? "dialog" : undefined}
        aria-modal={isExpanded || undefined}
        aria-label={isExpanded ? "Phòng học online toàn màn hình" : undefined}
      >
        <div
          className={cn(
            "flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/80 px-3 py-2",
            !isExpanded && "rounded-t-2xl",
          )}
        >
          <Video className="size-3.5 shrink-0 text-white/70" aria-hidden />
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-white/90">
            Phòng học online
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-lg text-white/75 hover:bg-white/10 hover:text-white"
            aria-expanded={isExpanded}
            aria-controls={frameId}
            aria-label={
              isExpanded ? "Thu gọn phòng học" : "Phóng to phòng học"
            }
            onClick={() => setIsExpanded((open) => !open)}
          >
            {isExpanded ? (
              <Minimize2 className="size-4" aria-hidden />
            ) : (
              <Maximize2 className="size-4" aria-hidden />
            )}
          </Button>
        </div>

        <div
          id={frameId}
          className={cn(
            "min-h-0",
            isExpanded && "flex min-h-0 flex-1 flex-col",
          )}
        >
          <JaaSMeeting
            appId={appId}
            roomName={roomName}
            jwt={jwt}
            userInfo={{
              displayName,
              email: email ?? "",
            }}
            configOverwrite={buildJaasConfigOverwrite(isModerator)}
            interfaceConfigOverwrite={buildJaasInterfaceConfigOverwrite(
              isModerator,
            )}
            onReadyToClose={handleReadyToClose}
            getIFrameRef={(node) => {
              iframeRef.current = node;
              if (node) {
                applyIframeLayout(
                  node,
                  isExpandedRef.current,
                  compactHeightRef.current,
                );
              }
            }}
          />
        </div>
      </div>
    </>
  );
}
