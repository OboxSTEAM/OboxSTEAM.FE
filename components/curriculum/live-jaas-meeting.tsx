"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";

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

  const handleReadyToClose = useCallback(() => {
    if (leaveNotifiedRef.current) return;
    leaveNotifiedRef.current = true;
    onReadyToClose?.();
  }, [onReadyToClose]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-learn-border bg-black/95",
        className,
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
        interfaceConfigOverwrite={buildJaasInterfaceConfigOverwrite(isModerator)}
        onReadyToClose={handleReadyToClose}
        getIFrameRef={(node) => {
          if (node) {
            node.style.height = meetingHeight ?? "min(56dvh, 520px)";
            node.style.width = "100%";
            node.style.border = "0";
          }
        }}
      />
    </div>
  );
}
