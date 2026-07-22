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

import { MentorQuickPreviewSheet } from "@/components/manager/classes/mentor-quick-preview-sheet";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
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
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

const REQUEST_DRAG_TYPE = "application/x-obox-mentor-request";

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "GV";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type PreviewTarget = {
  mentorId: string;
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
      return getMentorById(mentorId);
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
    assignedMentor?.data?.fullName ||
    assignedFromRequest?.mentorName ||
    assignedFromRequest?.mentorCode ||
    null;

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
      <div className="flex items-center justify-between border-b border-[#E5E5E0] bg-[#FAFAF5]/70 px-6 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#2D2D2D]">
          <UserRound className="size-4 text-[#E94B3C]" />
          Mentor lớp
        </p>
        <p className="font-mono text-xs text-[#6B6B6B]">
          {pendingRequests.length} chờ duyệt
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-44 flex-col justify-center rounded-2xl border-2 border-dashed p-5 transition-colors",
            mentorId
              ? "border-[#7CB342]/35 bg-[#7CB342]/5"
              : isDropActive
                ? "border-[#E94B3C] bg-[#E94B3C]/8"
                : "border-[#D8D8D2] bg-[#FAFAF5]/80",
          )}
        >
          {mentorId ? (
            isMentorLoading && !mentorDisplayName ? (
              <div className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar className="size-12 border border-[#E5E5E0]">
                  <AvatarImage
                    src={assignedMentor?.data?.avatarUrl || undefined}
                    alt=""
                  />
                  <AvatarFallback className="bg-[#7CB342]/15 text-xs font-bold text-[#3d5c22]">
                    {getInitials(mentorDisplayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                    Đã gán mentor
                  </p>
                  <p className="truncate font-semibold text-[#2D2D2D]">
                    {mentorDisplayName || "Mentor đã gán"}
                  </p>
                  {assignedMentor?.data?.email ? (
                    <p className="truncate text-xs text-[#6B6B6B]">
                      {assignedMentor.data.email}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-[#3d5c22]">
                    {assignedMentor?.data?.skills.length ?? 0} kỹ năng
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPreviewTarget({ mentorId, requestMessage: null })
                  }
                  className="h-9 shrink-0 gap-1.5 rounded-lg border-[#E5E5E0]"
                >
                  <Eye className="size-3.5" />
                  Xem
                </Button>
              </div>
            )
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#E94B3C]/10 text-[#E94B3C]">
                <Inbox className="size-5" />
              </div>
              <p className="font-semibold text-[#2D2D2D]">Chưa có mentor</p>
              <p className="mt-1 text-sm text-[#6B6B6B]">
                Kéo một yêu cầu bên phải vào đây để duyệt, hoặc bấm Duyệt trên
                từng thẻ.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#2D2D2D]">
              Yêu cầu chờ duyệt
            </h3>
            <p className="mt-0.5 text-xs text-[#6B6B6B]">
              Duyệt một mentor sẽ tự từ chối các yêu cầu còn lại của lớp này.
            </p>
          </div>

          {isRequestsLoading && pendingRequests.length === 0 ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <ManagerEmptyState
              title={
                mentorId
                  ? "Không còn yêu cầu chờ duyệt"
                  : "Chưa có mentor xin nhận lớp"
              }
              description={
                mentorId
                  ? "Lớp đã có mentor. Yêu cầu mới sẽ không còn ở trạng thái chờ."
                  : "Khi mentor gửi yêu cầu, thẻ sẽ xuất hiện tại đây để bạn duyệt."
              }
              icon={Inbox}
            />
          ) : (
            <ul className="space-y-3">
              {pendingRequests.map((request) => (
                <li key={request.id}>
                  <article
                    draggable={!mentorId && !isBusy}
                    onDragStart={(event) => handleDragStart(event, request)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "rounded-xl border border-[#E5E5E0] bg-white p-4 transition-shadow",
                      !mentorId && !isBusy
                        ? "cursor-grab active:cursor-grabbing hover:shadow-[0_6px_18px_rgba(45,45,45,0.06)]"
                        : "opacity-70",
                      draggingId === request.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!mentorId ? (
                        <GripVertical
                          className="mt-1 size-4 shrink-0 text-[#B0B0A8]"
                          aria-hidden
                        />
                      ) : null}
                      <Avatar className="size-10 border border-[#E5E5E0]">
                        <AvatarFallback className="bg-[#4FC3F7]/12 text-[10px] font-bold text-[#0D6E9C]">
                          {getInitials(request.mentorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewTarget({
                              mentorId: request.mentorId,
                              requestMessage: request.message,
                            })
                          }
                          className="group block w-full min-w-0 text-left"
                        >
                          <p className="truncate font-semibold text-[#2D2D2D] group-hover:text-[#0D6E9C]">
                            {request.mentorName || "Mentor chưa đặt tên"}
                          </p>
                          <p className="font-mono text-xs text-[#6B6B6B]">
                            {request.mentorCode || "—"}
                          </p>
                        </button>
                        {request.message ? (
                          <p className="mt-2 line-clamp-2 text-sm text-[#4A4A4A]">
                            {request.message}
                          </p>
                        ) : null}
                        <p className="mt-2 text-[11px] text-[#8A8A84]">
                          Gửi lúc{" "}
                          {formatApiDateTimeDisplay(request.createdAt) || "—"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setPreviewTarget({
                            mentorId: request.mentorId,
                            requestMessage: request.message,
                          })
                        }
                        aria-label={`Xem hồ sơ ${request.mentorName || "mentor"}`}
                        className="size-9 shrink-0 rounded-lg text-[#6B6B6B] hover:bg-[#4FC3F7]/10 hover:text-[#0D6E9C]"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </div>
                    {!mentorId ? (
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => {
                            setRejectNote("");
                            setRejectTarget(request);
                          }}
                          className="h-9 gap-1.5 rounded-lg border-[#E5E5E0] text-[#a82a1e] hover:bg-[#E94B3C]/8"
                        >
                          <X className="size-3.5" />
                          Từ chối
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleApprove(request)}
                          className="h-9 gap-1.5 rounded-lg bg-[#7CB342] px-3 font-semibold text-white hover:bg-[#6BA338]"
                        >
                          <Check className="size-3.5" />
                          Duyệt
                        </Button>
                      </div>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          )}

          {historyRequests.length > 0 ? (
            <div className="border-t border-[#ECECE7] pt-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                Lịch sử gần đây
              </h4>
              <ul className="space-y-2">
                {historyRequests.slice(0, 5).map((request) => (
                  <li
                    key={request.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[#FAFAF5] px-3 py-2 text-sm"
                  >
                    <span className="truncate text-[#2D2D2D]">
                      {request.mentorName || request.mentorCode || "Mentor"}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-semibold",
                        request.status === "Approved" && "text-[#3d5c22]",
                        request.status === "Rejected" && "text-[#a82a1e]",
                        request.status === "Withdrawn" && "text-[#6B6B6B]",
                      )}
                    >
                      {CLASS_MENTOR_REQUEST_STATUS_LABELS[request.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
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
      <MentorQuickPreviewSheet
        mentorId={previewTarget?.mentorId ?? null}
        open={previewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewTarget(null);
        }}
        requiredSkills={requiredSkills}
        requestMessage={previewTarget?.requestMessage}
      />
    </section>
  );
}
