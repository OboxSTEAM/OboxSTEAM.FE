"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  History,
  MessageSquare,
  ShieldCheck,
  Star,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  ExpertWorkbenchHero,
  ExpertWorkflowRail,
} from "@/components/expert/shared/expert-workbench";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  acceptClassSessionExpert,
  declineClassSessionExpert,
  getMyClassSessionExperts,
  submitClassSessionExpertFeedback,
  type ClassSessionExpert,
  type ClassSessionExpertStatus,
} from "@/lib/api";
import {
  CLASS_SESSION_KIND_LABELS,
  CLASS_SESSION_STATUS_LABELS,
} from "@/lib/classes/constants";
import { formatClassSessionSchedule } from "@/lib/classes/session-helpers";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "Mọi trạng thái" },
  { value: "Invited", label: "Chờ phản hồi" },
  { value: "Accepted", label: "Đã nhận lời" },
  { value: "Declined", label: "Đã từ chối" },
];

const STATUS_BADGE: Record<ClassSessionExpertStatus, { label: string; className: string }> =
  {
    Invited: {
      label: "Chờ phản hồi",
      className: "bg-[#FDD835]/25 text-[#725D00] dark:text-[#fde047]",
    },
    Accepted: {
      label: "Đã nhận lời",
      className: "bg-[#7CB342]/15 text-[#33691e] dark:text-[#a5d66f]",
    },
    Declined: {
      label: "Đã từ chối",
      className: "bg-muted text-muted-foreground",
    },
  };

const PAGE_SIZE = 50;
type ScheduleView = "action" | "upcoming" | "history" | "all";

function canRespondToInvite(invite: ClassSessionExpert): boolean {
  return invite.status === "Invited" && invite.sessionStatus === "Scheduled";
}

function needsFeedback(invite: ClassSessionExpert): boolean {
  return (
    invite.status === "Accepted" &&
    invite.sessionStatus === "Completed" &&
    invite.mentorFeedback == null
  );
}

function isUpcomingAccepted(invite: ClassSessionExpert): boolean {
  return (
    invite.status === "Accepted" &&
    (invite.sessionStatus === "Scheduled" || invite.sessionStatus === "InProgress")
  );
}

function isHistory(invite: ClassSessionExpert): boolean {
  return (
    invite.status === "Declined" ||
    invite.sessionStatus === "Cancelled" ||
    (invite.sessionStatus === "Completed" && !needsFeedback(invite))
  );
}

export function ExpertScheduleManager() {
  const searchParams = useSearchParams();
  const highlightedInviteId = searchParams.get("invite");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<ScheduleView>("action");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading, markLoading, retry } = useClientFetch({
    fetcher: () =>
      getMyClassSessionExperts({
        status:
          status === "all" ? undefined : (status as ClassSessionExpertStatus),
        page: 1,
        pageSize: PAGE_SIZE,
      }),
    deps: [status],
    onError: (error) => showAppErrorFromUnknown(error, "coteach.mine"),
  });

  const invites = useMemo(() => {
    const items = data?.data?.items ?? [];
    const keyword = search.trim().toLocaleLowerCase("vi");
    const filtered = keyword
      ? items.filter((invite) =>
          `${invite.sessionTitle} ${invite.className}`
            .toLocaleLowerCase("vi")
            .includes(keyword),
        )
      : items;

    const inView = filtered.filter((invite) => {
      if (invite.id === highlightedInviteId) return true;
      if (view === "action") return canRespondToInvite(invite) || needsFeedback(invite);
      if (view === "upcoming") return isUpcomingAccepted(invite);
      if (view === "history") return isHistory(invite);
      return true;
    });

    return [...inView].sort((left, right) => {
      if (left.id === highlightedInviteId) return -1;
      if (right.id === highlightedInviteId) return 1;
      const leftPriority = needsFeedback(left) ? 0 : canRespondToInvite(left) ? 1 : 2;
      const rightPriority = needsFeedback(right) ? 0 : canRespondToInvite(right) ? 1 : 2;
      return (
        leftPriority - rightPriority ||
        new Date(left.sessionStartTime).getTime() -
          new Date(right.sessionStartTime).getTime()
      );
    });
  }, [data?.data?.items, highlightedInviteId, search, view]);

  const allItems = data?.data?.items ?? [];
  const awaitingResponseCount = allItems.filter(canRespondToInvite).length;
  const upcomingCount = allItems.filter(isUpcomingAccepted).length;
  const feedbackCount = allItems.filter(needsFeedback).length;
  const totalCount = data?.data?.totalCount ?? allItems.length;

  async function respond(invite: ClassSessionExpert, accept: boolean) {
    setBusyId(invite.id);
    try {
      if (accept) {
        await acceptClassSessionExpert(invite.id);
        showAppSuccess({
          title: "Đã nhận lời mời",
          description: `Bạn sẽ đồng hành buổi “${invite.sessionTitle || "buổi học"}”.`,
        });
      } else {
        await declineClassSessionExpert(invite.id);
        showAppSuccess({
          title: "Đã từ chối lời mời",
          description: "Quản lý lớp sẽ được thông báo để sắp xếp chuyên gia khác.",
        });
      }
      retry();
    } catch (error) {
      showAppErrorFromUnknown(
        error,
        accept ? "coteach.accept" : "coteach.decline",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function saveFeedback(
    invite: ClassSessionExpert,
    comment: string,
    rating: number,
  ) {
    setBusyId(invite.id);
    try {
      await submitClassSessionExpertFeedback(invite.id, { comment, rating });
      showAppSuccess({
        title: "Đã lưu nhận xét",
        description: `Nhận xét cho buổi “${invite.sessionTitle || "buổi học"}” đã được gửi.`,
      });
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "coteach.feedback");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ExpertWorkbenchHero
        eyebrow="Đồng hành theo phiên lớp"
        title="Lịch đồng hành chuyên môn"
        description="Xác nhận lời mời, chuẩn bị phiên chuyên môn, rồi gửi phản hồi cho mentor sau buổi."
        icon={CalendarDays}
        actions={
          <Button nativeButton={false} render={<Link href="/expert/programs" />} variant="outline" className="h-10 gap-2 rounded-xl">
            Bàn cố vấn chương trình <ArrowRight className="size-4" />
          </Button>
        }
      >
        <ExpertWorkflowRail
          steps={[
            {
              label: "Trước buổi",
              detail: "Xác nhận lịch và kiểm tra xung đột.",
              state: awaitingResponseCount > 0 ? "current" : "done",
            },
            {
              label: "Chuẩn bị",
              detail: "Nắm tên phiên, lớp và hình thức tổ chức.",
              state:
                awaitingResponseCount > 0
                  ? "next"
                  : upcomingCount > 0
                    ? "current"
                    : "done",
            },
            {
              label: "Trong buổi",
              detail: "Quan sát cách triển khai và phối hợp chuyên môn.",
              state: "next",
            },
            {
              label: "Sau buổi",
              detail: "Gửi phản hồi để mentor có hành động tiếp theo.",
              state: feedbackCount > 0 ? "current" : "next",
            },
          ]}
        />
      </ExpertWorkbenchHero>

      <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex flex-col gap-4 border-b border-border bg-background/70 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">Chương trình làm việc</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{totalCount} phiên được ghi nhận · ưu tiên việc cần xử lý trước.</p>
            </div>
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
              {([
                ["action", "Cần xử lý"],
                ["upcoming", "Lịch đã nhận"],
                ["history", "Đã hoàn tất"],
                ["all", "Tất cả"],
              ] as const).map(([value, label]) => (
                <Button key={value} type="button" variant="ghost" size="sm" onClick={() => setView(value)} className={cn("h-8 shrink-0 rounded-lg px-3 text-xs", view === value && "bg-foreground text-background hover:bg-foreground/90 hover:text-background")}>
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <ManagerFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm theo tên buổi học hoặc lớp..."
            filters={[
              {
                key: "status",
                placeholder: "Trạng thái",
                value: status,
                onChange: (value) => {
                  markLoading();
                  setStatus(value || "all");
                },
                options: STATUS_OPTIONS,
              },
            ]}
            showClear={search !== "" || status !== "all"}
            onClearFilters={() => {
              markLoading();
              setSearch("");
              setStatus("all");
            }}
          />

          <div className="p-4 sm:p-5">
            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-40 w-full rounded-2xl" />
                ))}
              </div>
            ) : invites.length === 0 ? (
              <ManagerEmptyState
                icon={view === "history" ? History : ShieldCheck}
                title={view === "action" ? "Bạn đã xử lý mọi việc" : "Không có buổi phù hợp"}
                description={view === "action" ? "Không có lời mời hoặc phản hồi sau buổi nào đang chờ bạn." : "Thử đổi chế độ xem, từ khóa hoặc bộ lọc trạng thái."}
              />
            ) : (
              <ul className="space-y-4">
                {invites.map((invite) => (
                  <InviteCard
                    key={invite.id}
                    invite={invite}
                    isHighlighted={invite.id === highlightedInviteId}
                    isBusy={busyId === invite.id}
                    onRespond={respond}
                    onSaveFeedback={saveFeedback}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteCard({
  invite,
  isHighlighted,
  isBusy,
  onRespond,
  onSaveFeedback,
}: {
  invite: ClassSessionExpert;
  isHighlighted: boolean;
  isBusy: boolean;
  onRespond: (invite: ClassSessionExpert, accept: boolean) => Promise<void>;
  onSaveFeedback: (
    invite: ClassSessionExpert,
    comment: string,
    rating: number,
  ) => Promise<void>;
}) {
  const badge = STATUS_BADGE[invite.status];
  const schedule = formatClassSessionSchedule(
    invite.sessionStartTime,
    invite.sessionEndTime,
  );
  const needsAction = canRespondToInvite(invite) || needsFeedback(invite);
  const canGiveFeedback =
    needsFeedback(invite) ||
    (invite.status === "Accepted" &&
      invite.sessionStatus === "Completed" &&
      invite.mentorFeedback != null);
  const canRespond = canRespondToInvite(invite);
  const stageLabel = needsFeedback(invite)
    ? "Cần gửi phản hồi"
    : canRespond
      ? "Chờ xác nhận"
      : invite.sessionStatus === "InProgress"
        ? "Đang diễn ra"
        : isUpcomingAccepted(invite)
          ? "Sắp diễn ra"
          : invite.sessionStatus === "Cancelled"
            ? "Đã hủy"
            : invite.status === "Declined"
              ? "Đã từ chối"
              : "Đã hoàn tất";

  const timeLabel = schedule.end
    ? `${schedule.start.time}–${schedule.end.time}`
    : schedule.start.time;

  return (
    <li
      id={`engagement-${invite.id}`}
      className={cn(
        "rounded-2xl border border-border bg-card p-4 sm:p-5",
        needsAction && "bg-muted/25",
        isHighlighted && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex w-[9.5rem] shrink-0 flex-col justify-center rounded-xl border border-border bg-background px-3.5 py-3 sm:w-[10.5rem]">
            <p className="whitespace-nowrap font-mono text-lg font-bold tabular-nums tracking-tight text-foreground sm:text-xl">
              {timeLabel}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
              {schedule.start.date}
            </p>
            {schedule.relative ? (
              <p className="mt-2 w-fit rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {schedule.relative}
              </p>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "rounded-md text-[11px] font-semibold",
                  needsAction
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-foreground",
                )}
              >
                {stageLabel}
              </Badge>
              <Badge
                className={cn(
                  "rounded-md text-[11px] font-semibold",
                  badge.className,
                )}
              >
                {badge.label}
              </Badge>
            </div>

            <h3 className="mt-2 font-heading text-base font-bold text-foreground">
              {invite.sessionTitle || "Buổi học chưa đặt tên"}
            </h3>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>{invite.className || "Lớp chưa đặt tên"}</span>
              <span aria-hidden className="text-border">
                ·
              </span>
              <span>{CLASS_SESSION_KIND_LABELS[invite.sessionKind]}</span>
              <span aria-hidden className="text-border">
                ·
              </span>
              <span>{CLASS_SESSION_STATUS_LABELS[invite.sessionStatus]}</span>
            </p>
          </div>
        </div>

        {canRespond ? (
          <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button
              type="button"
              disabled={isBusy}
              onClick={() => void onRespond(invite, true)}
              className="h-10 gap-1.5 rounded-xl bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90"
            >
              <Check className="size-4" />
              Nhận lời
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => void onRespond(invite, false)}
              className="h-10 gap-1.5 rounded-xl border-border px-4 text-sm font-semibold"
            >
              <X className="size-4" />
              Từ chối
            </Button>
          </div>
        ) : null}
      </div>

      {canRespond && invite.scheduleConflictWarning ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          <TriangleAlert className="mt-px size-4 shrink-0" />
          {invite.scheduleConflictWarning}
        </p>
      ) : null}

      {canGiveFeedback ? (
        <FeedbackForm
          key={invite.mentorFeedbackAt ?? "draft"}
          invite={invite}
          isBusy={isBusy}
          onSubmit={(comment, rating) => onSaveFeedback(invite, comment, rating)}
        />
      ) : invite.status === "Accepted" &&
        invite.sessionStatus !== "Cancelled" &&
        invite.sessionStatus !== "Completed" ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-background/50 px-3 py-2.5 text-xs text-muted-foreground">
          Nhận xét chuyên môn sẽ mở khi buổi học hoàn thành.
        </p>
      ) : null}
    </li>
  );
}

function FeedbackForm({
  invite,
  isBusy,
  onSubmit,
}: {
  invite: ClassSessionExpert;
  isBusy: boolean;
  onSubmit: (comment: string, rating: number) => Promise<void>;
}) {
  const [comment, setComment] = useState(invite.mentorFeedback ?? "");
  const [rating, setRating] = useState(invite.mentorFeedbackRating ?? 0);
  const [error, setError] = useState<string | null>(null);
  const hasFeedback = invite.mentorFeedback != null;

  function handleSubmit() {
    const trimmed = comment.trim();
    if (!trimmed) {
      setError("Vui lòng nhập nhận xét cho buổi học.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Vui lòng chọn mức đánh giá từ 1 đến 5 sao.");
      return;
    }
    setError(null);
    void onSubmit(trimmed, rating);
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <MessageSquare className="size-4 text-primary" />
          Phản hồi cho mentor sau buổi
        </h4>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              disabled={isBusy}
              onClick={() => setRating(value)}
              aria-label={`Đánh giá ${value} sao`}
              aria-pressed={rating === value}
              className="rounded-md p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
            >
              <Star
                className={cn(
                  "size-5",
                  value <= rating
                    ? "fill-[#FDD835] text-[#FDD835]"
                    : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <Textarea
        rows={3}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        disabled={isBusy}
        placeholder="Nêu điều đã diễn ra tốt, điểm mentor nên điều chỉnh và đề xuất cho buổi tiếp theo."
        aria-label={`Nhận xét cho buổi ${invite.sessionTitle || "học"}`}
        className="rounded-xl border-input bg-card"
      />

      {error ? <p className="text-xs font-medium text-primary">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-muted-foreground">
          {hasFeedback
            ? "Nhận xét đã gửi — bạn có thể chỉnh sửa và lưu lại."
            : "Đánh giá mức độ phối hợp và triển khai buổi học; phản hồi được chia sẻ với mentor và quản lý lớp."}
        </p>
        <Button
          type="button"
          disabled={isBusy}
          onClick={handleSubmit}
          className="h-10 w-full rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 sm:w-auto"
        >
          {isBusy ? "Đang lưu..." : hasFeedback ? "Cập nhật nhận xét" : "Gửi nhận xét"}
        </Button>
      </div>
    </div>
  );
}
