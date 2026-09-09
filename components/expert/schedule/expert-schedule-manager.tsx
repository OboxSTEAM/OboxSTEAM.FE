"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  MessageSquare,
  Star,
  TriangleAlert,
  X,
} from "lucide-react";

import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerFilterBar } from "@/components/manager/shared/filter-bar";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
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

function formatSessionRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime())) return "—";

  const day = new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(startDate);
  const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const startTime = timeFormatter.format(startDate);
  const endTime = Number.isNaN(endDate.getTime())
    ? null
    : timeFormatter.format(endDate);

  return endTime ? `${day} · ${startTime}–${endTime}` : `${day} · ${startTime}`;
}

export function ExpertScheduleManager() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
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

    return [...filtered].sort(
      (left, right) =>
        new Date(left.sessionStartTime).getTime() -
        new Date(right.sessionStartTime).getTime(),
    );
  }, [data?.data?.items, search]);

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
      <ManagerPageHeader
        title="Lịch đồng hành"
        description="Các buổi đồng hành, phản biện và cố vấn chuyên môn của bạn."
        breadcrumbs={[{ label: "Lịch đồng hành" }]}
      />

      <div className="px-6 pb-12">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
          <div className="flex items-center justify-between border-b border-border bg-background/70 px-6 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              <span className="font-mono font-bold text-foreground">
                {invites.length}
              </span>{" "}
              buổi đồng hành
            </p>
            <p className="text-xs text-muted-foreground">
              Nhận xét chỉ mở sau khi buổi học hoàn thành.
            </p>
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

          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-40 w-full rounded-2xl" />
                ))}
              </div>
            ) : invites.length === 0 ? (
              <ManagerEmptyState
                icon={CalendarDays}
                title="Chưa có buổi đồng hành"
                description="Khi được xếp lịch đồng hành cùng lớp học, các buổi sắp tới sẽ hiển thị tại đây."
              />
            ) : (
              <ul className="space-y-4">
                {invites.map((invite) => (
                  <InviteCard
                    key={invite.id}
                    invite={invite}
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
  isBusy,
  onRespond,
  onSaveFeedback,
}: {
  invite: ClassSessionExpert;
  isBusy: boolean;
  onRespond: (invite: ClassSessionExpert, accept: boolean) => Promise<void>;
  onSaveFeedback: (
    invite: ClassSessionExpert,
    comment: string,
    rating: number,
  ) => Promise<void>;
}) {
  const badge = STATUS_BADGE[invite.status];
  const canGiveFeedback =
    invite.status === "Accepted" && invite.sessionStatus === "Completed";

  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_10px_rgba(45,45,45,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-sm font-bold text-foreground">
              {invite.sessionTitle || "Buổi học chưa đặt tên"}
            </h3>
            <Badge className={cn("rounded-md text-[11px] font-semibold", badge.className)}>
              {badge.label}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-md border-border text-[11px] font-medium text-muted-foreground"
            >
              {CLASS_SESSION_KIND_LABELS[invite.sessionKind]}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-md border-border text-[11px] font-medium text-muted-foreground"
            >
              {CLASS_SESSION_STATUS_LABELS[invite.sessionStatus]}
            </Badge>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {invite.className || "Lớp chưa đặt tên"} ·{" "}
            {formatSessionRange(invite.sessionStartTime, invite.sessionEndTime)}
          </p>
        </div>

        {invite.status === "Invited" ? (
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              disabled={isBusy}
              onClick={() => void onRespond(invite, true)}
              className="h-10 gap-1.5 rounded-xl bg-[#7CB342] px-4 text-sm font-semibold text-white hover:bg-[#7CB342]/90"
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

      {invite.status === "Invited" && invite.scheduleConflictWarning ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#FDD835]/50 bg-[#FDD835]/12 p-3 text-xs leading-relaxed text-[#725D00] dark:text-[#fde047]">
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
      ) : invite.status === "Accepted" ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Nhận xét chuyên môn sẽ mở khi buổi học chuyển sang trạng thái Hoàn thành.
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
          Nhận xét chuyên môn
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
        placeholder="Học viên tiếp thu ra sao, nội dung nào cần củng cố..."
        aria-label={`Nhận xét cho buổi ${invite.sessionTitle || "học"}`}
        className="rounded-xl border-input bg-card"
      />

      {error ? <p className="text-xs font-medium text-primary">{error}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          {hasFeedback
            ? "Nhận xét đã gửi — bạn có thể chỉnh sửa và lưu lại."
            : "Nhận xét sẽ được chia sẻ với mentor và quản lý lớp."}
        </p>
        <Button
          type="button"
          disabled={isBusy}
          onClick={handleSubmit}
          className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          {isBusy ? "Đang lưu..." : hasFeedback ? "Cập nhật nhận xét" : "Gửi nhận xét"}
        </Button>
      </div>
    </div>
  );
}
