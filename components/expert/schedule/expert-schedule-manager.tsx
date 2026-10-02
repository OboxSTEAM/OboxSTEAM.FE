"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  History,
  MessageSquare,
  ShieldCheck,
  Star,
  TriangleAlert,
  X,
} from "lucide-react";

import { ExpertWorkbenchHero } from "@/components/expert/shared/expert-workbench";
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
  type ClassSessionStatus,
} from "@/lib/api";
import {
  CLASS_SESSION_KIND_LABELS,
  CLASS_SESSION_STATUS_LABELS,
} from "@/lib/classes/constants";
import {
  effectiveSessionStatus,
  formatClassSessionSchedule,
} from "@/lib/classes/session-helpers";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

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

function displaySessionStatus(invite: ClassSessionExpert): ClassSessionStatus {
  return effectiveSessionStatus({
    status: invite.sessionStatus,
    sessionKind: invite.sessionKind,
    startTime: invite.sessionStartTime,
    endTime: invite.sessionEndTime,
  });
}

function canRespondToInvite(invite: ClassSessionExpert): boolean {
  return invite.status === "Invited" && displaySessionStatus(invite) === "Scheduled";
}

/** BE accepts feedback only once the server marks the session Completed, not when its slot merely ends. */
function canSubmitFeedback(invite: ClassSessionExpert): boolean {
  return invite.status === "Accepted" && invite.sessionStatus === "Completed";
}

function needsFeedback(invite: ClassSessionExpert): boolean {
  return canSubmitFeedback(invite) && invite.mentorFeedback == null;
}

function isUpcomingAccepted(invite: ClassSessionExpert): boolean {
  const sessionStatus = displaySessionStatus(invite);
  return (
    invite.status === "Accepted" &&
    (sessionStatus === "Scheduled" || sessionStatus === "InProgress")
  );
}

function isHistory(invite: ClassSessionExpert): boolean {
  const sessionStatus = displaySessionStatus(invite);
  return (
    invite.status === "Declined" ||
    sessionStatus === "Cancelled" ||
    (sessionStatus === "Completed" && !needsFeedback(invite))
  );
}

export function ExpertScheduleManager() {
  const searchParams = useSearchParams();
  const highlightedInviteId = searchParams.get("invite");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ScheduleView>("action");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading, retry } = useClientFetch({
    fetcher: () => getMyClassSessionExperts({ page: 1, pageSize: PAGE_SIZE }),
    deps: [],
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

  const totalCount = data?.data?.totalCount ?? data?.data?.items.length ?? 0;

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
      />

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
            showClear={search !== ""}
            onClearFilters={() => setSearch("")}
          />

          <div className="p-4 sm:p-5">
            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-32 w-full rounded-2xl" />
                ))}
              </div>
            ) : invites.length === 0 ? (
              <ManagerEmptyState
                icon={view === "history" ? History : ShieldCheck}
                title={view === "action" ? "Bạn đã xử lý mọi việc" : "Không có buổi phù hợp"}
                description={view === "action" ? "Không có lời mời hoặc phản hồi sau buổi nào đang chờ bạn." : "Thử đổi chế độ xem, từ khóa hoặc bộ lọc trạng thái."}
              />
            ) : (
              <ul className="space-y-3">
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
  const canGiveFeedback = canSubmitFeedback(invite);
  const canRespond = canRespondToInvite(invite);
  const awaitingFeedback = needsFeedback(invite);

  const actionChip = awaitingFeedback
    ? {
        label: "Cần phản hồi",
        Icon: MessageSquare,
        className: "bg-primary/10 text-primary",
      }
    : canRespond
      ? {
          label: "Chờ xác nhận",
          Icon: Clock,
          className: "bg-[#FDD835]/25 text-[#725D00] dark:text-[#fde047]",
        }
      : displaySessionStatus(invite) === "InProgress"
        ? {
            label: "Đang diễn ra",
            Icon: Clock,
            className: "bg-accent/15 text-[#0277BD]",
          }
        : null;

  const timeLabel = schedule.end
    ? `${schedule.start.time}–${schedule.end.time}`
    : schedule.start.time;

  return (
    <li
      id={`engagement-${invite.id}`}
      className={cn(
        "rounded-2xl border border-border bg-card p-4 sm:p-5",
        isHighlighted &&
          "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
        <div className="shrink-0 sm:w-[9.75rem] sm:border-r sm:border-border sm:pr-5">
          <p className="font-mono text-xl font-bold tabular-nums tracking-tight text-foreground">
            {timeLabel}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {schedule.start.date}
          </p>
          {schedule.relative ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {schedule.relative}
            </p>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {actionChip ? (
                  <Badge
                    className={cn(
                      "gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                      actionChip.className,
                    )}
                  >
                    <actionChip.Icon
                      className="size-3"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    {actionChip.label}
                  </Badge>
                ) : (
                  <Badge
                    className={cn(
                      "rounded-md text-[11px] font-semibold",
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </Badge>
                )}
              </div>

              <h3 className="mt-1.5 font-heading text-base font-bold text-foreground">
                {invite.sessionTitle || "Buổi học chưa đặt tên"}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {invite.className || "Lớp chưa đặt tên"}
                <span className="text-border"> · </span>
                {CLASS_SESSION_KIND_LABELS[invite.sessionKind]}
                <span className="text-border"> · </span>
                {CLASS_SESSION_STATUS_LABELS[displaySessionStatus(invite)]}
              </p>

              <Link
                href={`/expert/programs/${invite.programId}`}
                className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Xem chương trình &amp; trao đổi với quản lý
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>

            {canRespond ? (
              <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto">
                <Button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void onRespond(invite, true)}
                  className="h-9 gap-1.5 rounded-xl bg-foreground px-3.5 text-sm font-semibold text-background hover:bg-foreground/90"
                >
                  <Check className="size-4" />
                  Nhận lời
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => void onRespond(invite, false)}
                  className="h-9 gap-1.5 rounded-xl px-3.5 text-sm font-semibold"
                >
                  <X className="size-4" />
                  Từ chối
                </Button>
              </div>
            ) : null}
          </div>

          {canRespond && invite.scheduleConflictWarning ? (
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
              <TriangleAlert className="mt-px size-3.5 shrink-0" />
              {invite.scheduleConflictWarning}
            </p>
          ) : null}

          {canGiveFeedback ? (
            <FeedbackForm
              key={invite.mentorFeedbackAt ?? "draft"}
              invite={invite}
              isBusy={isBusy}
              onSubmit={(comment, rating) =>
                onSaveFeedback(invite, comment, rating)
              }
            />
          ) : null}
        </div>
      </div>
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
      setError("Vui lòng nhập nhận xét.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Chọn đánh giá 1–5 sao.");
      return;
    }
    setError(null);
    void onSubmit(trimmed, rating);
  }

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <Textarea
        rows={3}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        disabled={isBusy}
        placeholder="Điều tốt, điểm cần chỉnh, đề xuất buổi sau…"
        aria-label={`Nhận xét cho buổi ${invite.sessionTitle || "học"}`}
        className="min-h-[4.5rem] rounded-xl border-border bg-background"
      />

      {error ? <p className="text-xs font-medium text-primary">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2.5">
        <div
          className="flex items-center rounded-lg border border-border bg-background px-2 py-1.5"
          role="group"
          aria-label="Đánh giá sao"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              disabled={isBusy}
              onClick={() => setRating(value)}
              aria-label={`Đánh giá ${value} sao`}
              aria-pressed={rating === value}
              className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
            >
              <Star
                className={cn(
                  "size-5",
                  value <= rating
                    ? "fill-[#FDD835] text-[#FDD835]"
                    : "text-muted-foreground/35",
                )}
              />
            </button>
          ))}
        </div>

        <Button
          type="button"
          disabled={isBusy}
          onClick={handleSubmit}
          className="h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
        >
          {isBusy ? "Đang lưu…" : hasFeedback ? "Cập nhật" : "Gửi nhận xét"}
        </Button>
      </div>
    </div>
  );
}
