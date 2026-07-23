"use client";

import { useState, type DragEvent } from "react";
import {
  Check,
  Eye,
  GripVertical,
  Inbox,
  UserRound,
  X,
} from "lucide-react";

import { MentorProfileDialog } from "@/components/mentors/mentor-profile-dialog";
import { getMentorInitials } from "@/components/mentors/mentor-profile-content";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  approveClassMentorRequest,
  getClassMentorRequests,
  getMentorById,
  rejectClassMentorRequest,
  type ClassMentorRequest,
  type SkillSummary,
} from "@/lib/api";
import {
  AUTO_REJECT_AFTER_APPROVE_NOTE,
  CLASS_MENTOR_REQUEST_STATUS_LABELS,
} from "@/lib/classes/constants";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

const REQUEST_DRAG_TYPE = "application/x-obox-mentor-request";

type PreviewTarget = {
  mentorId: string;
  fullName?: string | null;
  code?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  requestMessage?: string | null;
};

type ClassMentorAssignmentPanelProps = {
  classId: string;
  mentorId: string | null;
  requiredSkills?: SkillSummary[];
  onChanged: () => void;
};

export function ClassMentorAssignmentPanel({
  classId,
  mentorId,
  requiredSkills = [],
  onChanged,
}: ClassMentorAssignmentPanelProps) {
  const [isDropActive, setIsDropActive] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ClassMentorRequest | null>(
    null,
  );
  const [rejectNote, setRejectNote] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);

  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    retry: retryRequests,
  } = useClientFetch({
    fetcher: () =>
      getClassMentorRequests({
        classId,
        page: 1,
        pageSize: 50,
      }),
    deps: [classId],
    onError: (error) =>
      showAppErrorFromUnknown(error, "classMentorRequests.list"),
  });

  const { data: assignedMentor, isLoading: isMentorLoading } = useClientFetch({
    enabled: !!mentorId,
    fetcher: async () => {
      if (!mentorId) return null;
      const result = await getMentorById(mentorId);
      return result?.data ?? null;
    },
    deps: [mentorId],
    onError: (error) => showAppErrorFromUnknown(error, "mentors.detail"),
  });

  const requests = requestsData?.data?.items ?? [];
  const pendingRequests = requests.filter((item) => item.status === "Pending");
  const historyRequests = requests.filter((item) => item.status !== "Pending");
  const assignedFromRequest = requests.find(
    (item) =>
      item.status === "Approved" &&
      mentorId != null &&
      item.mentorId === mentorId,
  );
  const mentorDisplayName =
    assignedMentor?.fullName ||
    assignedFromRequest?.mentorName ||
    assignedFromRequest?.mentorCode ||
    null;

  const showPendingSection = !mentorId;
  const showHistory =
    showPendingSection && historyRequests.length > 0 && pendingRequests.length === 0;

  async function rejectRemainingPending(
    approvedId: string,
    remaining: ClassMentorRequest[],
  ) {
    const others = remaining.filter((item) => item.id !== approvedId);
    await Promise.allSettled(
      others.map((item) =>
        rejectClassMentorRequest(item.id, {
          decisionNote: AUTO_REJECT_AFTER_APPROVE_NOTE,
        }),
      ),
    );
  }

  async function handleApprove(request: ClassMentorRequest) {
    if (isBusy || mentorId) return;
    setIsBusy(true);
    try {
      await approveClassMentorRequest(request.id);
      await rejectRemainingPending(request.id, pendingRequests);
      showAppSuccess({
        title: "Đã gán mentor",
        description: `${request.mentorName || request.mentorCode || "Mentor"} đã được duyệt. Các yêu cầu còn lại đã từ chối.`,
      });
      retryRequests();
      onChanged();
    } catch (error) {
      showAppErrorFromUnknown(error, "classMentorRequests.approve");
    } finally {
      setIsBusy(false);
      setDraggingId(null);
      setIsDropActive(false);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget) return;
    setIsRejecting(true);
    try {
      await rejectClassMentorRequest(rejectTarget.id, {
        decisionNote: rejectNote.trim() || null,
      });
      showAppSuccess({
        title: "Đã từ chối yêu cầu",
        description: `${rejectTarget.mentorName || rejectTarget.mentorCode || "Mentor"} đã được thông báo.`,
      });
      setRejectTarget(null);
      setRejectNote("");
      retryRequests();
      onChanged();
    } catch (error) {
      showAppErrorFromUnknown(error, "classMentorRequests.reject");
    } finally {
      setIsRejecting(false);
    }
  }

  function handleDragStart(
    event: DragEvent<HTMLElement>,
    request: ClassMentorRequest,
  ) {
    if (mentorId || isBusy) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(REQUEST_DRAG_TYPE, request.id);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(request.id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setIsDropActive(false);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (mentorId || isBusy) return;
    if (![...event.dataTransfer.types].includes(REQUEST_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDropActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsDropActive(false);
  }

  async function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDropActive(false);
    if (mentorId || isBusy) return;

    const requestId = event.dataTransfer.getData(REQUEST_DRAG_TYPE);
    const request = pendingRequests.find((item) => item.id === requestId);
    if (!request) return;
    await handleApprove(request);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
      <div className="flex items-center justify-between border-b border-[#E5E5E0] bg-[#FAFAF5]/70 px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#2D2D2D]">
          <UserRound className="size-4 text-[#E94B3C]" />
          Mentor lớp
        </p>
        {showPendingSection && pendingRequests.length > 0 ? (
          <p className="font-mono text-[11px] text-[#6B6B6B]">
            {pendingRequests.length} chờ duyệt
          </p>
        ) : null}
      </div>

      <div className="p-2">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "rounded-xl px-2 py-1.5 transition-colors",
            !mentorId &&
              (isDropActive
                ? "bg-[#E94B3C]/8 ring-1 ring-[#E94B3C]/40"
                : "ring-1 ring-dashed ring-[#D8D8D2]"),
          )}
        >
          {mentorId ? (
            isMentorLoading && !mentorDisplayName ? (
              <div className="flex h-10 items-center gap-2.5 px-1">
                <Skeleton className="size-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setPreviewTarget({
                    mentorId,
                    fullName: mentorDisplayName,
                    code:
                      assignedMentor?.code || assignedFromRequest?.mentorCode,
                    email: assignedMentor?.email,
                    avatarUrl: assignedMentor?.avatarUrl,
                    status: assignedMentor?.status,
                    requestMessage: null,
                  })
                }
                className="flex h-10 w-full items-center gap-2.5 rounded-lg px-1 text-left transition-colors hover:bg-[#FAFAF5]"
              >
                <Avatar className="size-8 rounded-lg border border-[#E5E5E0]">
                  <AvatarImage
                    src={assignedMentor?.avatarUrl || undefined}
                    alt=""
                  />
                  <AvatarFallback className="rounded-lg bg-[#7CB342]/15 text-[10px] font-bold text-[#3d5c22]">
                    {getMentorInitials(mentorDisplayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#2D2D2D]">
                    {mentorDisplayName || "Mentor đã gán"}
                  </p>
                  <p className="truncate font-mono text-[11px] text-[#6B6B6B]">
                    {assignedMentor?.code ||
                      assignedFromRequest?.mentorCode ||
                      "Đã gán"}
                  </p>
                </div>
                <Eye
                  className="size-3.5 shrink-0 text-[#8A8A84]"
                  aria-hidden
                />
                <span className="sr-only">Xem hồ sơ mentor</span>
              </button>
            )
          ) : (
            <div className="flex h-10 items-center gap-2.5 px-1 text-[#6B6B6B]">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#FAFAF5] ring-1 ring-[#E5E5E0]">
                <Inbox className="size-3.5 text-[#B0B0A8]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#2D2D2D]">
                  Chưa có mentor
                </p>
                <p className="truncate text-[11px] text-[#8A8A84]">
                  {pendingRequests.length > 0
                    ? "Kéo yêu cầu vào đây hoặc bấm Duyệt"
                    : "Chờ mentor xin nhận lớp"}
                </p>
              </div>
            </div>
          )}
        </div>

        {showPendingSection ? (
          <div className="mt-1">
            {isRequestsLoading && pendingRequests.length === 0 ? (
              <div className="space-y-1 px-1 py-1">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : pendingRequests.length > 0 ? (
              <ul className="space-y-0.5">
                {pendingRequests.map((request) => (
                  <li key={request.id}>
                    <div
                      draggable={!isBusy}
                      onDragStart={(event) => handleDragStart(event, request)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "group flex items-center gap-1 rounded-lg px-1 py-1 transition-colors hover:bg-[#FAFAF5]",
                        !isBusy && "cursor-grab active:cursor-grabbing",
                        draggingId === request.id && "opacity-50",
                      )}
                    >
                      <GripVertical
                        className="size-3.5 shrink-0 text-[#D0D0C8] opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewTarget({
                            mentorId: request.mentorId,
                            fullName: request.mentorName,
                            code: request.mentorCode,
                            requestMessage: request.message,
                          })
                        }
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <Avatar className="size-8 rounded-lg border border-[#E5E5E0]">
                          <AvatarFallback className="rounded-lg bg-[#4FC3F7]/12 text-[10px] font-bold text-[#0D6E9C]">
                            {getMentorInitials(request.mentorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#2D2D2D]">
                            {request.mentorName || "Mentor chưa đặt tên"}
                          </p>
                          <p className="truncate font-mono text-[11px] text-[#6B6B6B]">
                            {request.mentorCode || "—"}
                            {request.message ? " · có lời nhắn" : ""}
                          </p>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isBusy}
                          onClick={() => {
                            setRejectNote("");
                            setRejectTarget(request);
                          }}
                          aria-label={`Từ chối ${request.mentorName || "mentor"}`}
                          className="size-7 rounded-md text-[#a82a1e] hover:bg-[#E94B3C]/10 hover:text-[#a82a1e]"
                        >
                          <X className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isBusy}
                          onClick={() => handleApprove(request)}
                          aria-label={`Duyệt ${request.mentorName || "mentor"}`}
                          className="size-7 rounded-md text-[#3d5c22] hover:bg-[#7CB342]/15 hover:text-[#3d5c22]"
                        >
                          <Check className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : showHistory ? (
              <ul className="space-y-0.5 px-1">
                {historyRequests.slice(0, 3).map((request) => (
                  <li
                    key={request.id}
                    className="flex h-8 items-center justify-between gap-2 rounded-lg px-2 text-xs text-[#6B6B6B]"
                  >
                    <span className="truncate">
                      {request.mentorName || request.mentorCode || "Mentor"}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-medium",
                        request.status === "Approved" && "text-[#3d5c22]",
                        request.status === "Rejected" && "text-[#a82a1e]",
                      )}
                    >
                      {CLASS_MENTOR_REQUEST_STATUS_LABELS[request.status]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : !isRequestsLoading ? (
              <p className="px-3 py-2 text-[11px] text-[#8A8A84]">
                Chưa có yêu cầu xin nhận lớp
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectNote("");
          }
        }}
      >
        <DialogPopup className="max-w-md gap-0 p-0">
          <DialogHeader className="border-b border-[#E8E8E3] px-6 py-5 pr-14">
            <DialogTitle>Từ chối yêu cầu mentor?</DialogTitle>
            <DialogDescription>
              Mentor “
              {rejectTarget?.mentorName || rejectTarget?.mentorCode || ""}” sẽ
              nhận trạng thái Từ chối.
            </DialogDescription>
          </DialogHeader>
          <DialogClose />
          <div className="space-y-2 px-6 py-5">
            <label
              htmlFor="reject-note"
              className="block text-xs font-medium text-[#6B6B6B]"
            >
              Ghi chú gửi mentor (tuỳ chọn)
            </label>
            <Textarea
              id="reject-note"
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              maxLength={1000}
              placeholder="Ví dụ: Cảm ơn bạn, lớp đã chọn mentor phù hợp hơn với kỹ năng yêu cầu."
              className="min-h-24 rounded-xl border-[#DDDDD8] text-sm"
            />
          </div>
          <DialogFooter className="border-t border-[#E8E8E3] px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={isRejecting}
              onClick={() => {
                setRejectTarget(null);
                setRejectNote("");
              }}
              className="h-10 rounded-lg border-[#E5E5E0]"
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={isRejecting}
              onClick={handleRejectConfirm}
              className="h-10 rounded-lg bg-[#E94B3C] font-semibold text-white hover:bg-[#D94134]"
            >
              {isRejecting ? "Đang xử lý…" : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      <MentorProfileDialog
        mentorId={previewTarget?.mentorId ?? null}
        open={previewTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPreviewTarget(null);
        }}
        preview={
          previewTarget
            ? {
                fullName: previewTarget.fullName,
                code: previewTarget.code,
                email: previewTarget.email,
                avatarUrl: previewTarget.avatarUrl,
                status: previewTarget.status,
              }
            : null
        }
        requiredSkills={requiredSkills}
        requestMessage={previewTarget?.requestMessage}
      />
    </section>
  );
}
