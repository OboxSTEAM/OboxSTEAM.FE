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
  getClassRedeliveryCandidates,
  selectClassRedeliveryRequest,
  type ClassRedeliveryCandidate,
} from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

type ClassRedeliveryCandidatesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  onSelected: () => void;
};

export function ClassRedeliveryCandidatesDialog({
  open,
  onOpenChange,
  requestId,
  onSelected,
}: ClassRedeliveryCandidatesDialogProps) {
  const [candidates, setCandidates] = useState<ClassRedeliveryCandidate[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [selectingId, setSelectingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCandidates([]);
      setLoadState("idle");
      setSelectingId(null);
      return;
    }

    let cancelled = false;
    setLoadState("loading");
    void getClassRedeliveryCandidates(requestId)
      .then((result) => {
        if (cancelled) return;
        setCandidates(result?.data ?? []);
        setLoadState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setCandidates([]);
        setLoadState("error");
        showAppErrorFromUnknown(error, "class-redelivery.select");
      });

    return () => {
      cancelled = true;
    };
  }, [open, requestId]);

  async function handleSelect(classId: string) {
    setSelectingId(classId);
    try {
      await selectClassRedeliveryRequest(requestId, { classId });
      showAppSuccess({
        title: "Đã chọn lớp học lại",
        description: "Tiếp theo hãy thanh toán để hoàn tất chuyển lớp.",
      });
      onOpenChange(false);
      onSelected();
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.select");
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="relative border-b border-learn-border px-6 pb-4 pt-5">
          <DialogClose className="top-4 right-4" />
          <DialogHeader className="gap-1.5 pr-8">
            <DialogTitle className="text-lg font-semibold">
              Chọn lớp học lại
            </DialogTitle>
            <DialogDescription className="text-sm">
              Chọn một lớp Standard còn ghế. Sau khi chọn bạn sẽ thanh toán giá
              chương trình để chuyển lớp.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {loadState === "loading" || loadState === "idle" ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-learn-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Đang tải lớp phù hợp…
            </div>
          ) : loadState === "error" ? (
            <p className="py-8 text-center text-sm text-learn-muted">
              Không tải được danh sách lớp. Đóng và thử lại.
            </p>
          ) : candidates.length === 0 ? (
            <p className="py-8 text-center text-sm text-learn-muted">
              Hiện chưa có lớp Standard phù hợp. Yêu cầu đang chờ quản lý xử lý.
            </p>
          ) : (
            <ul className="space-y-3">
              {candidates.map((candidate) => {
                const isBusy = selectingId === candidate.classId;
                return (
                  <li
                    key={candidate.classId}
                    className="rounded-xl border border-learn-border bg-learn-surface-2/50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-heading text-sm font-semibold text-learn-text-strong">
                          {candidate.name?.trim() || "Lớp học lại"}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-learn-muted">
                          {candidate.code?.trim() || candidate.classId.slice(0, 8)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-learn-border text-learn-muted"
                      >
                        {candidate.seatsTaken}/{candidate.maxCapacity} ghế
                        {candidate.seatsRemaining > 0
                          ? ` · còn ${candidate.seatsRemaining}`
                          : " · đã đầy"}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-learn-muted">
                      <span>
                        Bắt đầu {formatApiDateTimeDisplay(candidate.startDate)}
                      </span>
                      {candidate.mentorName?.trim() ? (
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3" aria-hidden />
                          {candidate.mentorName.trim()}
                        </span>
                      ) : null}
                    </div>

                    {candidate.moduleSessions.length > 0 ? (
                      <ul className="mt-3 space-y-1.5 border-t border-learn-border pt-3">
                        {candidate.moduleSessions.map((session) => (
                          <li
                            key={session.sessionId}
                            className="flex flex-wrap items-center gap-2 text-xs"
                          >
                            <Badge
                              variant="secondary"
                              className="font-normal"
                            >
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
                    ) : null}

                    <Button
                      type="button"
                      className={cn(
                        "mt-3 w-full bg-learn-primary text-white hover:bg-learn-primary/90",
                      )}
                      disabled={
                        selectingId != null || candidate.seatsRemaining <= 0
                      }
                      onClick={() => void handleSelect(candidate.classId)}
                    >
                      {isBusy ? "Đang chọn…" : "Chọn lớp này"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogPopup>
    </Dialog>
  );
}
