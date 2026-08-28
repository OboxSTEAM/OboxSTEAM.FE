"use client";

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  acceptIntensiveClassRedeliveryRequest,
  declineIntensiveClassRedeliveryRequest,
  getClassRedeliveryCandidates,
  getClassWithSessions,
  type ClassRedeliveryCandidateSession,
} from "@/lib/api";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";

type ClassRedeliveryIntensiveConsentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  targetClassId?: string | null;
  moduleId?: string | null;
  onResolved: () => void;
};

type IntensiveSchedulePreview = {
  className: string | null;
  classCode: string | null;
  mentorName: string | null;
  seatsTaken: number | null;
  maxCapacity: number | null;
  sessions: ClassRedeliveryCandidateSession[];
};

export function ClassRedeliveryIntensiveConsentDialog({
  open,
  onOpenChange,
  requestId,
  targetClassId = null,
  moduleId = null,
  onResolved,
}: ClassRedeliveryIntensiveConsentDialogProps) {
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [preview, setPreview] = useState<IntensiveSchedulePreview | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setLoadState("idle");
      setBusy(null);
      return;
    }

    let cancelled = false;
    setLoadState("loading");

    void (async () => {
      try {
        const candidatesResult = await getClassRedeliveryCandidates(requestId);
        const candidate = candidatesResult?.data?.[0];
        if (cancelled) return;

        if (candidate) {
          setPreview({
            className: candidate.name,
            classCode: candidate.code,
            mentorName: candidate.mentorName,
            seatsTaken: candidate.seatsTaken,
            maxCapacity: candidate.maxCapacity,
            sessions: candidate.moduleSessions,
          });
          setLoadState("ready");
          return;
        }

        if (targetClassId) {
          const classResult = await getClassWithSessions(targetClassId);
          const classData = classResult?.data;
          if (cancelled) return;

          const sessions = (classData?.sessions ?? [])
            .filter((session) => !moduleId || session.moduleId === moduleId)
            .map((session) => ({
              sessionId: session.id,
              title: session.title,
              startTime: session.startTime,
              endTime: session.endTime,
              sessionKind: session.sessionKind,
            }));

          setPreview({
            className: classData?.name ?? null,
            classCode: classData?.code ?? null,
            mentorName: null,
            seatsTaken: classData?.seatsTaken ?? null,
            maxCapacity: classData?.maxCapacity ?? null,
            sessions,
          });
          setLoadState("ready");
          return;
        }

        setPreview(null);
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        setPreview(null);
        setLoadState("error");
        showAppErrorFromUnknown(error, "class-redelivery.select");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, requestId, targetClassId, moduleId]);

  async function handleAccept() {
    setBusy("accept");
    try {
      await acceptIntensiveClassRedeliveryRequest(requestId);
      showAppSuccess({
        title: "Đã nhận lịch học nén",
        description: "Tiếp theo hãy thanh toán để giữ lớp gốc và thêm ghế học lại.",
      });
      onOpenChange(false);
      onResolved();
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.intensive");
    } finally {
      setBusy(null);
    }
  }

  async function handleDecline() {
    setBusy("decline");
    try {
      await declineIntensiveClassRedeliveryRequest(requestId);
      showAppSuccess({
        title: "Đã từ chối lịch nén",
        description: "Tiến độ module được giữ. Bạn có thể xin học lại sau.",
      });
      onOpenChange(false);
      onResolved();
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.intensive");
    } finally {
      setBusy(null);
    }
  }

  const seatsLabel =
    preview?.seatsTaken != null && preview.maxCapacity != null
      ? `${preview.seatsTaken}/${preview.maxCapacity} ghế`
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="relative border-b border-learn-border px-6 pb-4 pt-5">
          <DialogClose className="top-4 right-4" />
          <DialogHeader className="gap-1.5 pr-8">
            <DialogTitle className="text-lg font-semibold">
              Xác nhận lịch học nén
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Quản lý đã mở lớp học lại (Remedial) với lịch nén. Nhận lịch để
              thanh toán và học song song (giữ lớp gốc). Từ chối sẽ rút yêu cầu —
              tiến độ vẫn được giữ.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          {loadState === "loading" || loadState === "idle" ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-learn-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Đang tải lịch học nén…
            </div>
          ) : loadState === "error" ? (
            <p className="py-6 text-center text-sm text-learn-muted">
              Không tải được lịch. Bạn vẫn có thể nhận hoặc từ chối bên dưới.
            </p>
          ) : preview ? (
            <div className="rounded-xl border border-learn-border bg-learn-surface-2/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold text-learn-text-strong">
                    {preview.className?.trim() || "Lớp học lại"}
                  </p>
                  {preview.classCode?.trim() ? (
                    <p className="mt-0.5 font-mono text-xs text-learn-muted">
                      {preview.classCode.trim()}
                    </p>
                  ) : null}
                </div>
                {seatsLabel ? (
                  <Badge
                    variant="outline"
                    className="border-learn-border text-learn-muted"
                  >
                    {seatsLabel}
                  </Badge>
                ) : null}
              </div>

              {preview.mentorName?.trim() ? (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-learn-muted">
                  <Users className="size-3" aria-hidden />
                  {preview.mentorName.trim()}
                </p>
              ) : null}

              {preview.sessions.length > 0 ? (
                <ul className="mt-3 space-y-1.5 border-t border-learn-border pt-3">
                  {preview.sessions.map((session) => (
                    <li
                      key={session.sessionId}
                      className="flex flex-wrap items-center gap-2 text-xs"
                    >
                      <Badge variant="secondary" className="font-normal">
                        {CLASS_SESSION_KIND_LABELS[session.sessionKind] ??
                          session.sessionKind}
                      </Badge>
                      <span className="text-learn-text-strong">
                        {session.title?.trim() || "Buổi học"}
                      </span>
                      <span className="text-learn-muted">
                        {formatApiDateTimeDisplay(session.startTime)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 border-t border-learn-border pt-3 text-xs text-learn-muted">
                  Chi tiết buổi học sẽ hiện trên lớp sau khi bạn nhận lịch.
                </p>
              )}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-learn-muted">
              Lịch nén sẽ được áp dụng sau khi bạn xác nhận.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-learn-border px-6 py-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-learn-border"
            disabled={busy != null}
            onClick={() => void handleDecline()}
          >
            {busy === "decline" ? "Đang từ chối…" : "Từ chối"}
          </Button>
          <Button
            type="button"
            className="bg-learn-primary text-white hover:bg-learn-primary/90"
            disabled={busy != null}
            onClick={() => void handleAccept()}
          >
            {busy === "accept" ? "Đang xác nhận…" : "Nhận lịch nén"}
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
