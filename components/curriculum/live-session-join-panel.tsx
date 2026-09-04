"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Video } from "lucide-react";

import { JoinCountdownHero } from "@/components/curriculum/join-countdown-hero";
import { LiveJaasMeeting } from "@/components/curriculum/live-jaas-meeting";
import {
  idleJoinButtonClass,
  joinPanelDashedMessageClass,
  joinPanelMessageClass,
  type SessionJoinVariant,
} from "@/components/curriculum/session-join-styles";
import { Button } from "@/components/ui/button";
import { useLiveJoinState } from "@/hooks/use-live-join-state";
import { useMeetingUserInfo } from "@/hooks/use-meeting-user-info";
import {
  joinLiveSession,
  leaveLiveSession,
  type LiveSessionJoin,
} from "@/lib/api";
import type { ClassSession } from "@/lib/api/entities/class-session";
import { type LiveJoinState } from "@/lib/classes/session-helpers";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { resolveJaasAppId } from "@/lib/jaas/meeting-config";

type JoinPanelPhase = "idle" | "in-meeting" | "left";

type LiveSessionJoinPanelProps = {
  session: ClassSession;
  onJoined?: (join: LiveSessionJoin) => void;
  onLeft?: () => void;
  className?: string;
  meetingHeight?: string;
  /** `learn` = inside `.learn-shell`; `app` = mentor/manager surfaces */
  variant?: SessionJoinVariant;
};

function IdleJoinButton({
  label,
  disabled,
  busy,
  variant,
  onJoin,
}: {
  label: string;
  disabled?: boolean;
  busy?: boolean;
  variant: SessionJoinVariant;
  onJoin: () => void;
}) {
  return (
    <Button
      type="button"
      disabled={disabled || busy}
      onClick={onJoin}
      className={idleJoinButtonClass(variant)}
    >
      {busy ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : (
        <Video className="size-5" aria-hidden />
      )}
      {busy ? "Đang vào lớp…" : label}
    </Button>
  );
}

function renderWindowState(
  join: LiveJoinState,
  panelPhase: JoinPanelPhase,
  variant: SessionJoinVariant,
  handlers: {
    onJoin: () => void;
    joinBusy: boolean;
    meeting: LiveSessionJoin | null;
    userInfo: { displayName: string; email: string };
    onMeetingClose: () => void;
    meetingHeight?: string;
  },
) {
  if (join.phase === "cancelled") {
    return (
      <p className={joinPanelMessageClass(variant)}>Buổi học đã bị hủy.</p>
    );
  }

  if (join.phase === "locked") {
    return (
      <JoinCountdownHero
        ms={join.msUntilOpen}
        title="Cửa vào lớp chưa mở"
        hint="Nút Vào lớp học sẽ mở 15 phút trước giờ bắt đầu."
        tone="locked"
        variant={variant}
      />
    );
  }

  if (panelPhase === "in-meeting" && handlers.meeting) {
    const appId = resolveJaasAppId(handlers.meeting.appId);
    const roomName = handlers.meeting.roomName?.trim();
    const jwt = handlers.meeting.jwt?.trim();

    if (!appId || !roomName || !jwt) {
      return (
        <p className={joinPanelDashedMessageClass(variant)}>
          Máy chủ chưa trả thông tin phòng học (JaaS). Thử lại sau vài giây.
        </p>
      );
    }

    return (
      <LiveJaasMeeting
        appId={appId}
        roomName={roomName}
        jwt={jwt}
        displayName={handlers.userInfo.displayName}
        email={handlers.userInfo.email}
        isModerator={handlers.meeting.isModerator}
        meetingHeight={handlers.meetingHeight}
        onReadyToClose={handlers.onMeetingClose}
      />
    );
  }

  if (panelPhase === "left") {
    return (
      <p className={joinPanelMessageClass(variant)}>
        Bạn đã rời buổi học. Có thể tham gia lại nếu buổi vẫn đang diễn ra.
      </p>
    );
  }

  if (join.phase === "countdown") {
    return (
      <div className="space-y-3">
        <JoinCountdownHero
          ms={join.msUntilStart}
          title="Sắp vào lớp"
          hint="Bạn có thể tham gia từ bây giờ. Buổi học bắt đầu sau vài phút."
          tone="soon"
          variant={variant}
        />
        <IdleJoinButton
          label="Vào lớp học"
          busy={handlers.joinBusy}
          variant={variant}
          onJoin={handlers.onJoin}
        />
      </div>
    );
  }

  if (join.phase === "live") {
    return (
      <IdleJoinButton
        label="Đang diễn ra · Vào lớp học"
        busy={handlers.joinBusy}
        variant={variant}
        onJoin={handlers.onJoin}
      />
    );
  }

  return (
    <p className={joinPanelMessageClass(variant)}>Buổi học đã kết thúc.</p>
  );
}

export function LiveSessionJoinPanel({
  session,
  onJoined,
  onLeft,
  className,
  meetingHeight,
  variant = "learn",
}: LiveSessionJoinPanelProps) {
  const join = useLiveJoinState(session);
  const userInfo = useMeetingUserInfo();
  const [panelPhase, setPanelPhase] = useState<JoinPanelPhase>("idle");
  const [joinBusy, setJoinBusy] = useState(false);
  const [meeting, setMeeting] = useState<LiveSessionJoin | null>(null);
  const leaveInFlightRef = useRef(false);
  const sessionIdRef = useRef(session.id);

  sessionIdRef.current = session.id;

  const handleLeave = useCallback(async () => {
    if (leaveInFlightRef.current) return;
    leaveInFlightRef.current = true;
    try {
      await leaveLiveSession(sessionIdRef.current);
      onLeft?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "classSessions.leave");
    } finally {
      leaveInFlightRef.current = false;
      setMeeting(null);
      setPanelPhase("left");
    }
  }, [onLeft]);

  const handleMeetingClose = useCallback(() => {
    void handleLeave();
  }, [handleLeave]);

  const handleJoin = useCallback(async () => {
    if (joinBusy || panelPhase === "in-meeting") return;
    setJoinBusy(true);
    try {
      const envelope = await joinLiveSession(session.id);
      const payload = envelope?.data;
      if (!payload) {
        throw new Error("Join response missing meeting payload.");
      }
      setMeeting(payload);
      setPanelPhase("in-meeting");
      onJoined?.(payload);
    } catch (error) {
      showAppErrorFromUnknown(error, "classSessions.join");
    } finally {
      setJoinBusy(false);
    }
  }, [joinBusy, onJoined, panelPhase, session.id]);

  useEffect(() => {
    if (panelPhase !== "in-meeting") return;

    const onPageHide = () => {
      void leaveLiveSession(sessionIdRef.current).catch(() => undefined);
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [panelPhase]);

  useEffect(() => {
    setPanelPhase("idle");
    setMeeting(null);
    setJoinBusy(false);
    leaveInFlightRef.current = false;
  }, [session.id]);

  if (!join) return null;

  return (
    <div className={className}>
      {renderWindowState(join, panelPhase, variant, {
        onJoin: () => {
          void handleJoin();
        },
        joinBusy,
        meeting,
        userInfo,
        onMeetingClose: handleMeetingClose,
        meetingHeight,
      })}
    </div>
  );
}
