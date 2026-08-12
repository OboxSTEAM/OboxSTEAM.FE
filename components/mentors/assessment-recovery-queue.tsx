"use client";

import { useState } from "react";
import { Check, Inbox, RotateCcw, X } from "lucide-react";

import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  approveAssessmentRecoveryRequest,
  getPendingAssessmentRecoveryRequests,
  rejectAssessmentRecoveryRequest,
  type AssessmentRecoveryRequest,
} from "@/lib/api";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

export function AssessmentRecoveryQueue() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] =
    useState<AssessmentRecoveryRequest | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<AssessmentRecoveryRequest | null>(null);
  const [extraAttempts, setExtraAttempts] = useState(1);
  const [personalDueDate, setPersonalDueDate] = useState("");
  const [personalAvailableUntil, setPersonalAvailableUntil] = useState("");
  const [mentorNote, setMentorNote] = useState("");

  const { data, isLoading, retry, markLoading } = useClientFetch({
    fetcher: async () => {
      const result = await getPendingAssessmentRecoveryRequests();
      return result?.data ?? [];
    },
    deps: [],
    onError: (error) =>
      showAppErrorFromUnknown(error, "assessment-recovery.list"),
  });

  const requests = data ?? [];

  async function handleApprove() {
    if (!approveTarget) return;
    setBusyId(approveTarget.id);
    try {
      await approveAssessmentRecoveryRequest(approveTarget.id, {
        extraAttemptsGranted: extraAttempts,
        personalDueDate: personalDueDate.trim() || null,
        personalAvailableUntil: personalAvailableUntil.trim() || null,
        mentorNote: mentorNote.trim() || null,
      });
      showAppSuccess({ title: "Đã duyệt yêu cầu làm lại" });
      setApproveTarget(null);
      setMentorNote("");
      setPersonalDueDate("");
      setPersonalAvailableUntil("");
      setExtraAttempts(1);
      markLoading();
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "assessment-recovery.decide");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await rejectAssessmentRecoveryRequest(rejectTarget.id, {
        mentorNote: mentorNote.trim() || null,
      });
      showAppSuccess({ title: "Đã từ chối yêu cầu" });
      setRejectTarget(null);
      setMentorNote("");
      markLoading();
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "assessment-recovery.decide");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Mentor
          </p>
          <h1 className="font-heading mt-1 text-2xl font-bold text-foreground">
            Yêu cầu làm lại bài
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Duyệt thêm lượt làm hoặc gia hạn thời gian cho học viên.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            markLoading();
            retry();
          }}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Tải lại
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6">
            <ManagerEmptyState
              icon={Inbox}
              title="Không có yêu cầu chờ duyệt"
              description="Khi học viên xin làm thêm lần, yêu cầu sẽ hiện tại đây."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {requests.map((request) => {
              const isBusy = busyId === request.id;
              return (
                <li
                  key={request.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-[#FDD835]/35 bg-[#FDD835]/20 text-[#8A7200]"
                      >
                        Chờ duyệt
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {request.id.slice(0, 8)}…
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      Assignment{" "}
                      <span className="font-mono text-xs">
                        {request.assignmentId.slice(0, 8)}…
                      </span>
                      {" · "}Module enrollment{" "}
                      <span className="font-mono text-xs">
                        {request.moduleEnrollmentId.slice(0, 8)}…
                      </span>
                    </p>
                    {request.studentMessage?.trim() ? (
                      <p className="rounded-lg border border-[#FDD835]/35 bg-[#FDD835]/10 px-2.5 py-1.5 text-xs text-foreground/90">
                        {request.studentMessage.trim()}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Gửi lúc {formatApiDateTimeDisplay(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isBusy}
                      aria-label="Từ chối"
                      className="size-9 rounded-lg text-primary hover:bg-primary/10"
                      onClick={() => {
                        setMentorNote("");
                        setRejectTarget(request);
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isBusy}
                      aria-label="Duyệt"
                      className={cn(
                        "size-9 rounded-lg text-[#3d5c22] hover:bg-[#7CB342]/15",
                      )}
                      onClick={() => {
                        setExtraAttempts(1);
                        setPersonalDueDate("");
                        setPersonalAvailableUntil("");
                        setMentorNote("");
                        setApproveTarget(request);
                      }}
                    >
                      <Check className="size-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={approveTarget != null}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duyệt yêu cầu làm lại</DialogTitle>
            <DialogDescription>
              Theory chỉ gia hạn: đặt số lần = 0 và điền hạn. Module thực hành:
              thường ≥ 1 lần.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="extra-attempts">Số lần làm thêm</Label>
              <Input
                id="extra-attempts"
                type="number"
                min={0}
                value={extraAttempts}
                onChange={(event) =>
                  setExtraAttempts(Number(event.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due-date">Hạn nộp cá nhân (tuỳ chọn)</Label>
              <Input
                id="due-date"
                type="datetime-local"
                value={personalDueDate}
                onChange={(event) => setPersonalDueDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="available-until">Mở đến (tuỳ chọn)</Label>
              <Input
                id="available-until"
                type="datetime-local"
                value={personalAvailableUntil}
                onChange={(event) =>
                  setPersonalAvailableUntil(event.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="approve-note">Ghi chú mentor</Label>
              <Textarea
                id="approve-note"
                value={mentorNote}
                onChange={(event) => setMentorNote(event.target.value)}
                className="min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveTarget(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={busyId != null}
              onClick={() => void handleApprove()}
            >
              Duyệt
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <Dialog
        open={rejectTarget != null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu</DialogTitle>
            <DialogDescription>
              Học viên sẽ nhận thông báo từ chối.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={mentorNote}
            onChange={(event) => setMentorNote(event.target.value)}
            placeholder="Lý do (không bắt buộc)"
            className="min-h-24"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectTarget(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busyId != null}
              onClick={() => void handleReject()}
            >
              Từ chối
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
