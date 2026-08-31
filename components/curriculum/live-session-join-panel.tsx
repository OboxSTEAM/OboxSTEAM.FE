"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Video } from "lucide-react";

import { LiveJaasMeeting } from "@/components/curriculum/live-jaas-meeting";
import { Button } from "@/components/ui/button";
import { useLiveJoinState } from "@/hooks/use-live-join-state";
import { useMeetingUserInfo } from "@/hooks/use-meeting-user-info";
import {
  joinLiveSession,
  leaveLiveSession,
  type LiveSessionJoin,
} from "@/lib/api";
import type { ClassSession } from "@/lib/api/entities/class-session";
import {
  formatJoinCountdown,
  getJoinCountdownParts,
  type LiveJoinState,
} from "@/lib/classes/session-helpers";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { resolveJaasAppId } from "@/lib/jaas/meeting-config";
import { cn } from "@/lib/utils";

type JoinPanelPhase = "idle" | "in-meeting" | "left";

type LiveSessionJoinPanelProps = {
  session: ClassSession;
  onJoined?: (join: LiveSessionJoin) => void;
  onLeft?: () => void;
  className?: string;
  meetingHeight?: string;
};

function JoinCountdownHero({
  ms,
  title,
  hint,
  tone,
}: {
  ms: number;
  title: string;
  hint: string;
  tone: "locked" | "soon";
}) {
  const { days, hours, minutes, seconds } = getJoinCountdownParts(ms);
  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4",
        tone === "locked"
          ? "border-learn-border bg-learn-surface-2"
          : "border-learn-accent/25 bg-learn-accent/5",
      )}
    >
      <p className="text-sm font-semibold text-learn-text-strong">{title}</p>
      <p
        className="mt-2 font-mono text-3xl font-bold tabular-nums tracking-tight text-learn-text-strong"
        aria-live="polite"
        aria-label={`Còn ${formatJoinCountdown(ms)}`}
      >
        {days > 0 ? (
          <span className="mr-2 text-xl">{days} ngày</span>
        ) : null}
        {hours > 0 || days > 0 ? (
          <span>
            {pad(hours)}:{pad(minutes)}:{pad(seconds)}
          </span>
        ) : (
          <span>
            {pad(minutes)}:{pad(seconds)}
          </span>
        )}
      </p>
      <p className="mt-2 text-xs text-learn-muted">{hint}</p>
    </div>
  );
}

function RecordingLink({ joinUrl }: { joinUrl: string }) {
  return (
    <a
      href={joinUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-learn-border bg-learn-surface px-4 py-3 text-sm font-semibold text-learn-text-strong hover:bg-learn-surface-2"
    >
      Xem ghi hình
      <ExternalLink className="size-3.5" aria-hidden />
    </a>
  );
}

function IdleJoinButton({
  label,
  disabled,
  busy,
  onJoin,
}: {
  label: string;
  disabled?: boolean;
  busy?: boolean;
  onJoin: () => void;
}) {
  return (
    <Button
      type="button"
      disabled={disabled || busy}
      onClick={onJoin}
      className="inline-flex h-auto w-full items-center justify-center gap-2 rounded-2xl bg-learn-accent px-4 py-3.5 text-base font-semibold text-white hover:opacity-90"
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
      <p className="rounded-xl border border-learn-border bg-learn-surface-2 px-4 py-3 text-sm text-learn-muted">
        Buổi học đã bị hủy.
      </p>
    );
  }

  if (join.phase === "locked") {
    return (
      <JoinCountdownHero
        ms={join.msUntilOpen}
        title="Cửa vào lớp chưa mở"
        hint="Nút Vào lớp học sẽ mở 15 phút trước giờ bắt đầu."
        tone="locked"
      />
    );
  }

  if (panelPhase === "in-meeting" && handlers.meeting) {
    const appId = resolveJaasAppId(handlers.meeting.appId);
    const roomName = handlers.meeting.roomName?.trim();
    const jwt = handlers.meeting.jwt?.trim();

    if (!appId || !roomName || !jwt) {
      return (
        <p className="rounded-xl border border-dashed border-learn-border bg-learn-surface-2 px-4 py-3 text-sm text-learn-muted">
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
      />
    );
  }

  if (panelPhase === "left") {
    return (
      <p className="rounded-xl border border-learn-border bg-learn-surface-2 px-4 py-3 text-sm text-learn-muted">
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
        />
        <IdleJoinButton
          label="Vào lớp học"
          busy={handlers.joinBusy}
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
        onJoin={handlers.onJoin}
      />
    );
  }

  if (join.phase === "recording" && join.joinUrl) {
    return <RecordingLink joinUrl={join.joinUrl} />;
  }

  return (
    <p className="rounded-xl border border-learn-border bg-learn-surface-2 px-4 py-3 text-sm text-learn-muted">
      Buổi học đã kết thúc.
    </p>
  );
}

export function LiveSessionJoinPanel({
  session,
  onJoined,
  onLeft,
  className,
  meetingHeight,
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
      {renderWindowState(join, panelPhase, {
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
